/**
 * P2-4: Track-Fit Engine.
 * Direct port of track_fit_score() / TRACK_FIT_WEIGHTS in
 * sage_scoring_engine.py, unchanged from the original product-development
 * spec (Sec. 6.3): 30% goal alignment, 25% domain opportunity, 20%
 * lifestyle compatibility, 15% likely adherence, 10% format preference.
 * Only tracks that pass the Safety Gate (P1-4 / safety-gate.ts) are
 * eligible for scoring at all — the caller is responsible for that filter.
 *
 * Weights and thresholds are first-draft per the spec — Data Science
 * should recalibrate against Phase 4 pilot data before this is final.
 */
export const TRACK_FIT_WEIGHTS = {
  goal_alignment: 0.3,
  domain_opportunity: 0.25,
  lifestyle_compatibility: 0.2,
  likely_adherence: 0.15,
  format_preference: 0.1,
} as const;

export type TrackFitInputs = {
  /** 0..1 — how directly this track addresses the subscriber's stated primary goal. */
  goalAlignment: number;
  /** 0..100 — this track's domain Opportunity Score. */
  domainOpportunityPct: number;
  /** 0..1 — fit with disclosed lifestyle constraints (travel, shift-work, activity level). */
  lifestyleCompatibility: number;
  /** 0..1 — likelihood of sticking with this track's format/routine, from routine_consistency. */
  likelyAdherence: number;
  /** 0..1 — match between this track's format and the subscriber's stated format_preference. */
  formatPreference: number;
};

export function trackFitScore(inputs: TrackFitInputs): number {
  const w = TRACK_FIT_WEIGHTS;
  const score =
    w.goal_alignment * inputs.goalAlignment +
    w.domain_opportunity * (inputs.domainOpportunityPct / 100) +
    w.lifestyle_compatibility * inputs.lifestyleCompatibility +
    w.likely_adherence * inputs.likelyAdherence +
    w.format_preference * inputs.formatPreference;
  return Math.round(score * 100 * 10) / 10;
}
