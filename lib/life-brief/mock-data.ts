/**
 * SAGE / LIFE — Phase 3 LIFE Brief: sample-subscriber mock data.
 *
 * One coherent "sample subscriber" story, hand-authored (not derived from
 * a mock EngineResult) — see lib/life-brief/types.ts's file header for
 * why: several of the fields below (vitalityIndex, benchmarks,
 * whySelected, PatternMap's five buckets) have no real aggregation logic
 * anywhere in the codebase yet, so a "derive mock props from a mock
 * engine run" function would just be throwaway code standing in for
 * Phase 4 work that hasn't been scoped. Instead, every mock props object
 * below references the same shared constants, so the numbers and track
 * identities agree with each other across all 9 components — read top to
 * bottom at /dev/life-brief-preview, it should tell one consistent story.
 *
 * Grounded in real product data via findTrack()/lib/tracks.ts and
 * lib/scoring/domains.ts wherever a real source exists, rather than
 * inventing fake ingredients or domain labels.
 */
import { findTrack } from "@/lib/tracks";
import { DOMAINS } from "@/lib/scoring/domains";
import type {
  LifeRevelationProps,
  LifeIndexProps,
  BenchmarkMetric,
  PatternMapProps,
  TrackCardProps,
  IngredientIntelligenceProps,
  DailyRhythmProps,
  RoadmapProps,
  ShareCardProps,
  ProgressComparisonProps,
} from "./types";

// ---------------------------------------------------------------------------
// Shared sample-subscriber constants
// ---------------------------------------------------------------------------

const SAMPLE_TRACKS = {
  primary: "pm-calm",
  secondary: "daily-restore",
  tertiary: "cognitive-focus",
} as const;

const primaryTrack = findTrack(SAMPLE_TRACKS.primary)!;
const secondaryTrack = findTrack(SAMPLE_TRACKS.secondary)!;
const tertiaryTrack = findTrack(SAMPLE_TRACKS.tertiary)!;

const SAMPLE_VITALITY_INDEX = 64;
const SAMPLE_CONFIDENCE = 72;

const sleepDomain = DOMAINS.find((d) => d.key === "sleep_calm")!;
const energyDomain = DOMAINS.find((d) => d.key === "cellular_energy")!;
const cognitiveDomain = DOMAINS.find((d) => d.key === "cognitive_focus")!;
const digestiveDomain = DOMAINS.find((d) => d.key === "digestive_comfort")!;

// ---------------------------------------------------------------------------
// P3-1 — Life Revelation
// ---------------------------------------------------------------------------

export const mockLifeRevelationProps: LifeRevelationProps = {
  dominantPattern: "Wired at Night, Foggy by Day",
  sageInterpretation:
    "A racing mind at bedtime and a mid-afternoon energy crash are commonly connected — the same overactive nervous-system pattern that delays sleep onset also tends to show up the next day as a harder crash and less mental clarity.",
  supportingSignals: [
    `${sleepDomain.label}: reported a racing mind most nights and mornings that don't feel restorative.`,
    `${energyDomain.label}: notable mid-afternoon dip, most days.`,
    `${cognitiveDomain.label}: occasional brain fog, harder to concentrate by afternoon.`,
  ],
  topOpportunity: sleepDomain.label,
  botanicalVisualTrackId: SAMPLE_TRACKS.primary,
  ninetyDayCta: "Your next 90 days begin here.",
};

// ---------------------------------------------------------------------------
// P3-2 — LIFE Index + Benchmarks
// ---------------------------------------------------------------------------

const mockBenchmarks: BenchmarkMetric[] = [
  {
    metric: "Sleep onset",
    current: "45-60 min",
    personalBaseline: "45-60 min",
    thirtyDayTarget: "25-35 min",
    ninetyDayDirection: "down",
  },
  {
    metric: "Mornings waking rested",
    current: "1-2 days/week",
    personalBaseline: "1-2 days/week",
    thirtyDayTarget: "3-4 days/week",
    ninetyDayDirection: "up",
  },
  {
    metric: "Afternoon energy dip severity",
    current: "Severe, most days",
    personalBaseline: "Severe, most days",
    thirtyDayTarget: "Moderate",
    ninetyDayDirection: "down",
  },
  {
    metric: "Days fully recovered",
    current: "2/week",
    personalBaseline: "2/week",
    thirtyDayTarget: "4/week",
    ninetyDayDirection: "up",
  },
  {
    metric: "Recommended overnight sleep window",
    current: "7-9 hours",
    personalBaseline: "7-9 hours",
    thirtyDayTarget: "7-9 hours",
    ninetyDayDirection: "stable",
    publicReferenceNote: "General adult sleep guidance",
    publicReferenceSource: "National Academies of Sciences, Engineering, and Medicine",
  },
  {
    metric: "Brain fog frequency",
    current: "Several days/week",
    personalBaseline: "Several days/week",
    thirtyDayTarget: "1-2 days/week",
    ninetyDayDirection: "down",
  },
];

