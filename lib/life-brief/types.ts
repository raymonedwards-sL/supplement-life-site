/**
 * SAGE / LIFE — Phase 3 "LIFE Brief" report: component prop contracts.
 *
 * NAMING NOTE: this is a different, richer product surface than the
 * existing "Your LIFE Brief" PDF (lib/pdf/life-brief.ts,
 * lib/email/send-life-brief.ts) — same product concept, different
 * maturity/format. Not the same code path; nothing here touches those
 * files.
 *
 * Reconciled 2026-07-23 from a Dropbox hand-off spec (sage_life_brief_types.ts,
 * DRAFT — outside this repo) against the real Phase 2 scoring engine
 * (lib/scoring/engine.ts). That draft declared its own parallel
 * AssessmentResult/DomainOpportunityScore/SafetyGateResult/TrackFitResult/
 * ConfidenceScoreResult types as a rough sketch of what the engine would
 * eventually output — since the real engine now exists, this file
 * re-exports its actual types instead of re-declaring a second, driftable
 * source of truth. Only the 9 report components' own prop types (which
 * have no engine equivalent at all) are net-new here.
 *
 * STATUS: shell types for props-driven, mock-data-fed components — not
 * yet wired to real data. Several fields below have NO current data
 * source (engine, rationale, or content library); each is flagged inline
 * with "GAP:" and must be resolved before real (non-mock) wiring, not
 * before this shell pass. See lib/life-brief/mock-data.ts for the sample
 * data these components render against today.
 */
import type { EngineResult, EngineDomainResult, EngineTrackResult } from "@/lib/scoring/engine";
import type { ContradictionFlag } from "@/lib/scoring/contradictions";

export type { EngineResult, EngineDomainResult, EngineTrackResult, ContradictionFlag };

/** Kebab-case track id, matches lib/tracks.ts Track.id. Deliberately
 * plain `string`, not a literal union — Track.id itself is typed
 * `string`, and a stricter type here would silently drift the moment
 * that file changes. Always resolve display name/catalog data via
 * findTrack(id) from lib/tracks.ts; never duplicate it in a prop. */
export type TrackId = string;

/** Domain key, matches lib/scoring/domains.ts Domain.key — same
 * "string, not literal union" rationale as TrackId. */
export type DomainKey = string;

/**
 * Vocabulary from the (currently blocked) Claims/Evidence Library — a
 * separate Dropbox-based spec (P1-3), orthogonal to the scoring engine.
 * Regulatory/Compliance has not signed off and no peer-reviewed
 * citations are on file yet, so real (non-mock) data can only ever set
 * this to "blocked" until that library ships — mock data below exercises
 * the other values to prove the components render them correctly.
 */
export type EvidenceStrength = "confirmed" | "partial-pending-review" | "not-yet-validated" | "blocked";

// ---------------------------------------------------------------------------
// P3-1 — Page 1: "Your LIFE Revelation"
// ---------------------------------------------------------------------------

export interface LifeRevelationProps {
  dominantPattern: string; // plain-language label, not a diagnosis
  sageInterpretation: string; // one sentence
  supportingSignals: [string, string, string]; // tied to specific domain scores
  topOpportunity: string; // the single highest-priority domain, in plain language
  botanicalVisualTrackId: TrackId; // resolve display name/image via findTrack()
  ninetyDayCta: string; // "Your next 90 days begin here." pattern
}

// ---------------------------------------------------------------------------
// P3-2 — Pages 2 & 4: LIFE Index + Benchmark bars
// ---------------------------------------------------------------------------

export interface BenchmarkMetric {
  metric: string; // e.g. "Sleep duration and regularity"
  current: number | string;
  personalBaseline: number | string; // ALWAYS present — primary benchmark
  thirtyDayTarget: number | string;
  ninetyDayDirection: "up" | "down" | "stable";
  publicReferenceNote?: string; // optional — only when citing CDC/National Academies etc.
  publicReferenceSource?: string; // required if publicReferenceNote is set — always name the source
}

