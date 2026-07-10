/**
 * Supplement :: LIFE product catalog — source of truth for the intake
 * recommendation engine (app/api/intake/chat/route.ts).
 *
 * Pulled from LIFE_Product_Map_v7_callaloo.docx and
 * LIFE_CoPacker_Formulation_Packet_v5_final.docx (June 2026 revision).
 * Update this file, not the prompt in lib/claude/intake.ts, when the
 * formulation changes — the system prompt reads from here directly.
 */

export type Track = {
  id: string;
  name: string;
  consumerNeed: string;
  ingredients: string[];
  format: string;
  positioning: string;
  /** Compliance-sensitive framing notes — the model must respect these. */
  cautions: string[];
  /** Product packaging photo, cropped from public/products/full-collection.jpg. Path relative to /public. */
  image: string;
};

export const TRACKS: Track[] = [
  {
    id: "daily-restore",
    name: "Daily Restore",
    consumerNeed: "Fatigue, low vitality, post-exertion recovery",
    ingredients: ["Sea moss", "Burdock", "Sarsaparilla", "Damiana", "Callaloo"],
    format: "AM tonic, capsules, mineral powder",
    positioning: "Mineral-rich daily support for energy and resilience.",
    cautions: [
      "Callaloo is high in Vitamin K — do not recommend to anyone who mentions taking anticoagulant/blood-thinning medication.",
    ],
    image: "/products/tracks/daily-restore.jpg",
  },
  {
    id: "pm-calm",
    name: "PM Calm",
    consumerNeed: "Stress, racing mind, poor sleep onset",
    ingredients: [
      "Chamomile",
      "Tila/linden",
      "Blue vervain",
      "Ashwagandha (KSM-66)",
      "Magnesium glycinate",
      "L-theanine",
      "Valerian",
    ],
    format: "PM tea, tincture, sleep gummies",
    positioning: "Gentle wind-down support for nightly restoration.",
    cautions: [
      "Ashwagandha: frame as stress/hormone-support only — never claim testosterone effects.",
    ],
    image: "/products/tracks/pm-calm.jpg",
  },
  {
    id: "reset",
    name: "Reset",
    consumerNeed: "Temporary constipation support",
    ingredients: ["Cascara sagrada", "Burdock", "Chamomile"],
    format: "Short-cycle capsule or tea",
    positioning: "Short-term regularity support only.",
    cautions: [
      "Occasional-use only — never frame as a daily-use product.",
      "Keep laxative-effect language conservative; caution for sensitive users.",
    ],
    image: "/products/tracks/reset.jpg",
  },
  {
    id: "vitality",
    name: "Vitality",
    consumerNeed: "Stamina, energy, post-exertion recovery",
    ingredients: ["Damiana", "Sarsaparilla", "Sea moss", "Burdock", "Callaloo"],
    format: "Capsules, mineral powder, AM tonic",
    positioning: "Mineral-rich daily support for energy and resilience.",
    cautions: [
      "Callaloo is high in Vitamin K — do not recommend to anyone who mentions taking anticoagulant/blood-thinning medication.",
      "Damiana: avoid fertility guarantees or performance claims.",
    ],
    image: "/products/tracks/vitality.jpg",
  },
  {
    id: "immunity",
    name: "Immunity",
    consumerNeed: "Seasonal defense, cellular resilience",
    ingredients: [
      "Elderberry",
      "Echinacea",
      "Astragalus",
      "Chaga",
      "Reishi",
      "Callaloo",
      "Vitamin C",
      "Zinc",
    ],
    format: "Capsules + immunity tea blend",
    positioning: "Targeted seasonal defense and daily cellular support.",
    cautions: [
      "Callaloo is high in Vitamin K — do not recommend to anyone who mentions taking anticoagulant/blood-thinning medication.",
    ],
    image: "/products/tracks/immunity.jpg",
  },
  {
    id: "morning-clarity",
    name: "Morning Clarity",
    consumerNeed: "Morning reset, craving moderation, calm alertness",
    ingredients: ["Kudzu root extract", "Dandelion root", "Magnesium", "L-theanine"],
    format: "AM tonic shot + PM capsule",
    positioning: "Lifestyle-framed morning reset; social drinker segment.",
    cautions: [
      "Kudzu: never frame as alcohol-dependence treatment or a hangover cure.",
    ],
    image: "/products/tracks/morning-clarity.jpg",
  },
  {
    id: "womens-rhythm",
    name: "Women's Rhythm",
    consumerNeed: "PMS, cycle comfort, perimenopause, mood shifts",
    ingredients: [
      "Vitex (chasteberry)",
      "Damiana",
      "Chamomile",
      "Blue vervain",
      "Yellow dock",
      "Sea moss",
      "Callaloo",
    ],
    format: "Cycle-phase packs, AM/PM stack",
    positioning: "Hormone-supportive wellness without medical promises.",
    cautions: [
      "Vitex: frame only as 'supports natural hormonal rhythm,' never 'regulates hormones.' Effects are gradual (8-12 week onset) — don't promise fast results.",
      "Do not recommend to anyone mentioning hormonal contraceptives or fertility treatment — flag for a healthcare provider conversation instead.",
      "Callaloo is high in Vitamin K — do not recommend to anyone who mentions taking anticoagulant/blood-thinning medication.",
    ],
    image: "/products/tracks/womens-rhythm.jpg",
  },
  {
    id: "mens-rhythm",
    name: "Men's Rhythm",
    consumerNeed: "Stamina, confidence, energy, age management",
    ingredients: [
      "Damiana",
      "Sarsaparilla",
      "Sea moss",
      "Burdock",
      "Callaloo",
      "Longjack (tongkat ali)",
    ],
    format: "Capsules, tonic, performance blend",
    positioning: "Non-stimulant vitality support for active adults.",
    cautions: [
      "Longjack: avoid direct testosterone claims — frame as vitality/stamina support only.",
      "Callaloo is high in Vitamin K — do not recommend to anyone who mentions taking anticoagulant/blood-thinning medication.",
    ],
    image: "/products/tracks/mens-rhythm.jpg",
  },
  {
    id: "cognitive-focus",
    name: "Cognitive Focus",
    consumerNeed: "Memory, focus, mental clarity, fatigue reduction",
    ingredients: [
      "Bacopa monnieri",
      "Lion's mane",
      "L-theanine",
      "Ginkgo biloba",
      "Rhodiola rosea",
      "Cognizin (citicoline)",
      "Callaloo (iron + folate)",
    ],
    format: "Capsules",
    positioning: "Neurogenesis, memory, calm alertness, brain energy.",
    cautions: [
      "Callaloo is high in Vitamin K — do not recommend to anyone who mentions taking anticoagulant/blood-thinning medication.",
      "Never use 'neurogenesis' or similar terms as a clinical/medical claim — keep to plain-language 'supports brain energy and focus.'",
    ],
    image: "/products/tracks/cognitive-focus.jpg",
  },
];

export function findTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}