export const mockLifeIndexProps: LifeIndexProps = {
  vitalityIndex: SAMPLE_VITALITY_INDEX,
  vitalityIndexDisclaimer: "A general-wellness composite based on what you've shared — not a medical score or diagnosis.",
  topStrengths: [
    "Consistent daily routine once a habit is set",
    "Clear, specific goals for what 'better' looks like",
    "Physical exertion recovery is a genuine strength",
  ],
  topFrictions: [
    "Racing mind at bedtime delaying sleep onset",
    "Mid-afternoon energy crash, most days",
    "Occasional brain fog affecting focus",
  ],
  trackMatches: {
    primary: SAMPLE_TRACKS.primary,
    secondary: SAMPLE_TRACKS.secondary,
    tertiary: SAMPLE_TRACKS.tertiary,
  },
  sageConfidence: SAMPLE_CONFIDENCE,
  momentumBehavior: "A consistent overnight wind-down routine — the single highest-leverage habit given the reported pattern.",
  benchmarks: mockBenchmarks,
};

// ---------------------------------------------------------------------------
// P3-3 — Personal Pattern Map
// ---------------------------------------------------------------------------

export const mockPatternMapProps: PatternMapProps = {
  chain: [
    "Racing mind at bedtime",
    "Delayed sleep onset",
    "Less restorative sleep",
    "Mid-afternoon energy crash",
    "Harder to concentrate by late afternoon",
  ],
  reported: [
    "Takes over an hour to fall asleep most nights",
    "Mid-afternoon energy crash described as severe",
    "Occasional brain fog, especially later in the day",
  ],
  observed: [
    "The sleep and energy patterns described share a common nervous-system thread rather than being separate issues",
  ],
  uncertain: [
    "Whether the afternoon crash is more tied to sleep debt or to daytime stress load — worth clarifying over the next few check-ins",
  ],
  monitoring: [
    "Sleep onset time as the wind-down routine takes hold",
    "Afternoon energy consistency week over week",
  ],
};

// ---------------------------------------------------------------------------
// P3-4 — Track cards
// ---------------------------------------------------------------------------

export const mockTrackCards: TrackCardProps[] = [
  {
    track: SAMPLE_TRACKS.primary,
    tier: "primary",
    whySelected: [
      "May help support easier wind-down given the reported racing mind at bedtime and delayed sleep onset",
      "Valerian root is traditionally used to support sleep onset",
      "Ashwagandha may help support the body's stress-adaptation response, not just sedation",
    ],
    ingredients: primaryTrack.ingredients,
    timingAndFormat: `Evening, ${primaryTrack.format}`,
    whatYouMayObserve: "An easier time winding down and, over several weeks, mornings that feel more rested.",
    whatItIsNotFor: "Not intended to treat insomnia or any diagnosed sleep disorder — see a healthcare provider for that.",
    evidenceStrength: "confirmed",
    precautions: primaryTrack.cautions,
    reconsiderConditions: ["If sleep issues persist or worsen despite consistent use for 4+ weeks"],
  },
  {
    track: SAMPLE_TRACKS.secondary,
    tier: "secondary",
    whySelected: [
      "Rounds out the protocol with steady, cumulative daily-energy support",
      "Mineral-forward formula complements the calming approach in the evening routine",
      "Non-stimulant, so it won't work against better sleep",
    ],
    ingredients: secondaryTrack.ingredients,
    timingAndFormat: `Morning, ${secondaryTrack.format}`,
    whatYouMayObserve: "A steadier baseline energy level as the weeks go on, rather than an immediate jolt.",
    whatItIsNotFor: "Not a stimulant and not intended for immediate, same-day energy — that's by design.",
    evidenceStrength: "partial-pending-review",
    precautions: secondaryTrack.cautions,
    reconsiderConditions: ["If no change in energy consistency is noticed after 6-8 weeks"],
  },
  {
    track: SAMPLE_TRACKS.tertiary,
    tier: "tertiary",
    whySelected: [
      "May help support mental clarity given the reported occasional brain fog",
      "Complements the sleep/energy focus of the other two tracks rather than duplicating it",
      "Non-stimulant cognitive support, consistent with the rest of the protocol",
    ],
    ingredients: tertiaryTrack.ingredients,
    timingAndFormat: `Daily, ${tertiaryTrack.format}`,
    whatYouMayObserve: "Occasional, gradual improvements in mental clarity — most noticeable once sleep and energy are also more consistent.",
    whatItIsNotFor: "Not a substitute for addressing the underlying sleep pattern — included as a complement, not the primary lever.",
    evidenceStrength: "not-yet-validated",
    precautions: tertiaryTrack.cautions,
    reconsiderConditions: ["If brain fog persists even after sleep and energy noticeably improve"],
  },
];