export interface LifeIndexProps {
  /**
   * 0-100 composite — a priority-weighted average of domain opportunity
   * scores. v1 formula (lib/life-brief/adapter.ts), specified 2026-07-24:
   * 1.5x weight for the subscriber's top-3 highest-interference domains,
   * 1.0x for the rest; domains below a per-domain completeness threshold
   * or excluded by the Safety Gate are dropped from the average entirely
   * (never scored as 0). Same "recalibrate against Phase 4 pilot data"
   * treatment as P2-4's Track-Fit weights (lib/scoring/track-fit.ts) —
   * not Data-Science-final.
   *
   * null = "still building your picture" state — the formula's own spec
   * requires this when more than 3 of the 9 domains end up excluded, so
   * the report never shows a number built from too little real signal.
   */
  vitalityIndex: number | null;
  /** MANDATORY, must render adjacent to the index. Compliance requirement
   * (product doc): must describe this as a general-wellness composite —
   * never a medical score, biological-age test, or diagnostic measurement. */
  vitalityIndexDisclaimer: string;
  topStrengths: [string, string, string];
  topFrictions: [string, string, string];
  /** EngineResult.recommendedTrackIds documents 0-3 entries, not always
   * 3 — secondary/tertiary are genuinely optional here, not just marked
   * so defensively. */
  trackMatches: { primary: TrackId; secondary?: TrackId; tertiary?: TrackId };
  /** Maps 1:1 to EngineResult.confidenceScore — the cleanest future-wiring
   * path of any field in this file. */
  sageConfidence: number;
  momentumBehavior: string; // single behavior most likely to create momentum
  /** GAP: same "no aggregation exists yet" caveat as vitalityIndex. */
  benchmarks: BenchmarkMetric[]; // 6-8 per product notes, not a dense dashboard
}

// ---------------------------------------------------------------------------
// P3-3 — Page 3: Personal Pattern Map
// ---------------------------------------------------------------------------

/**
 * GAP: none of these five buckets have a clean 1:1 engine mapping today.
 * Closest conceptual seeds for later wiring: EngineResult.contradictionFlags
 * (-> uncertain) and domains where itemsAnswered < itemsTotal (-> monitoring)
 * — a derivation design question to resolve later, not in this shell pass.
 */
export interface PatternMapProps {
  chain: string[]; // ordered chain, e.g. ["Irregular travel", "Inconsistent meal timing", ...]
  reported: string[]; // what the customer directly reported
  observed: string[]; // what Sage inferred as a pattern
  uncertain: string[]; // what remains uncertain
  monitoring: string[]; // what Sage will track going forward
}

// ---------------------------------------------------------------------------
// P3-4 — Page 5: Track cards ("Why Sage Chose This")
// ---------------------------------------------------------------------------

export interface TrackCardProps {
  track: TrackId;
  tier: "primary" | "secondary" | "tertiary";
  /**
   * GAP — the sharpest reconciliation finding in this whole file: no
   * current data source produces exactly 3 discrete reasons. The real
   * subscriber-facing rationale (lib/rationale.ts's TrackRationale) is
   * ONE free-text paragraph per track, not a 3-item array.
   * EngineTrackResult.reasons is Safety Gate eligibility reasons, not a
   * "why we picked this" narrative, and cannot be substituted here.
   * Wiring this later needs either re-prompting Sage for exactly 3
   * discrete reasons, or a splitting step — not a plumbing-only fix.
   */
  whySelected: [string, string, string];
  ingredients: string[]; // real source: Track.ingredients (lib/tracks.ts) — no gap
  timingAndFormat: string;
  whatYouMayObserve: string;
  whatItIsNotFor: string; // required — explicit non-claims language
  /** Real (non-mock) data can only ever be "blocked" until the Claims/
   * Evidence Library ships — see EvidenceStrength above. */
  evidenceStrength: EvidenceStrength;
  /** Good future wiring path: should conceptually source from
   * Track.cautions (lib/tracks.ts) — already compliance-reviewed
   * language, low-risk to map later. */
  precautions: string[];
  reconsiderConditions: string[]; // conditions under which Sage would revisit this recommendation
}

// ---------------------------------------------------------------------------
// P3-5 — Page 6: Ingredient Intelligence
// ---------------------------------------------------------------------------

/**
 * Named IngredientIntelligenceProps (not "IngredientCardProps" as in the
 * original draft) to avoid confusion with the already-shipping, unrelated
 * components/ingredients/IngredientCard.tsx — a thinner card driven by
 * lib/ingredient-education.ts's IngredientEducation, used on the
 * dashboard and post-intake summary today.
 */
