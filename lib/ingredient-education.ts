/**
 * Subscriber-facing botanical/nutrient education content — powers the
 * richer ingredient presentation on the post-intake Wellness Profile
 * Summary (app/intake/IntakeChat.tsx) and the dashboard's "Your Botanical
 * Compounds" section (app/dashboard/page.tsx).
 *
 * This is DELIBERATELY separate from lib/claude/ingredient-reference.ts —
 * that file is internal agent-training content (talking points, cross-sell
 * logic, "NEVER SAY" guardrails written for Sage, not for a subscriber to
 * read directly). This file holds short, plain-language, compliance-safe
 * copy meant to be displayed directly in the product UI, plus a verified
 * outbound Wikipedia link per ingredient for subscribers who want to go
 * deeper on their own.
 *
 * Source of truth for WHICH ingredients exist: lib/tracks.ts. Every
 * ingredient string that appears in any TRACKS[].ingredients array should
 * have an entry here — build() below will resolve raw catalog strings
 * (including parenthetical variants like "Longjack (tongkat ali)") to the
 * matching entry. Do not add ingredients here that aren't in lib/tracks.ts;
 * a subscriber should never see an education card for something that
 * isn't actually in their kit. (Note: the Hero Ingredient Reference
 * mentions two ingredients — DGL and Spirulina — that are NOT in the
 * current v8-corrected lib/tracks.ts catalog; they're intentionally
 * excluded here for that reason.)
 *
 * Wikipedia URLs were verified via live search on 2026-07-12, not
 * guessed — several of these ingredients have ambiguous or
 * disambiguation-prone naming (Callaloo, Sea Moss, Sarsaparilla, Reishi,
 * Astragalus) where a plausible-looking slug would have been wrong.
 *
 * Copy guardrails: same compliance posture as the rest of the project —
 * no disease-treatment or diagnostic claims, no "detox"/"cleanse"
 * language, conservative hormone-related framing, pregnancy exclusions
 * flagged where lib/tracks.ts already flags them. Wikipedia is linked as
 * a general-reference external source, not as medical advice — the card
 * UI should carry a light disclaimer for that reason (see components).
 */

export type IngredientFamily =
  | "root"
  | "leaf"
  | "flower"
  | "berry"
  | "bark"
  | "mushroom"
  | "algae"
  | "mineral";

/**
 * Issue<>benefit groupings used to organize a subscriber's ingredients on
 * the dashboard (2026-07-15 dashboard architecture pass) — e.g. Sarsaparilla
 * maps to "energy-vitality" (general fatigue / low energy), not to whatever
 * track it happens to ship in. One primary category per ingredient, chosen
 * for its dominant documented role even where an ingredient plays a
 * secondary part elsewhere (e.g. Ginger is filed under digestive-comfort,
 * its paired role alongside Fennel/Cascara Sagrada, even though it also
 * appears in energy-forward tracks).
 */
export type BenefitCategoryKey =
  | "energy-vitality"
  | "sleep-calm"
  | "digestive-comfort"
  | "immune-defense"
  | "hormonal-balance"
  | "cognitive-focus"
  | "mindful-moderation";

export type BenefitCategory = {
  key: BenefitCategoryKey;
  label: string;
  description: string;
};

/** Canonical display order for grouped ingredient sections. */
export const BENEFIT_CATEGORIES: BenefitCategory[] = [
  {
    key: "energy-vitality",
    label: "Energy & Vitality",
    description: "For fatigue, low energy, and post-exertion recovery.",
  },
  {
    key: "sleep-calm",
    label: "Stress & Sleep",
    description: "For a racing mind, poor sleep onset, and nightly wind-down.",
  },
  {
    key: "digestive-comfort",
    label: "Digestive Comfort",
    description: "For bloating, regularity, and general digestive ease.",
  },
  {
    key: "immune-defense",
    label: "Immune Defense & Resilience",
    description: "For seasonal defense and cellular resilience.",
  },
  {
    key: "hormonal-balance",
    label: "Hormonal Balance",
    description: "For cycle comfort, perimenopause, and hormone-rhythm support.",
  },
  {
    key: "cognitive-focus",
    label: "Cognitive Clarity & Focus",
    description: "For memory, focus, and mental clarity.",
  },
  {
    key: "mindful-moderation",
    label: "Morning Reset & Moderation",
    description: "For morning reset and mindful-drinking lifestyle support.",
  },
];

export function getBenefitCategory(key: BenefitCategoryKey): BenefitCategory {
  return BENEFIT_CATEGORIES.find((c) => c.key === key) ?? BENEFIT_CATEGORIES[0];
}

