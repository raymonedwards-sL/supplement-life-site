/**
 * Shared intake-access gating logic — used by app/intake/page.tsx,
 * app/api/intake/chat/route.ts, and app/dashboard/page.tsx (the "Retake
 * your intake" link) so all three surfaces stay in sync rather than each
 * carrying its own copy of this decision.
 *
 * Product rule (confirmed 2026-07-20): a LIFE Assessment ($797) purchase
 * grants intake access — including retakes — for LIFE_ASSESSMENT_RETAKE_
 * WINDOW_DAYS from the purchase date. This deliberately reuses the "first
 * 90 days" framing already established elsewhere in Sage's own copy (the
 * homepage pull-quote: "Sage learns from how your body responds across 90
 * days"), rather than introducing an unrelated new number. Beyond that
 * window, continued intake access requires an active (non-refunded/
 * canceled) Founding Subscription — that ongoing-refinement relationship
 * is the actual thing the $249/mo tier is sold on (see the dashboard's own
 * upsell copy: "the Founding Subscription is the ongoing relationship...
 * Sage refining your formula as your life changes").
 *
 * Extended 2026-07-21 for LIFE Concierge ($1,995): it includes Sage's own
 * guided intake/reformulation (on top of 3 private practitioner sessions
 * fulfilled outside this app), so a Concierge purchase grants the same
 * kind of time-boxed intake access as a LIFE Assessment purchase — just a
 * longer window (LIFE_CONCIERGE_ACCESS_WINDOW_DAYS), reflecting that it's
 * a materially larger, longer-engagement purchase. If someone has both an
 * Assessment and a Concierge purchase on file, whichever window is still
 * open wins — there's no reason to penalize someone for having bought
 * both.
 *
 * A refunded/canceled subscription always hard-blocks access outright,
 * regardless of any LIFE Assessment/Concierge purchase on file — this
 * preserves the pre-existing "a refund revokes portal access" behavior
 * rather than letting a live purchase window become a backdoor around a
 * refund.
 */

export const LIFE_ASSESSMENT_RETAKE_WINDOW_DAYS = 90;
export const LIFE_CONCIERGE_ACCESS_WINDOW_DAYS = 365;

const BLOCKED_SUBSCRIPTION_STATUSES = new Set(["refunded", "canceled"]);

export type IntakeAccessReason =
  | "refunded_or_canceled"
  | "assessment_window_expired"
  | "concierge_window_expired"
  | "no_purchase_on_file";

export type IntakeAccessResult =
  | { allowed: true }
  | { allowed: false; reason: IntakeAccessReason };

function withinWindow(purchasedAt: string | null | undefined, windowDays: number): boolean {
  if (!purchasedAt) return false;
  const purchasedAtMs = new Date(purchasedAt).getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  return Date.now() - purchasedAtMs <= windowMs;
}

export function resolveIntakeAccess({
  subscriptionStatus,
  lifeAssessmentPurchasedAt,
  lifeConciergePurchasedAt,
}: {
  subscriptionStatus: string | null | undefined;
  lifeAssessmentPurchasedAt: string | null | undefined;
  lifeConciergePurchasedAt: string | null | undefined;
}): IntakeAccessResult {
  if (subscriptionStatus && BLOCKED_SUBSCRIPTION_STATUSES.has(subscriptionStatus)) {
    return { allowed: false, reason: "refunded_or_canceled" };
  }

  // Any non-blocked subscriptions row counts as an active Founding
  // Subscription for access purposes. Today that's realistically just
  // "pending" (pre-go-live) — nothing in this codebase writes "active"
  // yet — but this deliberately doesn't hardcode a specific status
  // string, so it keeps working unchanged once a go-live conversion job
  // starts writing "active" rows.
  if (subscriptionStatus) {
    return { allowed: true };
  }

  if (withinWindow(lifeConciergePurchasedAt, LIFE_CONCIERGE_ACCESS_WINDOW_DAYS)) {
    return { allowed: true };
  }

  if (withinWindow(lifeAssessmentPurchasedAt, LIFE_ASSESSMENT_RETAKE_WINDOW_DAYS)) {
    return { allowed: true };
  }

  // Neither window is currently open — report whichever purchase (if any)
  // is the reason, preferring Concierge since it's the more recent/larger
  // purchase when both are present.
  if (lifeConciergePurchasedAt) {
    return { allowed: false, reason: "concierge_window_expired" };
  }
  if (lifeAssessmentPurchasedAt) {
    return { allowed: false, reason: "assessment_window_expired" };
  }

  // Defensive fallback — shouldn't happen in practice, since accounts are
  // only ever created by the Stripe webhook after a real purchase (see
  // components/LoginPrompt.tsx's file comment), so every real account
  // should have at least one of the rows checked above.
  return { allowed: false, reason: "no_purchase_on_file" };
}
