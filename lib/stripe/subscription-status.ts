import type Stripe from "stripe";

/**
 * public.subscriptions.status is a narrower enum than Stripe's own
 * subscription statuses (see supabase/migrations/0001_init.sql) — this
 * maps the two that don't have a direct match:
 * - "incomplete"/"incomplete_expired" (the very first payment on the
 *   subscription never went through) → "pending", since nothing about
 *   this subscription ever actually started, the same state a deposit-only
 *   row is already in.
 * - "paused" (collection intentionally paused, not currently used by any
 *   path in this codebase) → "unpaid", the closest existing status for
 *   "not currently being billed" — an approximation, not a real status
 *   this app produces itself.
 * Every other Stripe status maps 1:1 onto an identically-named enum value.
 *
 * Shared between app/api/webhooks/stripe/route.ts (syncing an existing
 * subscription's status changes) and netlify/functions/convert-pending-
 * subscriptions.mts (the go-live conversion job, mapping the status of a
 * subscription it just created) — both need to stay in sync with Stripe's
 * status set, so this lives in one place rather than two copies that could
 * silently drift.
 */
export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): "pending" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
      return status;
    case "incomplete":
    case "incomplete_expired":
      return "pending";
    case "paused":
      return "unpaid";
  }
}