export type IngredientEducation = {
  /** Canonical display name (clean, no parentheticals). */
  name: string;
  family: IngredientFamily;
  /** Primary issue<>benefit grouping — see BenefitCategoryKey above. */
  category: BenefitCategoryKey;
  /** 2-4 sentence subscriber-safe educational summary. */
  summary: string;
  wikipediaUrl: string;
  /** Link label, if different from `name`. */
  wikipediaLabel?: string;
};

export const INGREDIENT_EDUCATION: Record<string, IngredientEducation> = {
  burdock: {
    name: "Burdock",
    family: "root",
    category: "energy-vitality",
    summary:
      "A traditional Caribbean and African botanical with the broadest documented heritage use in our system. Its root is rich in inulin, a prebiotic fiber that feeds beneficial gut bacteria, alongside soothing mucilage and trace minerals. You'll see it recur across several of your tracks — that's intentional formulation cohesion, not repetition.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Burdock",
  },
  "yellow dock": {
    name: "Yellow Dock",
    family: "root",
    category: "digestive-comfort",
    summary:
      "A gentle bitter root, always paired with Burdock in our formulas as a mineral and digestive-comfort duo. Its mild anthraquinone content offers a much softer effect than dedicated stimulant herbs like Cascara Sagrada — it's here to support, not to move things quickly.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Rumex_crispus",
    wikipediaLabel: "Rumex crispus (Yellow Dock)",
  },
  "sea moss": {
    name: "Sea Moss",
    family: "algae",
    category: "energy-vitality",
    summary:
      "A mineral-forward marine algae valued for its iodine, potassium, calcium, and magnesium content, with a gel-like texture that works naturally into tonic formats. Sourcing and species identification within the sea moss category vary widely across the supplement industry, so we stay conservative about species-specific claims until our own documentation is fully confirmed.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Chondrus_crispus",
    wikipediaLabel: "Chondrus crispus (a commercial 'Irish moss' species)",
  },
  ginger: {
    name: "Ginger",
    family: "root",
    category: "digestive-comfort",
    summary:
      "A warming root long used for digestive comfort and circulation support. In your formulas it's often paired with Fennel to ease the digestive system, and it carries a mild anticoagulant-adjacent property worth mentioning to your care provider if you take blood-thinning medication.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Ginger",
  },
  fennel: {
    name: "Fennel",
    family: "flower",
    category: "digestive-comfort",
    summary:
      "A carminative herb traditionally used to ease bloating and gas. It has mild phytoestrogenic activity, so we keep hormone-related claims conservative anywhere it appears — its role in your stack is digestive comfort, not hormonal support.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Fennel",
  },
  callaloo: {
    name: "Callaloo",
    family: "leaf",
    category: "energy-vitality",
    summary:
      "A leafy green with deep roots in Caribbean and West African foodways — the strongest heritage alignment of any ingredient in our system. It's a natural source of iron and folate and is notably high in vitamin K, which is why we flag it if you're on blood-thinning medication.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Callaloo",
  },
  chamomile: {
    name: "Chamomile",
    family: "flower",
    category: "sleep-calm",
    summary:
      "One of the most widely recognized calming herbs, valued for its apigenin content and gentle, non-sedating affinity for relaxation. It also offers mild digestive comfort, which is why it bridges both our calming and digestive-support formulas. If you have a ragweed allergy, mention it — Chamomile is in the same plant family.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Chamomile",
  },
  "tilia-linden": {
    name: "Linden (Tilia)",
    family: "flower",
    category: "sleep-calm",
    summary:
      "The flower and leaf of the linden tree, used across generations of folk tradition as a gentle evening infusion. Linden's flavonoids, including quercetin and tiliroside, are part of what gives it its long-standing reputation as a calming, wind-down botanical.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Tilia",
  },
  "blue vervain": {
    name: "Blue Vervain",
    family: "flower",
    category: "sleep-calm",
    summary:
      "A native North American flowering plant with a long history in traditional herbal practice as a calming, nervine botanical. It grows wild in meadows and along riverbanks, and its slender purple flower spikes are part of the same gentle, wind-down family as Chamomile and Linden in your formulas.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Verbena_hastata",
  },
  "ashwagandha (ksm-66)": {
    name: "Ashwagandha (KSM-66)",
    family: "root",
    category: "sleep-calm",
    summary:
      "An adaptogenic root used for centuries in Ayurvedic tradition, here in the KSM-66 standardized extract form most studied for stress support. We frame it strictly as stress and hormone-rhythm support — it is not positioned for testosterone or performance effects.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Withania_somnifera",
  },
  magnesium: {
    name: "Magnesium",
    family: "mineral",
    category: "sleep-calm",
    summary:
      "An essential mineral involved in hundreds of processes in the body, including muscle relaxation and nervous-system regulation. In our PM formula it's used in the glycinate form, chosen specifically for gentle absorption as part of an evening wind-down routine.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Magnesium",
  },
  "l-theanine": {
    name: "L-Theanine",
    family: "leaf",
    category: "cognitive-focus",
    summary:
      "An amino acid naturally found in tea leaves, known for supporting a calm, alert state without sedation and without stimulants. It tends to be felt within about an hour, which is why it's often the part of a formula you notice first while slower-building ingredients like Bacopa Monnieri work over several weeks.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Theanine",
  },
  valerian: {
    name: "Valerian Root",
    family: "root",
    category: "sleep-calm",
    summary:
      "The most clinically studied sleep-onset herb in our catalog. Its valerenic acid content supports the body's natural sedation pathway, and we use it exclusively in capsule form — its distinctive odor makes tea or tincture formats impractical for most people.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Valerian_(herb)",
  },
  "cascara sagrada": {
    name: "Cascara Sagrada",
    family: "bark",
    category: "digestive-comfort",
    summary:
      "A traditional bark used specifically for short-term, occasional bowel regularity support — never a daily-use ingredient in our formulation, and always capped at a 7-10 day cycle. Ginger and Fennel are formulated alongside it specifically to ease any cramping from its stimulant action. Not recommended during pregnancy or nursing, without exception.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Cascara_sagrada",
  },
  damiana: {
    name: "Damiana",
    family: "leaf",
    category: "hormonal-balance",
    summary:
      "A traditional adult-wellness herb used for general vitality, confidence, and libido support. It plays the same role in both our Women's Rhythm and Men's Rhythm formulas — those tracks differentiate through their other anchor ingredient, not through Damiana.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Damiana",
  },
  sarsaparilla: {
    name: "Sarsaparilla",
    family: "root",
    category: "energy-vitality",
    summary:
      "A climbing vine whose root has a long history of traditional use, most familiar today as the flavor behind classic sarsaparilla and root beer. In our formulas it contributes to the same broad vitality and mineral-support profile as Burdock and Sea Moss.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Sarsaparilla",
  },
  elderberry: {
    name: "Elderberry",
    family: "berry",
    category: "immune-defense",
    summary:
      "One of the most recognized berries in seasonal wellness traditions, rich in anthocyanins and vitamin-supportive compounds. It anchors the more immediate, acute-response side of our Immunity formula, complementing Astragalus and Chaga's longer-term resilience roles.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Sambucus",
  },
  echinacea: {
    name: "Echinacea",
    family: "flower",
    category: "immune-defense",
    summary:
      "A well-known North American coneflower with a long tradition of seasonal wellness use. It's part of the acute-response layer of our Immunity formula, working alongside Elderberry.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Echinacea",
  },
  astragalus: {
    name: "Astragalus",
    family: "root",
    category: "immune-defense",
    summary:
      "Known as Huang Qi in Traditional Chinese Medicine, this root has a centuries-long history as a foundational tonic herb. In our Immunity formula it represents the longer-term, cellular-resilience side of seasonal support, distinct from Elderberry and Echinacea's more immediate role.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Huangqi",
    wikipediaLabel: "Huangqi (Astragalus)",
  },
  chaga: {
    name: "Chaga",
    family: "mushroom",
    category: "immune-defense",
    summary:
      "A wild-harvested functional mushroom that grows on birch trees in northern latitudes, prized for its beta-glucan content and among the highest antioxidant activity measured in nature. If you're on blood-thinning medication or considering our Cognitive Focus formula (which contains Ginkgo), it's worth mentioning to your care provider — several mushroom and botanical ingredients in this category share a mild blood-thinning adjacency.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Inonotus_obliquus",
  },
  reishi: {
    name: "Reishi",
    family: "mushroom",
    category: "immune-defense",
    summary:
      "Known as Lingzhi in Chinese tradition, this is one of the most storied functional mushrooms in East Asian herbalism, historically associated with longevity and resilience. It rounds out the functional-mushroom layer of our Immunity formula alongside Chaga.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Ganoderma_lucidum",
    wikipediaLabel: "Ganoderma lucidum (Reishi / Lingzhi)",
  },
  "vitamin c": {
    name: "Vitamin C",
    family: "mineral",
    category: "immune-defense",
    summary:
      "An essential, water-soluble vitamin and well-known antioxidant that the body cannot produce on its own. It's included in our Immunity formula as a foundational nutritional layer alongside Zinc.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Vitamin_C",
  },
  zinc: {
    name: "Zinc",
    family: "mineral",
    category: "immune-defense",
    summary:
      "An essential trace mineral involved in normal immune-system function and cellular metabolism. It works alongside Vitamin C in our Immunity formula as core nutritional support.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Zinc",
  },
  "kudzu root extract": {
    name: "Kudzu Root Extract",
    family: "root",
    category: "mindful-moderation",
    summary:
      "The founding ingredient in our Morning Clarity formula, chosen specifically for the mindful-drinking and moderation lifestyle segment. Its isoflavones extract well in liquid form, which is why it's formulated as an AM tonic shot rather than a capsule. This is a lifestyle-support ingredient, not a treatment for alcohol dependency — if that's a concern for you, we'd point you toward professional support resources instead.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Kudzu",
  },
  "dandelion root": {
    name: "Dandelion Root",
    family: "root",
    category: "digestive-comfort",
    summary:
      "A traditional bitter-tonic root long used to support digestion, formulated alongside Kudzu in our Morning Clarity tonic as part of an AM ritual routine.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Taraxacum",
    wikipediaLabel: "Taraxacum (Dandelion)",
  },
  "vitex (chasteberry)": {
    name: "Vitex (Chasteberry)",
    family: "berry",
    category: "hormonal-balance",
    summary:
      "A hormonal-rhythm herb with a documented dopamine and prolactin-modulating mechanism, used consistently daily rather than as-needed. Effects build gradually over 8-12 weeks, so it's formulated for sustained support, not same-cycle relief. Not recommended during pregnancy or nursing, and if you use hormonal birth control or are in fertility treatment, it's worth a conversation with your care provider before starting.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Vitex_agnus-castus",
  },
  "raspberry leaf": {
    name: "Raspberry Leaf",
    family: "leaf",
    category: "hormonal-balance",
    summary:
      "A traditional herb used for cycle-related comfort, formulated alongside Chamomile and Callaloo in Women's Rhythm to support the weeks while Vitex's slower-building effects take hold.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Rubus_idaeus",
    wikipediaLabel: "Rubus idaeus (Raspberry)",
  },
  "longjack (tongkat ali)": {
    name: "Longjack (Tongkat Ali)",
    family: "root",
    category: "energy-vitality",
    summary:
      "A root native to Southeast Asia with a long tradition of use for male vitality and stamina. It's the ingredient that differentiates our Men's Rhythm formula from Vitality, and it's paired with Callaloo's circulation-supportive role. We frame it around vitality and stamina, not as a hormone-level claim.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Eurycoma_longifolia",
  },
  "bacopa monnieri": {
    name: "Bacopa Monnieri",
    family: "leaf",
    category: "cognitive-focus",
    summary:
      "The most consumer-recognized memory-focused herb in modern nootropic use, standardized for its bacoside content. It's stimulant-free and builds gradually over several weeks — it isn't designed for an immediate effect, which is why it's paired with the faster-acting L-Theanine in our Cognitive Focus formula.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Bacopa_monnieri",
  },
  "lion's mane": {
    name: "Lion's Mane",
    family: "mushroom",
    category: "cognitive-focus",
    summary:
      "A distinctive, shaggy-white functional mushroom studied for its role in supporting nerve and cognitive health. It rounds out the functional-mushroom layer of our Cognitive Focus formula.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Hericium_erinaceus",
  },
  "ginkgo biloba": {
    name: "Ginkgo Biloba",
    family: "leaf",
    category: "cognitive-focus",
    summary:
      "One of the oldest living tree species, recognized by its distinctive fan-shaped leaf. It's long been studied for circulatory and cognitive support, and like other ingredients in this category carries a mild blood-thinning adjacency worth mentioning if you're on anticoagulant medication.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Ginkgo_biloba",
  },
  "rhodiola rosea": {
    name: "Rhodiola Rosea",
    family: "root",
    category: "cognitive-focus",
    summary:
      "An adaptogenic root that grows in cold, mountainous regions, traditionally used to support resilience under mental and physical stress as part of our Cognitive Focus formula.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Rhodiola_rosea",
  },
  "cognizin (citicoline)": {
    name: "Cognizin (Citicoline)",
    family: "mineral",
    category: "cognitive-focus",
    summary:
      "A naturally occurring compound in human and animal cells, here in the branded Cognizin form of citicoline, studied for its role in brain-cell membrane health and focus support. It's a modern, standardized nutrient rather than a traditional botanical.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Citicoline",
  },
};

