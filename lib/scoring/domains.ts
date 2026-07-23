/**
 * SAGE / LIFE — Phase 2 domain taxonomy.
 *
 * TS port of the domain/track mapping in
 * SAGE_LIFE_Phase2_Assessment_Scoring.docx (P2-1) and
 * sage_scoring_engine.py's DOMAINS dict. The reference engine keys tracks
 * by display name ("Daily Restore"); this port keys everything by the
 * lib/tracks.ts `id` (kebab-case) instead, since that's the id space the
 * rest of this codebase (routes, DB rows, the UI) already uses — the
 * display names below are for readability/prompt text only.
 *
 * Each domain lists its 1-5 scale item fields (the field names Sage is
 * instructed to log in lib/claude/intake.ts), whether each item is
 * reverse-scored so 100 always means "higher opportunity" (see
 * normalize.ts), and the interference field that feeds the Opportunity
 * Score multiplier (P2-3).
 */

export type DomainItemField = {
  field: string;
  /** true if a HIGHER raw 1-5 answer means LOWER opportunity (e.g. "how
   * rested do you feel" — 5/great means low opportunity, so this must be
   * reverse-scored to keep 100 meaning "high opportunity" throughout). */
  reverse: boolean;
};

export type Domain = {
  key: string;
  label: string;
  /** lib/tracks.ts id this domain's Opportunity Score feeds into. */
  trackId: string;
  /** 1-5 scale items that make up the domain's Opportunity Score. */
  items: DomainItemField[];
  /** Field name for this domain's interference rating (1-5), feeding the
   * Opportunity Score multiplier. */
  interferenceField: string;
  /** Only ask/score this domain if this predicate on demographic answers
   * passes — used for the sex-conditional Women's/Men's Rhythm sections
   * (P2-2). Undefined means always eligible. */
  shownIf?: (demographics: DemographicAnswers) => boolean;
};

export type DemographicAnswers = {
  age?: number;
  sex?: "male" | "female" | "other" | "prefer_not_to_say";
  post_menopausal?: boolean;
};

export const DOMAINS: Domain[] = [
  {
    key: "cellular_energy",
    label: "Cellular Energy & Recovery",
    trackId: "daily-restore",
    items: [
      { field: "afternoon_energy", reverse: true },
      { field: "recovery_days", reverse: true },
    ],
    interferenceField: "energy_interference",
  },
  {
    key: "sleep_calm",
    label: "Sleep & Nervous System Calm",
    trackId: "pm-calm",
    items: [
      { field: "sleep_onset", reverse: false },
      { field: "racing_mind", reverse: false },
      { field: "sleep_quality", reverse: true },
    ],
    interferenceField: "sleep_interference",
  },
  {
    key: "digestive_comfort",
    label: "Digestive Comfort & Regularity",
    trackId: "reset",
    items: [{ field: "digestive_frequency", reverse: false }],
    interferenceField: "digestive_interference",
  },
  {
    key: "vitality_stamina",
    label: "Vitality & Stamina",
    trackId: "vitality",
    items: [
      { field: "exertion_recovery", reverse: true },
      { field: "stamina_trend", reverse: true },
    ],
    interferenceField: "vitality_interference",
  },
  {
    key: "immune_resilience",
    label: "Immune Resilience",
    trackId: "immunity",
    items: [
      { field: "seasonal_susceptibility", reverse: false },
      { field: "recovery_speed", reverse: false },
    ],
    interferenceField: "immune_interference",
  },
  {
    key: "morning_reset",
    label: "Morning Reset & Craving Moderation",
    trackId: "morning-clarity",
    items: [{ field: "morning_clarity", reverse: true }],
    interferenceField: "morning_interference",
  },
  {
    key: "womens_rhythm",
    label: "Women's Hormonal Rhythm",
    trackId: "womens-rhythm",
    items: [{ field: "cycle_symptom_severity", reverse: false }],
    interferenceField: "rhythm_interference",
    shownIf: (d) => d.sex === "female",
  },
  {
    key: "mens_rhythm",
    label: "Men's Vitality & Rhythm",
    trackId: "mens-rhythm",
    items: [
      { field: "stamina_confidence", reverse: true },
      { field: "age_related_change", reverse: false },
    ],
    interferenceField: "rhythm_interference_m",
    shownIf: (d) => d.sex === "male",
  },
  {
    key: "cognitive_focus",
    label: "Cognitive Clarity & Focus",
    trackId: "cognitive-focus",
    items: [
      { field: "brain_fog_frequency", reverse: false },
      { field: "memory_trend", reverse: true },
    ],
    interferenceField: "cognitive_interference",
  },
];

export function findDomain(key: string): Domain | undefined {
  return DOMAINS.find((d) => d.key === key);
}

export function domainForTrack(trackId: string): Domain | undefined {
  return DOMAINS.find((d) => d.trackId === trackId);
}

/** Every domain item field name + every interference field name, for
 * validating/filtering logged structured_value fields elsewhere. */
export const ALL_DOMAIN_FIELDS: ReadonlySet<string> = new Set(
  DOMAINS.flatMap((d) => [...d.items.map((i) => i.field), d.interferenceField])
);