// ---------------------------------------------------------------------------
// P3-5 — Ingredient Intelligence
// ---------------------------------------------------------------------------

// Citations below are plain-text references (author/journal/year), not
// URLs — per project content policy (memory
// feedback_ingredient_claims_language), a citation is required per
// ingredient claim even in this mock/draft content, and a URL/DOI should
// never be fabricated for a source that hasn't been directly verified.
// These have NOT been vetted by Regulatory/legal — evidenceClassification
// stays "blocked" until that review happens; the citations exist so the
// claim isn't unsupported, not as a substitute for that review.
export const mockIngredientIntelligenceCards: IngredientIntelligenceProps[] = [
  {
    ingredientName: "Valerian",
    botanicalName: "Valeriana officinalis",
    traditionalUseContext: "Traditionally used as an evening botanical that may help support relaxation before sleep.",
    formulationRole: "May help support sleep onset as part of the PM Calm evening blend.",
    formAndAmount: "Included in the PM Calm evening blend — exact per-serving amount pending Claims/Evidence Library sign-off.",
    evidenceClassification: "blocked",
    citations: ["Bent S, Padula A, Moore D, Patterson E, Mehling W. \"Valerian for sleep: a systematic review and meta-analysis.\" Am J Med. 2006;119(12):1005-1012."],
    complementaryIngredients: ["Ashwagandha (KSM-66)", "L-theanine"],
    safetyAndInteractionNotes: ["Avoid combining with sedative medications without checking with a healthcare provider."],
  },
  {
    ingredientName: "Ashwagandha",
    botanicalName: "Withania somnifera",
    traditionalUseContext: "An adaptogenic root traditionally used to support the body's response to everyday stress.",
    formulationRole: "May help support stress adaptation in PM Calm, alongside Valerian's role in sleep onset.",
    formAndAmount: "Included in the PM Calm evening blend — exact per-serving amount pending Claims/Evidence Library sign-off.",
    evidenceClassification: "blocked",
    citations: ["Chandrasekhar K, Kapoor J, Anishetty S. \"A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of a high-concentration full-spectrum extract of ashwagandha root in reducing stress and anxiety in adults.\" Indian J Psychol Med. 2012;34(3):255-262."],
    complementaryIngredients: ["Valerian", "Magnesium glycinate"],
    safetyAndInteractionNotes: ["Framed as stress/hormone support only — never framed as affecting testosterone."],
  },
  {
    ingredientName: "Bacopa monnieri",
    traditionalUseContext: "Traditionally used to support memory and mental clarity.",
    formulationRole: "May help support cognitive function as part of the Cognitive Focus formula.",
    formAndAmount: "Included in the Cognitive Focus daily capsule — exact per-serving amount pending Claims/Evidence Library sign-off.",
    evidenceClassification: "blocked",
    citations: ["Stough C, Lloyd J, Clarke J, et al. \"The chronic effects of an extract of Bacopa monniera (Brahmi) on cognitive function in healthy human subjects.\" Psychopharmacology (Berl). 2001;156(4):481-484."],
    complementaryIngredients: ["Lion's mane", "Rhodiola rosea"],
    safetyAndInteractionNotes: ["No specific interaction notes on file yet — pending Claims/Evidence Library review."],
  },
];

// ---------------------------------------------------------------------------
// P3-6 — Daily LIFE Rhythm
// ---------------------------------------------------------------------------

