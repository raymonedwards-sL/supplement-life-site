/**
 * Goal / lifestyle / format -> Track-Fit input normalization.
 *
 * The Phase 2 spec (P2-1, "Goal, lifestyle, and format questions") defines
 * WHICH conversational answers feed the Track-Fit Engine's non-opportunity
 * weights (goal_alignment, lifestyle_compatibility, likely_adherence,
 * format_preference), but — like sage_scoring_engine.py itself — doesn't
 * specify the categorical-answer-to-0..1 mapping; the reference engine
 * takes those as pre-computed floats. This file is that missing mapping,
 * written in the same "first-draft, validate against pilot data" spirit
 * as the rest of the engine (see sage_scoring_engine.py's own header).
 * Data Science should recalibrate these against real Phase 4 pilot data,
 * same as the weights in track-fit.ts.
 *
 * Sage is instructed (lib/claude/intake.ts) to log primary_goal,
 * format_preference, routine_consistency, and lifestyle_constraints using
 * the canonical codes below, translating natural conversation into them —
 * the subscriber never sees or picks from this list directly.
 */
import type { Domain } from "./domains";
import { domainForTrack } from "./domains";

export const PRIMARY_GOAL_CODES = [
  "more_energy",
  "better_sleep",
  "digestive_comfort",
  "immune_support",
  "mental_clarity",
  "hormonal_balance",
  "morning_routine",
  "general_wellness",
] as const;
export type PrimaryGoalCode = (typeof PRIMARY_GOAL_CODES)[number];

export const FORMAT_CODES = ["capsules", "tonic_liquid", "tea", "powder"] as const;
export type FormatCode = (typeof FORMAT_CODES)[number];

export const ROUTINE_CONSISTENCY_CODES = [
  "very_consistent",
  "somewhat_consistent",
  "not_very_consistent",
] as const;
export type RoutineConsistencyCode = (typeof ROUTINE_CONSISTENCY_CODES)[number];

/** Domain keys most directly served by each goal. First entry is the
 * strongest match (goalAlignment 1.0); the rest get partial credit. */
const GOAL_TO_DOMAINS: Record<PrimaryGoalCode, string[]> = {
  more_energy: ["cellular_energy", "vitality_stamina"],
  better_sleep: ["sleep_calm"],
  digestive_comfort: ["digestive_comfort"],
  immune_support: ["immune_resilience"],
  mental_clarity: ["cognitive_focus"],
  hormonal_balance: ["womens_rhythm", "mens_rhythm"],
  morning_routine: ["morning_reset"],
  general_wellness: [],
};

const FORMAT_BASELINE_MATCH = 0.4;

function trackFormatTokens(trackFormat: string): Set<FormatCode> {
  const lower = trackFormat.toLowerCase();
  const tokens = new Set<FormatCode>();
  if (lower.includes("capsule")) tokens.add("capsules");
  if (lower.includes("tonic") || lower.includes("tincture")) tokens.add("tonic_liquid");
  if (lower.includes("tea")) tokens.add("tea");
  if (lower.includes("powder")) tokens.add("powder");
  return tokens;
}

export function goalAlignment(trackId: string, primaryGoal: PrimaryGoalCode | null): number {
  if (!primaryGoal) return 0.5; // no goal disclosed — neutral, not penalized
  const domains = GOAL_TO_DOMAINS[primaryGoal];
  if (domains.length === 0) return 0.5; // general_wellness — every track is an equally reasonable fit
  const domain = domainForTrack(trackId);
  if (!domain) return 0.5;
  const index = domains.indexOf(domain.key);
  if (index === 0) return 1.0;
  if (index > 0) return 0.65;
  return 0.3;
}

export function formatPreference(trackFormat: string, preferred: FormatCode[] | null): number {
  if (!preferred || preferred.length === 0) return 0.5; // no preference disclosed — neutral
  const trackTokens = trackFormatTokens(trackFormat);
  const isMatch = preferred.some((p) => trackTokens.has(p));
  return isMatch ? 1.0 : FORMAT_BASELINE_MATCH;
}

export function likelyAdherence(routineConsistency: RoutineConsistencyCode | null): number {
  switch (routineConsistency) {
    case "very_consistent":
      return 0.9;
    case "somewhat_consistent":
      return 0.6;
    case "not_very_consistent":
      return 0.35;
    default:
      return 0.5; // not disclosed — neutral
  }
}

/**
 * Lifestyle compatibility (P2-1: "Any travel, shift-work, or scheduling
 * patterns" + activity_frequency context). Kept deliberately simple: a
 * neutral baseline, nudged down for a format that's harder to keep to on
 * the road (tea/tonic prep) when travel/shift-work language was disclosed,
 * and nudged up for Vitality specifically when the subscriber reports
 * frequent activity — the one case the spec calls out by name (P2-7:
 * "Lifestyle-compatibility input for Track-Fit — intentionally not scored
 * into the Vitality Opportunity Score itself, kept because it changes the
 * Track-Fit output").
 */
export function lifestyleCompatibility(
  domain: Domain | undefined,
  trackFormat: string,
  lifestyleConstraintsText: string | null,
  activityFrequency1to5: number | null
): number {
  let score = 0.7;
  const constraints = (lifestyleConstraintsText ?? "").toLowerCase();
  const disruptedRoutine = /\btravel|shift.?work|on.the.road|inconsistent schedule\b/.test(constraints);
  const prepHeavyFormat = /tea|tonic/.test(trackFormat.toLowerCase());
  if (disruptedRoutine && prepHeavyFormat) score -= 0.2;

  if (domain?.key === "vitality_stamina" && activityFrequency1to5 != null) {
    score += ((activityFrequency1to5 - 3) / 2) * 0.15; // +/-0.15 at the scale extremes
  }

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}