/**
 * Raw ingredient strings in lib/tracks.ts sometimes carry parenthetical
 * clarifications ("Longjack (tongkat ali)", "Callaloo (iron + folate)") or
 * differ slightly in casing/spacing. This maps every exact raw string that
 * currently appears across TRACKS[].ingredients to its lookup key above —
 * an explicit map rather than fuzzy normalization, since the ingredient
 * set is small and fixed, and explicit mapping fails loudly (returns
 * undefined) instead of silently mismatching.
 */
const RAW_TO_KEY: Record<string, string> = {
  Burdock: "burdock",
  "Yellow dock": "yellow dock",
  "Sea moss": "sea moss",
  Ginger: "ginger",
  Fennel: "fennel",
  Callaloo: "callaloo",
  "Callaloo (iron + folate)": "callaloo",
  Chamomile: "chamomile",
  "Tila/linden": "tilia-linden",
  "Blue vervain": "blue vervain",
  "Ashwagandha (KSM-66)": "ashwagandha (ksm-66)",
  "Magnesium glycinate": "magnesium",
  Magnesium: "magnesium",
  "L-theanine": "l-theanine",
  Valerian: "valerian",
  "Cascara sagrada": "cascara sagrada",
  Damiana: "damiana",
  Sarsaparilla: "sarsaparilla",
  Elderberry: "elderberry",
  Echinacea: "echinacea",
  Astragalus: "astragalus",
  Chaga: "chaga",
  Reishi: "reishi",
  "Vitamin C": "vitamin c",
  Zinc: "zinc",
  "Kudzu root extract": "kudzu root extract",
  "Dandelion root": "dandelion root",
  "Vitex (chasteberry)": "vitex (chasteberry)",
  "Raspberry leaf": "raspberry leaf",
  "Longjack (tongkat ali)": "longjack (tongkat ali)",
  "Bacopa monnieri": "bacopa monnieri",
  "Lion's mane": "lion's mane",
  "Ginkgo biloba": "ginkgo biloba",
  "Rhodiola rosea": "rhodiola rosea",
  "Cognizin (citicoline)": "cognizin (citicoline)",
};