export const mockDailyRhythmProps: DailyRhythmProps = {
  blocks: [
    { timeOfDay: "wake", label: "Wake", hydrationCue: "A full glass of water before coffee." },
    {
      timeOfDay: "morning_activation",
      label: "Morning Activation",
      botanicalTiming: `${secondaryTrack.name} — ${secondaryTrack.format}`,
      caffeineBoundary: "Coffee is fine through late morning.",
    },
    { timeOfDay: "midday_stability", label: "Midday Stability", mealRhythm: "A protein-forward lunch to help steady the afternoon." },
    { timeOfDay: "movement_window", label: "Movement Window", movement: "A short walk in the early afternoon, before the usual energy dip." },
    { timeOfDay: "evening_recovery", label: "Evening Recovery", caffeineBoundary: "No caffeine after early afternoon." },
    {
      timeOfDay: "sleep_prep",
      label: "Sleep Prep",
      botanicalTiming: `${primaryTrack.name} — ${primaryTrack.format}`,
      recoveryPractice: "A consistent wind-down window, screens off 30-60 minutes before bed.",
      sageCheckIn: "How did tonight's wind-down feel compared to last week?",
    },
  ],
  lifestyleCompatibilityNote: "Built around a steady in-office routine with no travel or shift-work constraints reported.",
};

// ---------------------------------------------------------------------------
// P3-7 — Roadmap + weekly check-in
// ---------------------------------------------------------------------------

export const mockRoadmapProps: RoadmapProps = {
  phases: [
    {
      label: "Stabilize",
      dayRange: "Days 1-30",
      focus: "Build the evening wind-down routine and get consistent with daily botanical timing.",
      milestones: ["Take PM Calm consistently 5+ nights/week", "Establish a fixed screens-off time"],
    },
    {
      label: "Build",
      dayRange: "Days 31-60",
      focus: "Layer in morning and midday habits as the sleep routine becomes automatic.",
      milestones: ["Add the midday movement window consistently", "Track afternoon energy weekly"],
    },
    {
      label: "Personalize",
      dayRange: "Days 61-90",
      focus: "Refine the protocol based on what's actually moved the needle for you.",
      milestones: ["Review 90-day check-in with Sage", "Decide what to keep, adjust, or drop"],
    },
  ],
  weeklyCheckIn: {
    questions: [
      "How was your morning vitality this week?",
      "How many days did you notice the afternoon decline?",
      "How was your sleep overall?",
      "How consistent were you with your protocol?",
      "How much movement did you get in?",
      "How would you rate your recovery?",
      "How's your sleep onset trending?",
      "Any side effects to flag?",
    ],
    priorityMarkerQuestion: "How's your sleep onset trending?",
  },
};

// ---------------------------------------------------------------------------
// P3-8 — Share card (private-safe "sneeze" feature)
// ---------------------------------------------------------------------------

// Constructed as an explicit field-by-field literal, per the safety note
// on ShareCardProps in types.ts — never via spread from a larger record.
export const mockShareCardProps: ShareCardProps = {
  lifePattern: "Wired at Night, Foggy by Day",
  topStrength: "Consistent daily routine once a habit is set",
  currentOpportunity: sleepDomain.label,
  ninetyDayIntention: "Falling asleep faster and waking up genuinely rested.",
};

// ---------------------------------------------------------------------------
// P3-9 — Progress comparison
// ---------------------------------------------------------------------------

export const mockProgressComparisonProps: ProgressComparisonProps = {
  then: {
    dayLabel: "Day 0",
    vitalityIndex: SAMPLE_VITALITY_INDEX,
    topBenchmarks: [
      { metric: "Sleep onset", current: "45-60 min" },
      { metric: "Afternoon energy dip severity", current: "Severe, most days" },
    ],
  },
  now: {
    dayLabel: "Day 30",
    vitalityIndex: SAMPLE_VITALITY_INDEX + 9,
    topBenchmarks: [
      { metric: "Sleep onset", current: "30-40 min" },
      { metric: "Afternoon energy dip severity", current: "Moderate" },
    ],
  },
  whatChanged: [
    "Sleep onset time down by roughly 15-20 minutes on average",
    "Afternoon energy dip reported as less severe, more days than not",
  ],
  sageRecommendsNext: "Keep the evening wind-down routine consistent and start layering in the midday movement window.",
};
