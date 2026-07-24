import type { Config } from "@netlify/functions";
import { stripe } from "../../lib/stripe/server";
import { createAdminClient } from "../../lib/supabase/admin";
import { mapStripeSubscriptionStatus } from "../../lib/stripe/subscription-status";

/**
 * The go-live conversion job (stripe-go-live-runbook.md, 2026-07-24 audit
 * — Blocker 3). Until this existed, nothing in this codebase ever created
 * a real Stripe Subscription: every Founding Reservation deposit sat at
 * `subscriptions.status = 'pending'` forever, with only the 14-day notice
 * job (notify-pre-conversion.mts) acting on it. This is what actually
 * converts a deposit into a real, recurring $499/mo subscription — at
 * Stripe's standard price, with a 6-month $250-off coupon so the
 * subscriber is actually charged $249/mo for their first 6 cycles before
 * it steps up automatically (see STRIPE_FOUNDING_SUBSCRIPTION_PRICE_ID /
 * STRIPE_FOUNDING_SUBSCRIPTION_COUPON_ID, created directly in the Stripe
 * Dashboard alongside this job — see Product catalog > Founding Legacy
 * Membership (Recurring) and Coupons > Founding Subscriber 6-month rate).
 *
 * Drawing down the Customer Balance credit from deposit time (applied in
 * app/api/webhooks/stripe/route.ts via stripe.customers.createBalanceTransaction)
 * needs no extra logic here — Stripe automatically applies any available
 * balance credit against a customer's next invoice once a real
 * subscription starts billing them.
 *
 * Comped $0-deposit rows (a 100%-off promo code reservation) are
 * deliberately never auto-converted into a real paying subscription —
 * charging a comped tester $499/mo without a human decision would be a
 * real mistake, not a safe default.
 *
 * Runs daily, same schedule as notify-pre-conversion.mts. Idempotent by
 * design: a subscription that already exists for a customer (created by
 * an earlier run, or by any other path) is detected and skipped rather
 * than duplicated, and a row's status naturally falls out of the
 * "pending" query the moment this job (or the customer.subscription.created
 * webhook it also triggers) updates it.
 */
export default async () => {
  const goLiveDate = process.env.GO_LIVE_DATE;
  if (!goLiveDate) {
    console.warn("GO_LIVE_DATE is not set — nothing to convert yet.");
    return new Response("GO_LIVE_DATE not set", { status: 200 });
  }

  if (Date.now() < new Date(goLiveDate).getTime()) {
    return new Response("Go-live date hasn't arrived yet.", { status: 200 });
  }

  const priceId = process.env.STRIPE_FOUNDING_SUBSCRIPTION_PRICE_ID;
  const couponId = process.env.STRIPE_FOUNDING_SUBSCRIPTION_COUPON_ID;
  if (!priceId || !couponId) {
    console.error(
      "STRIPE_FOUNDING_SUBSCRIPTION_PRICE_ID / STRIPE_FOUNDING_SUBSCRIPTION_COUPON_ID not set — cannot convert."
    );
    return new Response("Missing Stripe price/coupon configuration.", { status: 500 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: pendingSubs, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, stripe_customer_id, conversion_date, amount_paid_cents")
    .eq("status", "pending")
    .gt("amount_paid_cents", 0)
    .lte("conversion_date", new Date().toISOString());

  if (error) {
    console.error("Failed to load pending subscriptions:", error);
    return new Response("Failed to load subscriptions", { status: 500 });
  }

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of pendingSubs ?? []) {
    if (!sub.stripe_customer_id) {
      console.error(`Subscription row ${sub.id} has no stripe_customer_id — skipping.`);
      failed++;
      continue;
    }

    try {
      // Defensive idempotency check: if this customer already has a real
      // subscription (from an earlier run, or any other path), don't
      // create a second one.
      const existing = await stripe.subscriptions.list({
        customer: sub.stripe_customer_id,
        status: "all",
        limit: 10,
      });
      const alreadyConverted = existing.data.some((s) => s.status !== "canceled");
      if (alreadyConverted) {
        console.warn(`Customer ${sub.stripe_customer_id} already has a subscription — skipping.`);
        skipped++;
        continue;
      }

      const subscription = await stripe.subscriptions.create({
        customer: sub.stripe_customer_id,
        items: [{ price: priceId }],
        discounts: [{ coupon: couponId }],
      });

      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: mapStripeSubscriptionStatus(subscription.status),
          stripe_subscription_id: subscription.id,
        })
        .eq("id", sub.id);

      if (updateError) {
        // The real Stripe subscription now exists even though this write
        // failed — log loudly rather than silently losing track of it.
        // The customer.subscription.created webhook will still land and
        // retry this same update independently.
        console.error(
          `Created subscription ${subscription.id} for row ${sub.id} but failed to update the row:`,
          updateError
        );
      }

      converted++;
    } catch (err) {
      console.error(`Failed to convert subscription row ${sub.id}:`, err);
      failed++;
      // Leave status as 'pending' — retried on tomorrow's run.
    }
  }

  return new Response(
    `Converted ${converted}, skipped ${skipped} (already converted), failed ${failed}.`,
    { status: 200 }
  );
};

export const config: Config = {
  schedule: "@daily",
};