export interface IngredientIntelligenceProps {
  ingredientName: string;
  botanicalName?: string;
  /** Structure-function language only ("supports," "traditionally used
   * for") — never a diagnosis/treatment/cure claim, even implied (no
   * "treats," "addresses [condition]," "well-studied for [condition]").
   * Content policy per project standard — see memory
   * feedback_ingredient_claims_language. */
  traditionalUseContext: string;
  formulationRole: string;
  /** GAP: per-ingredient dosage exists nowhere in the current data model
   * (not in lib/tracks.ts, not in lib/ingredient-education.ts). Real
   * source is likely the Co-Packer Formulation Packet referenced in
   * lib/tracks.ts's header comment, which isn't in this repo at all. */
  formAndAmount: string;
  /** Same P1-3 blocker as TrackCardProps.evidenceStrength. */
  evidenceClassification: EvidenceStrength;
  /**
   * REQUIRED, non-empty — at least one citation per ingredient claim, per
   * project content policy (see memory feedback_ingredient_claims_language),
   * even before Regulatory/legal has vetted it. Applies to mock/draft
   * content too, not only content that's already shipped — the discipline
   * should be present from the first draft. Plain citation strings
   * (author/journal/year), not URLs — do not fabricate a DOI/PubMed link
   * for a citation that hasn't been verified.
   */
  citations: string[];
  complementaryIngredients: string[];
  safetyAndInteractionNotes: string[]; // pulled from Safety Gate rules that reference this ingredient
  sourcingNote?: string;
}

// ---------------------------------------------------------------------------
// P3-6 — Page 7: Daily LIFE Rhythm timeline
// ---------------------------------------------------------------------------

export interface RhythmBlock {
  timeOfDay: "wake" | "morning_activation" | "midday_stability" | "movement_window" | "evening_recovery" | "sleep_prep";
  label: string;
  botanicalTiming?: string;
  hydrationCue?: string;
  mealRhythm?: string;
  movement?: string;
  caffeineBoundary?: string;
  recoveryPractice?: string;
  sageCheckIn?: string;
}

export interface DailyRhythmProps {
  blocks: RhythmBlock[]; // ordered wake -> sleep_prep
  /** GAP: could eventually loosely relate to TrackFitInputs.lifestyleCompatibility
   * (lib/scoring/track-fit.ts) — but that's a bare 0..1 number today, not
   * narrative text. Don't force a mapping until that changes. */
  lifestyleCompatibilityNote?: string; // must reflect any travel/shift-work constraints from intake
}

// ---------------------------------------------------------------------------
// P3-7 — Pages 8-9: 30/60/90-day roadmap + weekly check-in
// ---------------------------------------------------------------------------

export interface RoadmapPhase {
  label: "Stabilize" | "Build" | "Personalize";
  dayRange: string; // "Days 1-30" etc.
  focus: string;
  milestones: string[]; // must be under the customer's control (adherence, consistency) — never a physiological promise
}

export interface WeeklyCheckInSpec {
  questions: string[]; // per intake spec: morning vitality, afternoon decline days, sleep, adherence, movement, recovery, one priority marker, side effects
  priorityMarkerQuestion: string; // the one domain-specific marker tied to the customer's top track
}

export interface RoadmapProps {
  /** Always exactly 3 — Stabilize/Build/Personalize is a fixed
   * program-structure decision, not derived from subscriber data. */
  phases: [RoadmapPhase, RoadmapPhase, RoadmapPhase];
  weeklyCheckIn: WeeklyCheckInSpec;
}

// ---------------------------------------------------------------------------
// P3-8 — Page 10: private-safe LIFE Map share card ("sneeze" feature)
// ---------------------------------------------------------------------------

/**
 * SAFETY-CRITICAL TYPE — the shape below IS the privacy control, not just
 * a convenience contract: it deliberately excludes medications, any
 * intimate/sensitive health responses, and raw intake data by omission.
 *
 * TypeScript's excess-property checking only protects a DIRECT OBJECT
 * LITERAL assigned to a typed variable — it does NOT protect a spread
 * from a larger subscriber-data record. `const props: ShareCardProps =
 * someWholeSubscriberRecord` compiles cleanly even if that record
 * contains medications or raw intake data, because ShareCardProps is
 * structurally satisfied by any superset. Whoever wires this to real
 * data MUST construct it field-by-field as an explicit literal — never
 * via object spread — or this type's entire safety purpose is defeated.
 * This has to be a code-review rule, not just a type-system guarantee.
 */
export interface ShareCardProps {
  lifePattern: string;
  topStrength: string;
  currentOpportunity: string;
  ninetyDayIntention: string;
}

// ---------------------------------------------------------------------------
// P3-9 — Progress comparison module (Then / Now / What Changed)
// ---------------------------------------------------------------------------

export interface ProgressSnapshot {
  dayLabel: "Day 0" | "Day 30" | "Day 60" | "Day 90";
  /** Same v1 formula and null semantics as LifeIndexProps.vitalityIndex. */
  vitalityIndex: number | null;
  topBenchmarks: Pick<BenchmarkMetric, "metric" | "current">[];
}

export interface ProgressComparisonProps {
  then: ProgressSnapshot;
  now: ProgressSnapshot;
  whatChanged: string[];
  sageRecommendsNext: string;
}
