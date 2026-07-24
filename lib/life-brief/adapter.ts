/**
 * Real-data adapter for the LIFE Brief report — maps a subscriber's
 * actual `track_assignments` + `profiles` rows to the 9 component prop
 * types in lib/life-brief/types.ts. Used by app/dashboard/brief/page.tsx.
 *
 * Every function here returns `Props | null` — null means "the real data
 * needed for this section doesn't exist yet, skip it," never "render
 * something fabricated." Handles two real, current conditions in
 * production data, not hypotheticals:
 *   1. Pre-engine track_assignments rows (domain_scores etc. are NULL —
 *      this is the actual state of the one real account on file as of
 *      2026-07-24, predating lib/scoring/). Domain-dependent sections
 *      return null for these rows rather than crashing or rendering
 *      broken UI; track/rationale-based sections still work fine, since
 *      `tracks`/`rationale` predate the engine too.
 *   2. Fields with no real data source at all (see the GAP comments in
 *      lib/life-brief/types.ts) — each is handled explicitly below,
 *      either with a labeled provisional/heuristic derivation or an
 *      honest placeholder. Nothing is fabricated wholesale.
 */
import { findTrack } from "@/lib/tracks";
import { parseRationale } from "@/lib/rationale";
import type {
  EngineDomainResult,
  ContradictionFlag,
  SafetyGateResult,
} from "@/lib/scoring";
import type {
  LifeRevelationProps,
  LifeIndexProps,
  BenchmarkMetric,
  PatternMapProps,
  TrackCardProps,
  IngredientIntelligenceProps,
  DailyRhythmProps,
  RoadmapProps,
  RoadmapPhase,
  ShareCardProps,
  ProgressComparisonProps,
  ProgressSnapshot,
} from "./types";

export type TrackAssignmentRow = {
  tracks: string[] | null;
  rationale: string | null;
  domain_scores: EngineDomainResult[] | null;
  confidence_score: number | null;
  contradiction_flags: ContradictionFlag[] | null;
  safety_gate: Record<string, SafetyGateResult> | null;
  assigned_at: string | null;
};

export type ProfileRow = {
  water_intake_recommendation: string | null;
  fasting_recommendation: string | null;
  travel_frequency: string | null;
  work_environment: string | null;
};

export type LifeBriefContext = {
  trackIds: string[];
  rationale: ReturnType<typeof parseRationale>;
  domainScores: EngineDomainResult[] | null;
  confidenceScore: number | null;
  contradictionFlags: ContradictionFlag[];
  safetyGate: Record<string, SafetyGateResult> | null;
  profile: ProfileRow | null;
};