/** Resolve a raw ingredient string (as found in lib/tracks.ts) to its education entry, if any. */
export function getIngredientEducation(raw: string): IngredientEducation | undefined {
  const key = RAW_TO_KEY[raw] ?? RAW_TO_KEY[raw.trim()];
  return key ? INGREDIENT_EDUCATION[key] : undefined;
}

/** Resolve a list of raw ingredient strings (e.g. a track's `ingredients` array) to education entries, de-duplicated, dropping any without an entry. */
export function getIngredientEducationList(rawList: string[]): IngredientEducation[] {
  const seen = new Set<string>();
  const out: IngredientEducation[] = [];
  for (const raw of rawList) {
    const entry = getIngredientEducation(raw);
    if (entry && !seen.has(entry.name)) {
      seen.add(entry.name);
      out.push(entry);
    }
  }
  return out;
}

export type GroupedIngredientEducation = BenefitCategory & {
  ingredients: IngredientEducation[];
};

/**
 * Groups a subscriber's ingredients by issue<>benefit category (dashboard
 * "Your Botanical Compounds" section, 2026-07-15) instead of a flat list —
 * e.g. Sarsaparilla surfaces under "Energy & Vitality" regardless of which
 * track shipped it. Categories with no ingredients present are omitted
 * rather than shown empty; order follows BENEFIT_CATEGORIES.
 */
