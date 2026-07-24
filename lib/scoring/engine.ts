/**
 * Assessment engine orchestrator — ties together the P2-3/4/5/6 pieces
 * (opportunity.ts, track-fit.ts, safety-gate.ts, confidence.ts,
 * contradictions.ts) into one call that takes everything Sage logged
 * during a single conversation (see app/api/intake/chat/route.ts) and
 * returns the deterministic recommendation: which tracks are eligible,
 * how each scores, and which 2-3 to actually recommend.
 *
 * This is the decision layer. Sage (the LLM) never picks tracks anymore —
 * it logs structured answers conversationally, and this function decides.
 * Sage's only remaining job downstream of this is writing the natural-
 * language rationale for whichever tracks this function selects.
 */
import { TRACKS } from "@/lib/tracks";
import { DOMAINS, type DemographicAnswers, ALL_DOMAIN_FIELDS } from "./domains";
import { normalizeItem } from "./normalize";
import { domainOpportunityScore } from "./opportunity";
import { trackFitScore, type TrackFitInputs } from "./track-fit";
import { safetyGate, type SafetyGateIntake, type SafetyGateResult } from "./safety-gate";
import { confidenceScore } from "./confidence";
import { checkContradictions, type ContradictionFlag } from "./contradictions";
import {
  goalAlignment,
  formatPreference,
  likelyAdherence,
  lifestyleCompatibility,
  type PrimaryGoalCode,
  type FormatCode,
  type RoutineConsistencyCode,
} from "./track-fit-inputs";

export type StructuredAnswer = { field: string; value: unknown };

export type EngineDomainResult = {
  key: string;
  label: string;
  trackId: string;
  /** null if the subscriber wasn't shown/asked enough of this domain to score it. */
  opportunityScore: number | null;
  itemsAnswered: number;
  itemsTotal: number;
  /** Raw 1-5 interference rating for this domain (how much it interferes
   * with daily life), null if never asked/answered. Already folded into
   * opportunityScore's multiplier — exposed separately here because some
   * downstream consumers (e.g. the LIFE Brief's vitalityIndex priority
   * weighting, lib/life-brief/adapter.ts) need the raw rating itself, not
   * just its effect on the opportunity score. */
  interferenceRating: number | null;
};

export type EngineTrackResult = {
  trackId: string;
  eligible: boolean;
  reasons: string[];
  trackFitScore: number | null;
  trackFitInputs: TrackFitInputs | null;
};

export type EngineResult = {
  domains: EngineDomainResult[];
  tracks: EngineTrackResult[];
  /** Ranked, safety-gate-eligible track ids — primary first. 0-3 entries. */
  recommendedTrackIds: string[];
  confidenceScore: number;
  contradictionFlags: ContradictionFlag[];
  /** true if a hard-error contradiction fired (e.g. impossible demographic
   * combination) — the caller must block completion rather than proceed. */
  hardBlock: boolean;
  safetyGate: Record<string, SafetyGateResult>;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim() !== "") return [value];
  return [];
}

