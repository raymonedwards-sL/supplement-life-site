/**
 * P2-3: Domain Opportunity Score.
 * Direct port of domain_opportunity_score() in sage_scoring_engine.py.
 *
 *   OpportunityScore(domain) = clamp( mean(normalized_item_scores) x
 *     interference_multiplier, 0, 100 )
 *   interference_multiplier = 0.8 + 0.4 x (interference_rating / 5)
 *     // ranges ~0.88x to 1.2x on a 1-5 scale
 */
export function domainOpportunityScore(
  itemScores0to100: number[],
  interferenceRating1to5: number
): number {
  const base = itemScores0to100.reduce((sum, v) => sum + v, 0) / itemScores0to100.length;
  const multiplier = 0.8 + 0.4 * (interferenceRating1to5 / 5);
  const raw = Math.round(base * multiplier * 10) / 10;
  return Math.max(0, Math.min(100, raw));
}