export function buildLifeBriefContext(row: TrackAssignmentRow, profile: ProfileRow | null): LifeBriefContext {
  return {
    trackIds: row.tracks ?? [],
    rationale: parseRationale(row.rationale),
    domainScores: row.domain_scores,
    confidenceScore: row.confidence_score,
    contradictionFlags: row.contradiction_flags ?? [],
    safetyGate: row.safety_gate,
    profile,
  };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function scoredDomains(domainScores: EngineDomainResult[]): (EngineDomainResult & { opportunityScore: number })[] {
  return domainScores.filter(
    (d): d is EngineDomainResult & { opportunityScore: number } => d.opportunityScore != null
  );
}

/** Highest opportunityScore = the domain with the most room for
 * improvement, i.e. the top priority — not the domain someone is doing
 * best in. Returns null if no domain has been scored yet. */
function getTopDomain(domainScores: EngineDomainResult[]): (EngineDomainResult & { opportunityScore: number }) | null {
  const scored = scoredDomains(domainScores).sort((a, b) => b.opportunityScore - a.opportunityScore);
  return scored[0] ?? null;
}

function isDomainSafetyGateEligible(domain: EngineDomainResult, safetyGate: Record<string, SafetyGateResult> | null): boolean {
  if (!safetyGate) return true; // no safety gate data on this row — don't exclude on a basis we can't check
  const result = safetyGate[domain.trackId];
  return result ? result.eligible : true;
}

/** itemsAnswered/itemsTotal as a 0-100 completeness ratio. */
function domainCompletenessProxy(domain: EngineDomainResult): number {
  if (domain.itemsTotal === 0) return 0;
  return (domain.itemsAnswered / domain.itemsTotal) * 100;
}

/**
 * v1 priority-weighted vitalityIndex formula, specified 2026-07-24. Same
 * "recalibrate against Phase 4 pilot data" treatment as P2-4's Track-Fit
 * weights (lib/scoring/track-fit.ts) — not Data-Science-final, tagged v1.
 *
 *   vitalityIndex = (sum of (100 - opportunityScore) x weight) / (sum of weight)
 *   weight = 1.5 for the subscriber's top-3 highest-interference domains, 1.0 otherwise
 *   a domain is EXCLUDED from the average entirely (never scored as 0) if:
 *     - it was never scored at all (opportunityScore null), or
 *     - its completeness proxy is below 40, or
 *     - its track is Safety-Gate-ineligible (e.g. opposite-sex exclusion)
 *   if more than 3 of the 9 domains end up excluded -> null ("still
 *   building your picture" state, rendered by LifeIndex.tsx)
 *
 * Two adaptations from the literal spec, both because the data the spec
 * asks for doesn't exist yet in this codebase — flagged here rather than
 * silently guessed:
 *  1. "top-3 priority during intake" — the intake only captures a single
 *     primary_goal today, not a ranked top-3, so this always uses the
 *     spec's own documented fallback: highest reported degree-of-life-
 *     interference, via each domain's raw interferenceRating
 *     (lib/scoring/engine.ts).
 *  2. "if a domain's confidence_score is below 40" — there is no
 *     per-domain confidence_score anywhere in the engine (confidenceScore
 *     is assessment-wide, not per-domain). domainCompletenessProxy()
 *     above (itemsAnswered/itemsTotal) is used instead — the same "do we
 *     actually have enough real signal here" intent, at the granularity
 *     that actually exists in this codebase.
 *  3. opportunityScore has inverted semantics vs. "domain_score" as used
 *     in the spec — a HIGH opportunityScore means MORE room to improve,
 *     i.e. things are WORSE there, not better. A "Vitality Index" (and
 *     the compliance-required "general-wellness composite" framing) only
 *     makes sense read as high-is-good, so this inverts each domain's
 *     score (100 - opportunityScore) before weighting/averaging, rather
 *     than averaging opportunityScore directly.
 */
function computeVitalityIndexV1(
  domainScores: EngineDomainResult[],
  safetyGate: Record<string, SafetyGateResult> | null
): number | null {
  const byInterference = domainScores
    .filter((d): d is EngineDomainResult & { interferenceRating: number } => d.interferenceRating != null)
    .sort((a, b) => b.interferenceRating - a.interferenceRating);
  const priorityKeys = new Set(byInterference.slice(0, 3).map((d) => d.key));

  let weightedSum = 0;
  let weightTotal = 0;
  let excludedCount = 0;

  for (const domain of domainScores) {
    if (
      domain.opportunityScore == null ||
      domainCompletenessProxy(domain) < 40 ||
      !isDomainSafetyGateEligible(domain, safetyGate)
    ) {
      excludedCount += 1;
      continue;
    }
    const weight = priorityKeys.has(domain.key) ? 1.5 : 1.0;
    weightedSum += (100 - domain.opportunityScore) * weight;
    weightTotal += weight;
  }

  if (excludedCount > 3 || weightTotal === 0) return null;

  return Math.max(0, Math.min(100, Math.round(weightedSum / weightTotal)));
}

// Compliance requirement (product doc, carried into the 2026-07-24
// formula spec): must always describe this as a general-wellness
// composite — never a medical score, biological-age test, or diagnostic
// measurement.
const VITALITY_INDEX_DISCLAIMER =
  "A general-wellness composite based on what you've shared — not a medical score, biological-age test, diagnostic measurement, or diagnosis.";

/** Heuristic sentence-split of the real one-paragraph rationale into up
 * to 3 discrete items — TrackCardProps.whySelected has no real 3-item
 * source (see the GAP comment on that field in types.ts); this is a
 * labeled approximation, not a claim that Sage generated 3 distinct
 * reasons. */
function splitRationaleIntoReasons(reason: string | undefined, trackName: string): [string, string, string] {
  const sentences = (reason ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return [
    sentences[0] ?? `${trackName} was matched to what you shared during your intake.`,
    sentences[1] ?? "It's formulated to complement your other recommended tracks.",
    sentences[2] ?? "Sage will refine this further as you check in over time.",
  ];
}

function ingredientMatchesCaution(ingredientName: string, caution: string): boolean {
  const cleaned = ingredientName.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
  if (!cleaned) return false;
  return caution.toLowerCase().includes(cleaned);
}

// ---------------------------------------------------------------------------
// P3-1 — Life Revelation
// ---------------------------------------------------------------------------

export function buildLifeRevelationProps(ctx: LifeBriefContext): LifeRevelationProps | null {
  if (!ctx.domainScores || ctx.trackIds.length === 0) return null;
  const top = getTopDomain(ctx.domainScores);
  if (!top) return null;

  const ranked = scoredDomains(ctx.domainScores).sort((a, b) => b.opportunityScore - a.opportunityScore);

  return {
    dominantPattern: top.label,
    sageInterpretation: `Your assessment surfaced ${top.label.toLowerCase()} as the area with the most opportunity right now.`,
    supportingSignals: [0, 1, 2].map(
      (i) => ranked[i]?.label ? `${ranked[i].label}: opportunity score ${ranked[i].opportunityScore}/100` : "Sage is still gathering signal here."
    ) as [string, string, string],
    topOpportunity: top.label,
    botanicalVisualTrackId: ctx.trackIds[0],
    ninetyDayCta: "Your next 90 days begin here.",
  };
}

// ---------------------------------------------------------------------------
// P3-2 — LIFE Index + Benchmarks
// ---------------------------------------------------------------------------

export function buildLifeIndexProps(ctx: LifeBriefContext): LifeIndexProps | null {
  if (!ctx.domainScores || ctx.confidenceScore == null || ctx.trackIds.length === 0) return null;

  const ranked = scoredDomains(ctx.domainScores).sort((a, b) => b.opportunityScore - a.opportunityScore);
  const frictions = ranked.slice(0, 3);
  const strengths = [...ranked].sort((a, b) => a.opportunityScore - b.opportunityScore).slice(0, 3);

  const pad = (items: (EngineDomainResult & { opportunityScore: number })[], template: (d: EngineDomainResult) => string) =>
    [0, 1, 2].map((i) => (items[i] ? template(items[i]) : "Sage is still gathering signal here.")) as [
      string,
      string,
      string,
    ];

  return {
    vitalityIndex: computeVitalityIndexV1(ctx.domainScores, ctx.safetyGate),
    vitalityIndexDisclaimer: VITALITY_INDEX_DISCLAIMER,
    topStrengths: pad(strengths, (d) => `${d.label} is an area you're already doing comparatively well in`),
    topFrictions: pad(frictions, (d) => `${d.label} shows up as a current opportunity`),
    trackMatches: {
      primary: ctx.trackIds[0],
      secondary: ctx.trackIds[1],
      tertiary: ctx.trackIds[2],
    },
    sageConfidence: ctx.confidenceScore,
    momentumBehavior: "Focus on your top track's daily routine first — consistency matters more than intensity.",
    // No aggregation formula exists for benchmarks (see the GAP comment
    // on LifeIndexProps.benchmarks in types.ts) — always empty for real
    // data; the component already renders nothing when this is [].
    benchmarks: [] as BenchmarkMetric[],
  };
}

// ---------------------------------------------------------------------------
// P3-3 — Personal Pattern Map
// ---------------------------------------------------------------------------

export function buildPatternMapProps(ctx: LifeBriefContext): PatternMapProps | null {
  if (!ctx.domainScores) return null;

  const reported = ctx.domainScores
    .filter((d) => d.itemsAnswered > 0)
    .map((d) => `You told Sage about ${d.label.toLowerCase()}.`);
  const monitoring = ctx.domainScores
    .filter((d) => d.itemsAnswered > 0 && d.itemsAnswered < d.itemsTotal)
    .map((d) => `${d.label} — Sage will keep tracking this as you check in.`);
  const uncertain = ctx.contradictionFlags.filter((f) => !f.hardError).map((f) => f.message);

  return {
    // No reasonable heuristic exists for an ordered causal chain or for
    // what Sage "inferred" as a pattern (see the GAP comment on
    // PatternMapProps in types.ts) — left empty rather than
    // misrepresenting a ranked list as a causal chain.
    chain: [],
    reported,
    observed: [],
    uncertain,
    monitoring,
  };
}

// ---------------------------------------------------------------------------
// P3-4 — Track cards
// ---------------------------------------------------------------------------

const FIXED_WHAT_ITS_NOT_FOR =
  "General wellness support only — not intended to diagnose, treat, cure, or prevent any disease.";

export function buildTrackCardProps(ctx: LifeBriefContext): TrackCardProps[] {
  const tiers: TrackCardProps["tier"][] = ["primary", "secondary", "tertiary"];

  return ctx.trackIds
    .map((trackId, i) => {
      const track = findTrack(trackId);
      if (!track) return null;
      const reason = ctx.rationale.find((r) => r.track_id === trackId)?.reason;

      const card: TrackCardProps = {
        track: trackId,
        tier: tiers[i] ?? "tertiary",
        whySelected: splitRationaleIntoReasons(reason, track.name),
        ingredients: track.ingredients,
        timingAndFormat: track.format,
        whatYouMayObserve: "Effects build gradually with consistent use — most subscribers notice changes over several weeks.",
        whatItIsNotFor: FIXED_WHAT_ITS_NOT_FOR,
        // Always "blocked" for real data — the Claims/Evidence Library
        // (P1-3) hasn't been signed off by Regulatory yet. Not a
        // per-track judgment call.
        evidenceStrength: "blocked",
        precautions: track.cautions,
        reconsiderConditions: ["If you don't notice any change after several weeks of consistent use, mention it in your next check-in with Sage."],
      };
      return card;
    })
    .filter((c): c is TrackCardProps => c !== null);
}

// ---------------------------------------------------------------------------
// P3-5 — Ingredient Intelligence
// ---------------------------------------------------------------------------

export function buildIngredientIntelligenceProps(ctx: LifeBriefContext): IngredientIntelligenceProps[] {
  const byIngredient = new Map<string, { trackNames: string[]; cautions: Set<string> }>();

  for (const trackId of ctx.trackIds) {
    const track = findTrack(trackId);
    if (!track) continue;
    for (const ingredientName of track.ingredients) {
      const entry = byIngredient.get(ingredientName) ?? { trackNames: [], cautions: new Set<string>() };
      if (!entry.trackNames.includes(track.name)) entry.trackNames.push(track.name);
      for (const caution of track.cautions) {
        if (ingredientMatchesCaution(ingredientName, caution)) entry.cautions.add(caution);
      }
      byIngredient.set(ingredientName, entry);
    }
  }

  return Array.from(byIngredient.entries()).map(([ingredientName, { trackNames, cautions }]) => ({
    ingredientName,
    // botanicalName/traditionalUseContext/formAndAmount/complementaryIngredients
    // have no data source at all today (see the GAP comments in
    // types.ts) — honest placeholders, not invented content.
    traditionalUseContext: "Detailed ingredient education for this item is coming soon.",
    formulationRole: `Included in your ${trackNames.join(" and ")} formula.`,
    formAndAmount: "Exact amount pending Claims/Evidence Library sign-off.",
    evidenceClassification: "blocked",
    // No substantive traditional-use/efficacy claim is made above, so
    // this placeholder note is honest — it's not standing in for a real
    // citation of a real claim. Required, non-empty per content policy
    // (see memory feedback_ingredient_claims_language).
    citations: ["Citation pending Claims/Evidence Library review."],
    complementaryIngredients: [],
    safetyAndInteractionNotes: Array.from(cautions),
  }));
}

// ---------------------------------------------------------------------------
// P3-6 — Daily LIFE Rhythm
// ---------------------------------------------------------------------------

export function buildDailyRhythmProps(ctx: LifeBriefContext): DailyRhythmProps {
  const tracks = ctx.trackIds.map(findTrack).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const amTrack = tracks.find((t) => /\bAM\b/i.test(t.format));
  const pmTrack = tracks.find((t) => /\bPM\b/i.test(t.format));

  const lifestyleParts = [ctx.profile?.work_environment, ctx.profile?.travel_frequency].filter(Boolean);

  return {
    blocks: [
      {
        timeOfDay: "wake",
        label: "Wake",
        hydrationCue: ctx.profile?.water_intake_recommendation ?? "Start the day with a full glass of water before coffee.",
      },
      {
        timeOfDay: "morning_activation",
        label: "Morning Activation",
        botanicalTiming: amTrack ? `${amTrack.name} — ${amTrack.format}` : undefined,
      },
      {
        timeOfDay: "midday_stability",
        label: "Midday Stability",
        mealRhythm: ctx.profile?.fasting_recommendation ?? "A steady, protein-forward meal to help sustain your afternoon.",
      },
      { timeOfDay: "movement_window", label: "Movement Window", movement: "A short walk or light activity, whenever fits your day." },
      { timeOfDay: "evening_recovery", label: "Evening Recovery", caffeineBoundary: "No caffeine late in the day." },
      {
        timeOfDay: "sleep_prep",
        label: "Sleep Prep",
        botanicalTiming: pmTrack ? `${pmTrack.name} — ${pmTrack.format}` : undefined,
        recoveryPractice: "A consistent wind-down window before bed.",
      },
    ],
    lifestyleCompatibilityNote:
      lifestyleParts.length > 0 ? `Built around what you shared: ${lifestyleParts.join(", ")}.` : undefined,
  };
}

// ---------------------------------------------------------------------------
// P3-7 — Roadmap + weekly check-in
// ---------------------------------------------------------------------------

// Fixed program structure, independent of subscriber data — see the note
// on RoadmapProps.phases in types.ts.
const ROADMAP_PHASES: [RoadmapPhase, RoadmapPhase, RoadmapPhase] = [
  {
    label: "Stabilize",
    dayRange: "Days 1-30",
    focus: "Build the daily routine and get consistent with botanical timing.",
    milestones: ["Take your protocol consistently 5+ days/week", "Establish a fixed daily rhythm"],
  },
  {
    label: "Build",
    dayRange: "Days 31-60",
    focus: "Layer in the surrounding habits as the core routine becomes automatic.",
    milestones: ["Add the movement window consistently", "Track your weekly check-ins"],
  },
  {
    label: "Personalize",
    dayRange: "Days 61-90",
    focus: "Refine the protocol based on what's actually moved the needle for you.",
    milestones: ["Review your 90-day check-in with Sage", "Decide what to keep, adjust, or drop"],
  },
];

const WEEKLY_CHECK_IN_QUESTIONS = [
  "How was your morning vitality this week?",
  "How many days did you notice an afternoon decline?",
  "How was your sleep overall?",
  "How consistent were you with your protocol?",
  "How much movement did you get in?",
  "How would you rate your recovery?",
  "How's your top priority area trending?",
  "Any side effects to flag?",
];

export function buildRoadmapProps(ctx: LifeBriefContext): RoadmapProps {
  const top = ctx.domainScores ? getTopDomain(ctx.domainScores) : null;
  return {
    phases: ROADMAP_PHASES,
    weeklyCheckIn: {
      questions: WEEKLY_CHECK_IN_QUESTIONS,
      priorityMarkerQuestion: top ? `How's your ${top.label.toLowerCase()} trending this week?` : "How's your overall energy trending this week?",
    },
  };
}

// ---------------------------------------------------------------------------
// P3-8 — Share card
// ---------------------------------------------------------------------------

export function buildShareCardProps(ctx: LifeBriefContext): ShareCardProps | null {
  if (!ctx.domainScores) return null;
  const top = getTopDomain(ctx.domainScores);
  if (!top) return null;

  const ranked = scoredDomains(ctx.domainScores).sort((a, b) => a.opportunityScore - b.opportunityScore);
  const topStrength = ranked[0]?.label ?? top.label;

  // Constructed as an explicit field-by-field literal, per the safety
  // note on ShareCardProps in types.ts — never via spread from a larger
  // context object, so sensitive fields can never leak in here.
  return {
    lifePattern: top.label,
    topStrength: `${topStrength} is an area you're already doing comparatively well in`,
    currentOpportunity: top.label,
    ninetyDayIntention: `Noticeable, sustainable improvement in ${top.label.toLowerCase()}.`,
  };
}

// ---------------------------------------------------------------------------
// P3-9 — Progress comparison
// ---------------------------------------------------------------------------

/** Only renders when there are 2+ real snapshots — a real then/now
 * comparison needs two real data points; fabricating a "before" state
 * that never existed isn't a reasonable heuristic (see the note on
 * ProgressComparisonProps in the approved plan). */
export function buildProgressComparisonProps(
  oldestRow: TrackAssignmentRow,
  newestRow: TrackAssignmentRow
): ProgressComparisonProps | null {
  if (!oldestRow.domain_scores || !newestRow.domain_scores || oldestRow.confidence_score == null || newestRow.confidence_score == null) {
    return null;
  }
  if (oldestRow.assigned_at === newestRow.assigned_at) return null;

  const toSnapshot = (row: TrackAssignmentRow, dayLabel: ProgressSnapshot["dayLabel"]): ProgressSnapshot => {
    const top = getTopDomain(row.domain_scores!);
    return {
      dayLabel,
      vitalityIndex: computeVitalityIndexV1(row.domain_scores!, row.safety_gate),
      topBenchmarks: top ? [{ metric: top.label, current: `${top.opportunityScore}/100 opportunity` }] : [],
    };
  };

  const then = toSnapshot(oldestRow, "Day 0");
  const now = toSnapshot(newestRow, "Day 30");

  const whatChanged: string[] = [];
  for (const newDomain of scoredDomains(newestRow.domain_scores)) {
    const oldDomain = scoredDomains(oldestRow.domain_scores).find((d) => d.key === newDomain.key);
    if (!oldDomain) continue;
    const delta = oldDomain.opportunityScore - newDomain.opportunityScore;
    if (Math.abs(delta) >= 10) {
      whatChanged.push(
        delta > 0
          ? `${newDomain.label} opportunity score improved from ${oldDomain.opportunityScore} to ${newDomain.opportunityScore}.`
          : `${newDomain.label} opportunity score moved from ${oldDomain.opportunityScore} to ${newDomain.opportunityScore}.`
      );
    }
  }

  const newTop = getTopDomain(newestRow.domain_scores);

  return {
    then,
    now,
    whatChanged,
    sageRecommendsNext: newTop
      ? `Keep going — ${newTop.label.toLowerCase()} is still the area with the most opportunity.`
      : "Keep going with your current protocol.",
  };
}