export function runAssessmentEngine(
  answers: StructuredAnswer[],
  activeSafetyFlags: { flag_type: string; value: string }[]
): EngineResult {
  // Last logged value per field wins — a subscriber's answer can be
  // revisited/refined later in the same conversation.
  const answerMap = new Map<string, unknown>();
  for (const a of answers) answerMap.set(a.field, a.value);

  const demographics: DemographicAnswers = {
    age: toNumber(answerMap.get("age")) ?? undefined,
    sex: (answerMap.get("sex") as DemographicAnswers["sex"]) ?? undefined,
    post_menopausal: toBoolean(answerMap.get("post_menopausal")),
  };

  const hasPregnancyNursingFlag = activeSafetyFlags.some((f) => f.flag_type === "pregnancy_nursing");
  const allergyValues = [
    ...activeSafetyFlags.filter((f) => f.flag_type === "allergy").map((f) => f.value),
    ...toStringArray(answerMap.get("allergies")),
  ];

  const safetyIntake: SafetyGateIntake = {
    age: demographics.age,
    sex: demographics.sex,
    pregnant: hasPregnancyNursingFlag || toBoolean(answerMap.get("pregnant")),
    nursing: hasPregnancyNursingFlag || toBoolean(answerMap.get("nursing")),
    hormonal_contraceptive: toBoolean(answerMap.get("hormonal_contraceptive")),
    fertility_treatment: toBoolean(answerMap.get("fertility_treatment")),
    iodine_sensitive: toBoolean(answerMap.get("iodine_sensitive")),
    choking_risk: toBoolean(answerMap.get("choking_risk")),
    allergies: allergyValues,
    auddisorder_context_flagged: toBoolean(answerMap.get("auddisorder_context_flagged")),
    requesting_hemp_variant: toBoolean(answerMap.get("requesting_hemp_variant")),
  };

  const gate = safetyGate(safetyIntake);

  // --- Domain Opportunity Scores (P2-3) ---
  const domainResults: EngineDomainResult[] = [];
  const allItemScoresForStraightlining: number[] = [];
  let scorableFieldsTotal = 0;
  let scorableFieldsAnswered = 0;

  for (const domain of DOMAINS) {
    const shown = domain.shownIf ? domain.shownIf(demographics) : true;
    if (!shown) {
      domainResults.push({
        key: domain.key,
        label: domain.label,
        trackId: domain.trackId,
        opportunityScore: null,
        itemsAnswered: 0,
        itemsTotal: 0,
        interferenceRating: null,
      });
      continue;
    }

    scorableFieldsTotal += domain.items.length + 1; // + interference question

    const itemScores: number[] = [];
    for (const item of domain.items) {
      const raw = toNumber(answerMap.get(item.field));
      if (raw == null) continue;
      scorableFieldsAnswered += 1;
      const normalized = normalizeItem(raw, 5, item.reverse);
      itemScores.push(normalized);
      allItemScoresForStraightlining.push(normalized);
    }

    const interferenceRaw = toNumber(answerMap.get(domain.interferenceField));
    if (interferenceRaw != null) scorableFieldsAnswered += 1;

    const opportunityScore =
      itemScores.length > 0
        ? domainOpportunityScore(itemScores, interferenceRaw ?? 3)
        : null;

    domainResults.push({
      key: domain.key,
      label: domain.label,
      trackId: domain.trackId,
      opportunityScore,
      itemsAnswered: itemScores.length,
      itemsTotal: domain.items.length,
      interferenceRating: interferenceRaw,
    });
  }

  // --- Goal / lifestyle / format inputs (feed Track-Fit only, P2-1) ---
  const primaryGoal = (answerMap.get("primary_goal") as PrimaryGoalCode | undefined) ?? null;
  const preferredFormats = toStringArray(answerMap.get("format_preference")) as FormatCode[];
  const routineConsistency =
    (answerMap.get("routine_consistency") as RoutineConsistencyCode | undefined) ?? null;
  const lifestyleConstraintsText = (answerMap.get("lifestyle_constraints") as string | undefined) ?? null;
  const activityFrequency = toNumber(answerMap.get("activity_frequency"));

  for (const field of ["primary_goal", "format_preference", "routine_consistency", "lifestyle_constraints"]) {
    scorableFieldsTotal += 1;
    if (answerMap.has(field)) scorableFieldsAnswered += 1;
  }

  // --- Track-Fit Engine (P2-4) — only safety-gate-eligible tracks score at all ---
  const trackResults: EngineTrackResult[] = TRACKS.map((track) => {
    const gateResult = gate[track.id] ?? { eligible: true, reasons: [] };
    if (!gateResult.eligible) {
      return { trackId: track.id, eligible: false, reasons: gateResult.reasons, trackFitScore: null, trackFitInputs: null };
    }

    const domain = domainResults.find((d) => d.trackId === track.id);
    // A domain that was never surfaced in conversation still gets scored
    // with a neutral 50/100 opportunity baseline rather than being
    // excluded outright — sparse data should degrade the recommendation's
    // confidence (see confidenceScore below), not silently drop tracks
    // from consideration.
    const domainOpportunityPct = domain?.opportunityScore ?? 50;

    const inputs: TrackFitInputs = {
      goalAlignment: goalAlignment(track.id, primaryGoal),
      domainOpportunityPct,
      lifestyleCompatibility: lifestyleCompatibility(
        DOMAINS.find((d) => d.trackId === track.id),
        track.format,
        lifestyleConstraintsText,
        activityFrequency
      ),
      likelyAdherence: likelyAdherence(routineConsistency),
      formatPreference: formatPreference(track.format, preferredFormats.length ? preferredFormats : null),
    };

    return {
      trackId: track.id,
      eligible: true,
      reasons: gateResult.reasons,
      trackFitScore: trackFitScore(inputs),
      trackFitInputs: inputs,
    };
  });

  const rankedEligible = trackResults
    .filter((t) => t.eligible && t.trackFitScore != null)
    .sort((a, b) => (b.trackFitScore ?? 0) - (a.trackFitScore ?? 0));

  const recommendedTrackIds: string[] = [];
  if (rankedEligible[0]) recommendedTrackIds.push(rankedEligible[0].trackId);
  if (rankedEligible[1]) recommendedTrackIds.push(rankedEligible[1].trackId);
  if (
    rankedEligible[2] &&
    (rankedEligible[2].trackFitScore ?? 0) >= (rankedEligible[1]?.trackFitScore ?? 0) - 15
  ) {
    recommendedTrackIds.push(rankedEligible[2].trackId);
  }

  // --- Confidence / Data-Quality Score (P2-5) ---
  const confidence = confidenceScore(
    allItemScoresForStraightlining,
    scorableFieldsAnswered,
    Math.max(scorableFieldsTotal, 1),
    0 // contradiction penalty applied below, after we know the flag count
  );

  // --- Contradiction rules (P2-6) ---
  const contradictionFlags = checkContradictions(
    {
      afternoon_energy: toNumber(answerMap.get("afternoon_energy")) ?? undefined,
      exertion_recovery: toNumber(answerMap.get("exertion_recovery")) ?? undefined,
      sleep_quality: toNumber(answerMap.get("sleep_quality")) ?? undefined,
      racing_mind: toNumber(answerMap.get("racing_mind")) ?? undefined,
    },
    { ...safetyIntake, post_menopausal: demographics.post_menopausal }
  );

  const finalConfidence = Math.max(0, confidence - 10 * contradictionFlags.length);

  return {
    domains: domainResults,
    tracks: trackResults,
    recommendedTrackIds,
    confidenceScore: Math.round(finalConfidence * 10) / 10,
    contradictionFlags,
    hardBlock: contradictionFlags.some((f) => f.hardError),
    safetyGate: gate,
  };
}

// Re-export the field taxonomy so callers building the intake prompt don't
// need to import from ./domains directly.
export { ALL_DOMAIN_FIELDS };
