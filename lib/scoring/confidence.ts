/**
 * P2-5: Confidence / Data-Quality Score.
 * Direct port of confidence_score() in sage_scoring_engine.py.
 *
 *   completeness = answered_count / total_questions x 100
 *   straightlining_penalty = 15 if stdev(all_item_scores) < 5 else 0
 *   contradiction_penalty = 10 x number_of_contradiction_flags
 *   ConfidenceScore = max(0, completeness - straightlining_penalty - contradiction_penalty)
 */
function populationStdev(values: number[]): number {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function confidenceScore(
  allItemScores0to100: number[],
  answeredCount: number,
  totalQuestions: number,
  contradictionFlagCount: number
): number {
  const completeness = (answeredCount / totalQuestions) * 100;
  const straightliningPenalty =
    allItemScores0to100.length >= 4 && populationStdev(allItemScores0to100) < 5 ? 15 : 0;
  const contradictionPenalty = 10 * contradictionFlagCount;
  const score = completeness - straightliningPenalty - contradictionPenalty;
  return Math.max(0, Math.round(score * 10) / 10);
}
