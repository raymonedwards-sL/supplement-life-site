/**
 * Categorized pain-point taxonomy (2026-07-20) — the user shared a
 * 10-item research list ("# / Pain point") and asked to "capture
 * (categorically) this list." Split into two real, different categories
 * rather than left as one flat list:
 *
 *  - physical_signal: an actual symptom/experience the person is having
 *    (racing mind, afternoon crash, etc.) — these map to the Maya/Marcus
 *    portraits' documented pain points.
 *  - buying_frustration: not a symptom at all, but friction with the
 *    supplement-shopping process itself (distrust of claims, wanting one
 *    system instead of four brands, not knowing where to start) — these
 *    map to the portraits' "what earns/breaks trust" sections, not their
 *    "daily reality" sections.
 *
 * Kept as a standalone reference file (not inlined in app/join/page.tsx)
 * so it's reusable anywhere a category-tagged pain point is useful later
 * — e.g. daily-digest topic rotation, a future intake refinement, or
 * content tagging — not just this one page.
 *
 * Two entries (`recovery-time`, `hormonal-metabolic-shift`) were kept
 * from the original 5-item /join question rather than dropped, since
 * they cover real portrait content (Marcus's recovery-window and
 * testosterone-decline signals specifically) that isn't represented in
 * the user's 10-item list — "capture this list" was additive, not a
 * replacement of prior, still-valid coverage.
 */

export type PainPointCategory = "physical_signal" | "buying_frustration";

export interface PainPoint {
  id: string;
  label: string;
  category: PainPointCategory;
}

export const PAIN_POINT_CATEGORY_LABELS: Record<PainPointCategory, string> = {
  physical_signal: "What's going on physically",
  buying_frustration: "What's been frustrating about the process",
};

export const PAIN_POINTS: PainPoint[] = [
  // Physical signals — from the user's list
  { id: "racing-mind", label: "My mind races at night", category: "physical_signal" },
  { id: "poor-sleep-onset", label: "I'm exhausted, but I can't fall asleep", category: "physical_signal" },
  { id: "afternoon-crash", label: "I crash and get foggy every afternoon", category: "physical_signal" },
  { id: "stress-digestion", label: "Stress shows up in my digestion", category: "physical_signal" },
  { id: "cycle-irregularity", label: "My cycle is unpredictable and uncomfortable", category: "physical_signal" },
  // Physical signals — carried over from the original /join question,
  // covering portrait content not in the user's list (Marcus-specific)
  { id: "recovery-time", label: "My recovery takes longer than it used to", category: "physical_signal" },
  { id: "hormonal-metabolic-shift", label: "I'm going through a hormonal or metabolic shift my labs don't explain", category: "physical_signal" },

  // Buying frustrations — from the user's list
  { id: "skeptical-generic", label: "I'm skeptical of generic wellness products", category: "buying_frustration" },
  { id: "wants-one-stack", label: "I want one stack, not multiple brands", category: "buying_frustration" },
  { id: "distrust-fad-claims", label: "I distrust fads or medical claims", category: "buying_frustration" },
  { id: "wants-premium-not-impulse", label: "I want premium products, not an impulse-buy vibe", category: "buying_frustration" },
  { id: "doesnt-know-where-to-start", label: "I don't know where to start", category: "buying_frustration" },
];

export function getPainPointsByCategory(category: PainPointCategory): PainPoint[] {
  return PAIN_POINTS.filter((p) => p.category === category);
}
