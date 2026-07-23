/**
 * Parity check: reproduces the exact contradiction test cases and worked
 * example from sage_scoring_engine.py's __main__ block / documented in
 * SAGE_LIFE_Phase2_Assessment_Scoring.docx (P2-6), against the TS port in
 * lib/scoring/. Confirms the port matches the reference engine's actual
 * documented output before it's trusted as the live decision layer.
 *
 * Usage: npx tsx scripts/sage-scoring-verify.ts
 */
import { normalizeItem } from "../lib/scoring/normalize";
import { domainOpportunityScore } from "../lib/scoring/opportunity";
import { trackFitScore } from "../lib/scoring/track-fit";
import { confidenceScore } from "../lib/scoring/confidence";
import { checkContradictions } from "../lib/scoring/contradictions";
import { safetyGate } from "../lib/scoring/safety-gate";
import { runAssessmentEngine } from "../lib/scoring/engine";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "PASS" : "FAIL"} — ${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
  if (!pass) failures++;
}

console.log("=".repeat(78));
console.log("Contradiction test cases — expected results from the docx (P2-6 table)");
console.log("=".repeat(78));

// Test 1 — Energy vs. Vitality: 1 flag, confidence 90/100
{
  const responses = { afternoon_energy: 1, exertion_recovery: 5, sleep_quality: 3, racing_mind: 2 };
  const flags = checkContradictions(responses, { age: 42 });
  const itemScores = Object.values(responses).map((v) => normalizeItem(v));
  const conf = confidenceScore(itemScores, 4, 4, flags.length);
  check("Test 1 flag count", flags.length, 1);
  check("Test 1 confidence", conf, 90);
}

// Test 2 — Pregnancy + contraceptive: 1 flag, confidence 75/100
{
  const responses = { afternoon_energy: 3, exertion_recovery: 3, sleep_quality: 3, racing_mind: 3 };
  const intake = { age: 34, pregnant: true, hormonal_contraceptive: true };
  const flags = checkContradictions(responses, intake);
  const itemScores = Object.values(responses).map((v) => normalizeItem(v));
  const conf = confidenceScore(itemScores, 4, 4, flags.length);
  check("Test 2 flag count", flags.length, 1);
  check("Test 2 confidence", conf, 75);
}

// Test 3 — Sleep quality vs. racing mind: 1 flag, confidence 90/100
{
  const responses = { afternoon_energy: 3, exertion_recovery: 3, sleep_quality: 5, racing_mind: 4 };
  const flags = checkContradictions(responses, { age: 38 });
  const itemScores = Object.values(responses).map((v) => normalizeItem(v));
  const conf = confidenceScore(itemScores, 4, 4, flags.length);
  check("Test 3 flag count", flags.length, 1);
  check("Test 3 confidence", conf, 90);
}

// Test 4 — Impossible demographic combination: 1 hard-error flag, confidence 75/100
{
  const responses = { afternoon_energy: 3, exertion_recovery: 3, sleep_quality: 3, racing_mind: 3 };
  const intake = { age: 16, post_menopausal: true };
  const flags = checkContradictions(responses, intake);
  const itemScores = Object.values(responses).map((v) => normalizeItem(v));
  const conf = confidenceScore(itemScores, 4, 4, flags.length);
  check("Test 4 flag count", flags.length, 1);
  check("Test 4 is hard error", flags[0]?.hardError, true);
  check("Test 4 confidence", conf, 75);
}

// Control — no contradiction: 0 flags, confidence 100/100
{
  const responses = { afternoon_energy: 2, exertion_recovery: 2, sleep_quality: 3, racing_mind: 3 };
  const flags = checkContradictions(responses, { age: 45 });
  const itemScores = Object.values(responses).map((v) => normalizeItem(v));
  const conf = confidenceScore(itemScores, 4, 4, flags.length);
  check("Control flag count", flags.length, 0);
  check("Control confidence", conf, 100);
}

console.log("\n" + "=".repeat(78));
console.log("Worked example — Cellular Energy & Recovery domain + Daily Restore Track-Fit");
console.log("=".repeat(78));
{
  const gate = safetyGate({ age: 41, pregnant: false, iodine_sensitive: false, choking_risk: false, allergies: [], hormonal_contraceptive: false });
  const flaggedTracks = Object.entries(gate).filter(([, r]) => r.reasons.length > 0);
  console.log("Safety Gate results (tracks with any flag shown):");
  for (const [trackId, r] of flaggedTracks) console.log(`  ${trackId}: eligible=${r.eligible} — ${JSON.stringify(r.reasons)}`);

  const itemScores = [normalizeItem(2), normalizeItem(2), normalizeItem(3, 5, false)];
  const opp = domainOpportunityScore(itemScores, 4);
  check("Cellular Energy & Recovery Opportunity Score", opp, 37.3);

  const fit = trackFitScore({
    goalAlignment: 0.8,
    domainOpportunityPct: opp,
    lifestyleCompatibility: 0.7,
    likelyAdherence: 0.6,
    formatPreference: 0.9,
  });
  console.log(`Daily Restore — Track-Fit Score: ${fit}/100`);
  // Python reference doesn't print this fit score's precise expected value
  // in the docx, so this line is informational (sanity range check only).
  check("Daily Restore Track-Fit Score is in a sane 0-100 range", fit >= 0 && fit <= 100, true);
}

