/**
 * P1-4 / P2-1 Safety Gate.
 * Port of safety_gate() in sage_scoring_engine.py, keyed to lib/tracks.ts
 * ids instead of display names. One deliberate improvement over the
 * Python reference: the allergy check reads ingredient lists straight
 * from lib/tracks.ts (the codebase's actual single source of truth, kept
 * in sync with the Co-Packer Formulation Packet — see the header comment
 * there) instead of a second hardcoded ingredient map, so this can never
 * silently drift from the real product catalog the way two parallel
 * lists eventually would.
 */
import { TRACKS } from "@/lib/tracks";

export type SafetyGateIntake = {
  age?: number;
  sex?: "male" | "female" | "other" | "prefer_not_to_say";
  pregnant?: boolean;
  nursing?: boolean;
  hormonal_contraceptive?: boolean;
  fertility_treatment?: boolean;
  iodine_sensitive?: boolean;
  choking_risk?: boolean;
  allergies?: string[];
  auddisorder_context_flagged?: boolean;
  requesting_hemp_variant?: boolean;
};

export type SafetyGateResult = {
  eligible: boolean;
  reasons: string[];
};

const IODINE_SENSITIVE_TRACKS = ["vitality", "daily-restore", "womens-rhythm", "mens-rhythm"];
const CHOKING_RISK_TRACKS = ["daily-restore", "reset"];

function ingredientMatchesAllergy(ingredient: string, allergy: string): boolean {
  const ing = ingredient.toLowerCase().trim();
  const alg = allergy.toLowerCase().trim();
  if (!alg || !ing) return false;
  return ing.includes(alg) || alg.includes(ing);
}

/** Returns a result per lib/tracks.ts track id. */
export function safetyGate(intake: SafetyGateIntake): Record<string, SafetyGateResult> {
  const reasons: Record<string, string[]> = {};
  const eligible: Record<string, boolean> = {};
  for (const t of TRACKS) {
    reasons[t.id] = [];
    eligible[t.id] = true;
  }

  const exclude = (trackId: string, reason: string) => {
    eligible[trackId] = false;
    reasons[trackId].push(reason);
  };

  if ((intake.age ?? 99) < 18) {
    for (const t of TRACKS) exclude(t.id, "Under 18 — hard exclude, no protocol generated.");
    return toResult(eligible, reasons);
  }

  // Sex-inapplicable tracks are hard-excluded, not just left at a neutral
  // Track-Fit baseline — otherwise a track built for the opposite sex can
  // still tie into a recommendation slot when its own domain was never
  // asked about (domain "not shown for this sex" and domain "shown but
  // unanswered" would otherwise both fall back to the same neutral 50
  // Opportunity Score in engine.ts). Only fires when sex is disclosed AND
  // is definitively the opposite one — "other"/"prefer_not_to_say"/
  // undisclosed leaves both tracks eligible rather than guessing.
  if (intake.sex === "male") {
    exclude("womens-rhythm", "Subscriber identified as male — Women's Hormonal Rhythm track is not applicable.");
  }
  if (intake.sex === "female") {
    exclude("mens-rhythm", "Subscriber identified as female — Men's Vitality & Rhythm track is not applicable.");
  }

  if (intake.pregnant || intake.nursing) {
    exclude("reset", "Pregnancy/nursing — Cascara Sagrada hard-excluded.");
    reasons["womens-rhythm"].push(
      "Pregnancy/nursing — Raspberry Leaf flagged pending brand positioning decision; route to professional-guidance messaging."
    );
  }

  if (intake.hormonal_contraceptive || intake.fertility_treatment) {
    reasons["womens-rhythm"].push(
      "Hormonal contraceptive/fertility treatment disclosed — Vitex flagged, display practitioner-consult caution rather than excluding."
    );
  }

  if (intake.iodine_sensitive) {
    for (const trackId of IODINE_SENSITIVE_TRACKS) {
      reasons[trackId].push(
        "Iodine-sensitive condition disclosed — Sea Moss/Spirulina combination flagged for review before recommending."
      );
    }
  }

  if (intake.choking_risk) {
    for (const trackId of CHOKING_RISK_TRACKS) {
      reasons[trackId].push(
        "Choking-risk disclosed — Glucomannan-containing format excluded unless hydration instruction acknowledged."
      );
    }
  }

  const allergies = intake.allergies ?? [];
  if (allergies.length > 0) {
    for (const t of TRACKS) {
      const hits = t.ingredients.filter((ing) => allergies.some((a) => ingredientMatchesAllergy(ing, a)));
      if (hits.length > 0) {
        exclude(t.id, `Known allergy to ${hits.join(", ")} — hard exclude.`);
      }
    }
  }

  if (intake.auddisorder_context_flagged) {
    exclude(
      "morning-clarity",
      "Sage detected AUD/SUD-adjacent context — never present Kudzu as treatment; route to healthcare-provider messaging instead of a recommendation."
    );
  }

  // Hemp/PM Calm: current formulation (per Product Map v8) does not contain
  // hemp, so no block needed under normal operation. Kept here for when/if
  // brand reintroduces it.
  if (intake.requesting_hemp_variant) {
    exclude(
      "pm-calm",
      "Hemp-containing PM Calm variant requested — blocked pending brand's document reconciliation (Product Map v8 vs Co-Packer Packet v5) and, if reintroduced, hemp seed/oil only (not CBD)."
    );
  }

  return toResult(eligible, reasons);
}

function toResult(
  eligible: Record<string, boolean>,
  reasons: Record<string, string[]>
): Record<string, SafetyGateResult> {
  const out: Record<string, SafetyGateResult> = {};
  for (const trackId of Object.keys(eligible)) {
    out[trackId] = { eligible: eligible[trackId], reasons: reasons[trackId] };
  }
  return out;
}
