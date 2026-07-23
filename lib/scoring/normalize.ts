/**
 * P2-3: item normalization. Direct port of normalize_item() in
 * sage_scoring_engine.py — maps a raw 1..scaleMax item to 0..100, with
 * direction corrected so 100 always means "higher opportunity" (e.g. low
 * afternoon_energy is reverse-scored so a '1' — very low energy — maps to
 * a high opportunity score, not a low one).
 */
export function normalizeItem(rawValue: number, scaleMax = 5, reverse = false): number {
  const pct = ((rawValue - 1) / (scaleMax - 1)) * 100;
  return reverse ? 100 - pct : pct;
}
