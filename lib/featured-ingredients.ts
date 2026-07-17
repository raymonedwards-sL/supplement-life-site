/**
 * Curated "hero" ingredients shown on PUBLIC, pre-payment pages
 * (homepage Tracks teaser, /ingredients) — deliberately a sampling, not
 * each Track's complete formulation.
 *
 * Added 2026-07-17: the public ingredients page and homepage teaser
 * previously showed each Track's full ingredient roster (or, on the
 * homepage, the first 3 array entries — effectively the same thing for
 * shorter Tracks). That's a real proprietary-info exposure: it lets
 * anyone reconstruct the complete formulation without ever paying for
 * a LIFE Assessment or Founding Subscription. This file is the single
 * curated list both public surfaces pull from, so the sampling is
 * intentional and consistent rather than arbitrary.
 *
 * Deliberately NOT in lib/tracks.ts — that file's `ingredients` arrays
 * are the actual formulation (source of truth for Sage's intake
 * reasoning and the private dashboard/LIFE Brief) and must stay
 * untouched and complete. This is presentation-only curation for
 * anonymous visitors.
 */
export const FEATURED_INGREDIENTS_BY_TRACK: Record<string, string[]> = {
  "daily-restore": ["Burdock", "Sea moss"],
  "pm-calm": ["Ashwagandha (KSM-66)", "Valerian"],
  reset: ["Cascara sagrada", "Ginger"],
  vitality: ["Damiana", "Sarsaparilla"],
  immunity: ["Elderberry", "Reishi"],
  "morning-clarity": ["Kudzu root extract", "Dandelion root"],
  "womens-rhythm": ["Vitex (chasteberry)", "Raspberry leaf"],
  "mens-rhythm": ["Longjack (tongkat ali)", "Sarsaparilla"],
  "cognitive-focus": ["Bacopa monnieri", "Lion's mane"],
};

/**
 * Public-page-only summary overrides, keyed by IngredientEducation.name.
 *
 * The shared summaries in lib/ingredient-education.ts are also used on
 * the private, post-payment/assessment dashboard and intake Summary
 * Card (via components/ingredients/IngredientCard.tsx) — there, naming
 * a companion ingredient in a subscriber's own already-disclosed track
 * is fine and often useful context. Several of those same summaries
 * name a *non-featured* companion ingredient though (e.g. Longjack's
 * full summary mentions Callaloo, which isn't part of the public
 * sampling) — publishing that on the public /ingredients page re-leaks
 * a piece of the full formulation through the back door of the prose,
 * even after the track grid itself was trimmed. This map softens just
 * those sentences for the public page only; the shared data (and every
 * other surface that reads it) is untouched.
 */
export const PUBLIC_SUMMARY_OVERRIDES: Record<string, string> = {
  Ginger:
    "A warming root long used for digestive comfort and circulation support. It carries a mild anticoagulant-adjacent property worth mentioning to your care provider if you take blood-thinning medication.",
  "Cascara Sagrada":
    "A traditional bark used specifically for short-term, occasional bowel regularity support — never a daily-use ingredient in our formulation, and always capped at a 7-10 day cycle. Ginger is formulated alongside it specifically to ease any cramping from its stimulant action. Not recommended during pregnancy or nursing, without exception.",
  Damiana:
    "A traditional adult-wellness herb used for general vitality, confidence, and libido support, and one of the anchor ingredients across several of our vitality-focused formulas.",
  Sarsaparilla:
    "A climbing vine whose root has a long history of traditional use, most familiar today as the flavor behind classic sarsaparilla and root beer. In our formulas it contributes to a broad vitality and mineral-support profile.",
  Elderberry:
    "One of the most recognized berries in seasonal wellness traditions, rich in anthocyanins and vitamin-supportive compounds. It anchors the more immediate, acute-response side of our Immunity formula.",
  Reishi:
    "Known as Lingzhi in Chinese tradition, this is one of the most storied functional mushrooms in East Asian herbalism, historically associated with longevity and resilience. It's part of the functional-mushroom layer of our Immunity formula.",
  "Raspberry Leaf":
    "A traditional herb used for cycle-related comfort, formulated in Women's Rhythm to support the weeks while Vitex's slower-building effects take hold.",
  "Longjack (Tongkat Ali)":
    "A root native to Southeast Asia with a long tradition of use for male vitality and stamina. It's the ingredient that differentiates our Men's Rhythm formula from Vitality. We frame it around vitality and stamina, not as a hormone-level claim.",
  "Bacopa Monnieri":
    "The most consumer-recognized memory-focused herb in modern nootropic use, standardized for its bacoside content. It's stimulant-free and builds gradually over several weeks — it isn't designed for an immediate effect, and is formulated for sustained support in our Cognitive Focus formula, not a quick fix.",
};
