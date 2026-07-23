/**
 * P2-6: Contradictory-Response Handling.
 * Direct port of check_contradictions() in sage_scoring_engine.py — the
 * four rules that were actually executed and documented in the spec
 * (Test 1-4 + control, see scripts/sage-scoring-verify.ts for the
 * parity check against those exact results).
 */
import type { SafetyGateIntake } from "./safety-gate";

export type ContradictionResponses = {
  afternoon_energy?: number;
  exertion_recovery?: number;
  sleep_quality?: number;
  racing_mind?: number;
};

export type ContradictionFlag = {
  /** true if this is a hard data error that must block completion,
   * rather than just reduce confidence and prompt one follow-up. */
  hardError: boolean;
  message: string;
  /** Ready-to-show, subscriber-facing phrasing of the clarifying
   * follow-up question for this specific tension — undefined for
   * hardError flags, which block completion instead of prompting a
   * follow-up. Used as a guaranteed, deterministic fallback in
   * app/api/intake/chat/route.ts if Sage's own attempts to ask this
   * naturally don't verifiably ask a direct question (checked via
   * lib/claude/intake.ts's judge call) — so the P2-2 "ask exactly one
   * clarifying follow-up" requirement holds even when free-form
   * generation doesn't reliably comply on every run. */
  subscriberQuestion?: string;
};

export function checkContradictions(
  responses: ContradictionResponses,
  intake: SafetyGateIntake & { post_menopausal?: boolean }
): ContradictionFlag[] {
  const flags: ContradictionFlag[] = [];

  // Rule 1: severe daily fatigue but excellent exertion recovery
  if ((responses.afternoon_energy ?? 3) <= 2 && (responses.exertion_recovery ?? 3) >= 4) {
    flags.push({
      hardError: false,
      message:
        "Cellular Energy vs. Vitality: reported severe afternoon fatigue AND excellent " +
        "post-exertion recovery in the same intake — internally inconsistent signal. " +
        "Confidence on both domains reduced; Sage should ask one clarifying follow-up " +
        "before finalizing scores.",
      subscriberQuestion:
        "That's an interesting combination — you mentioned feeling pretty wiped out by " +
        "mid-afternoon most days, but also that your recovery after workouts is excellent " +
        "and effortless. Those two don't always travel together. Can you help me understand " +
        "how both of those are true for you?",
    });
  }

  // Rule 2: pregnant AND on hormonal contraceptive (logically inconsistent)
  if (intake.pregnant && intake.hormonal_contraceptive) {
    flags.push({
      hardError: false,
      message:
        "Pregnancy + hormonal contraceptive both disclosed — logically inconsistent. " +
        "Safety Gate resolves conservatively: pregnancy exclusions apply regardless " +
        "(Reset hard-excluded) until the user clarifies.",
      subscriberQuestion:
        "I want to double-check something before I go further — pregnancy and hormonal " +
        "contraceptive use don't usually apply at the same time. Could you help me " +
        "understand which one currently applies to you?",
    });
  }

  // Rule 3: excellent sleep quality but frequent racing mind
  if ((responses.sleep_quality ?? 3) >= 4 && (responses.racing_mind ?? 3) >= 4) {
    flags.push({
      hardError: false,
      message:
        "Sleep & Nervous System Calm: rated sleep quality as excellent AND racing mind " +
        "as frequent — mild contradiction. Confidence reduced on this domain only; " +
        "not a hard block.",
      subscriberQuestion:
        "Another interesting combination — you described your sleep quality as excellent, " +
        "but also mentioned your mind racing frequently at bedtime. Can you help me " +
        "understand how those two fit together for you?",
    });
  }

  // Rule 4: impossible demographic combination
  if ((intake.age ?? 99) < 18 && intake.post_menopausal) {
    flags.push({
      hardError: true,
      message:
        "HARD DATA ERROR: age under 18 combined with post-menopausal status is not " +
        "possible. Block assessment completion and prompt the user to re-enter age.",
    });
  }

  return flags;
}