console.log("\n" + "=".repeat(78));
console.log("Orchestrator (lib/scoring/engine.ts) — end-to-end synthetic conversations");
console.log("=".repeat(78));

// Scenario A: sleep-and-stress-led subscriber, no safety issues — should
// rank PM Calm-adjacent domains highest and produce 2-3 eligible tracks.
{
  const answers = [
    { field: "age", value: 34 },
    { field: "sex", value: "female" },
    { field: "sleep_onset", value: 5 },
    { field: "racing_mind", value: 4 },
    { field: "sleep_quality", value: 2 },
    { field: "sleep_interference", value: 4 },
    { field: "afternoon_energy", value: 2 },
    { field: "recovery_days", value: 2 },
    { field: "energy_interference", value: 3 },
    { field: "primary_goal", value: "better_sleep" },
    { field: "format_preference", value: ["capsules"] },
    { field: "routine_consistency", value: "very_consistent" },
    { field: "lifestyle_constraints", value: "Normal 9-5, no travel." },
  ];
  const result = runAssessmentEngine(answers, []);
  console.log(`Scenario A recommended tracks: ${JSON.stringify(result.recommendedTrackIds)}`);
  check("Scenario A: not hard-blocked", result.hardBlock, false);
  check("Scenario A: primary track is pm-calm", result.recommendedTrackIds[0], "pm-calm");
  check("Scenario A: produced at least 2 tracks", result.recommendedTrackIds.length >= 2, true);
}

// Scenario B: pregnancy disclosed + requests digestive help — Reset must
// be hard-excluded by the Safety Gate and therefore never recommended.
{
  const answers = [
    { field: "age", value: 29 },
    { field: "sex", value: "female" },
    { field: "digestive_frequency", value: 5 },
    { field: "digestive_interference", value: 4 },
    { field: "primary_goal", value: "digestive_comfort" },
  ];
  const result = runAssessmentEngine(answers, [{ flag_type: "pregnancy_nursing", value: "Pregnant, 4 months" }]);
  console.log(`Scenario B recommended tracks: ${JSON.stringify(result.recommendedTrackIds)}`);
  check("Scenario B: reset excluded from recommendations", result.recommendedTrackIds.includes("reset"), false);
  check("Scenario B: reset marked ineligible", result.tracks.find((t) => t.trackId === "reset")?.eligible, false);
}

// Scenario C: allergy to a Callaloo-adjacent track ingredient — every
// track containing that ingredient should be excluded.
{
  const answers = [
    { field: "age", value: 50 },
    { field: "sex", value: "male" },
    { field: "brain_fog_frequency", value: 4 },
    { field: "memory_trend", value: 2 },
    { field: "primary_goal", value: "mental_clarity" },
  ];
  const result = runAssessmentEngine(answers, [{ flag_type: "allergy", value: "callaloo" }]);
  const stillEligible = result.tracks.filter((t) => t.eligible).map((t) => t.trackId);
  console.log(`Scenario C still-eligible tracks: ${JSON.stringify(stillEligible)}`);
  check("Scenario C: cognitive-focus excluded (contains Callaloo)", stillEligible.includes("cognitive-focus"), false);
  check("Scenario C: pm-calm still eligible (no Callaloo)", stillEligible.includes("pm-calm"), true);
}

// Scenario D: under 18 — hard exclude from every track, no recommendations.
{
  const answers = [{ field: "age", value: 15 }];
  const result = runAssessmentEngine(answers, []);
  console.log(`Scenario D recommended tracks: ${JSON.stringify(result.recommendedTrackIds)}`);
  check("Scenario D: no tracks recommended", result.recommendedTrackIds.length, 0);
  check("Scenario D: every track ineligible", result.tracks.every((t) => !t.eligible), true);
}

console.log("\n" + "=".repeat(78));
if (failures > 0) {
  console.error(`${failures} check(s) FAILED — TS port does not match the reference engine's documented output.`);
  process.exit(1);
} else {
  console.log("All checks PASSED — TS port matches sage_scoring_engine.py's documented output.");
}