export function groupIngredientEducationByCategory(
  rawList: string[]
): GroupedIngredientEducation[] {
  const flat = getIngredientEducationList(rawList);
  return BENEFIT_CATEGORIES.map((cat) => ({
    ...cat,
    ingredients: flat.filter((ing) => ing.category === cat.key),
  })).filter((group) => group.ingredients.length > 0);
}

/**
 * The single dominant benefit category for a track, derived from its own
 * ingredient list — used as the "hero caption" tying a track's product
 * image to the matching Botanical Compounds grouping below it, so a
 * subscriber can visually link the two sections. Ties broken by
 * BENEFIT_CATEGORIES display order (earlier category wins).
 */
export function getDominantBenefitCategory(rawList: string[]): BenefitCategory | undefined {
  const flat = getIngredientEducationList(rawList);
  if (flat.length === 0) return undefined;
  const counts = new Map<BenefitCategoryKey, number>();
  for (const ing of flat) {
    counts.set(ing.category, (counts.get(ing.category) ?? 0) + 1);
  }
  let best: BenefitCategoryKey = flat[0].category;
  let bestCount = 0;
  for (const cat of BENEFIT_CATEGORIES) {
    const count = counts.get(cat.key) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = cat.key;
    }
  }
  return getBenefitCategory(best);
}
