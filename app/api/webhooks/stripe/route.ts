import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, FOUNDING_RESERVATION_DEPOSIT_CENTS } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addBeehiivSubscriber } from "@/lib/beehiiv";
import { getOrCreateUserForCheckout } from "@/lib/supabase/checkout-account";

/**
 * Handles Stripe webhook events.
 *
 * checkout.session.completed — two products, distinguished by
 * session.metadata.type:
 *
 * "founding_reservation_deposit" (the $249 Founding Reservation Deposit):
 *   1. Creates (or reuses) the user's Supabase account and emails them an
 *      invite link to set a password / log in (PRD 5.1).
 *   2. Applies the $249 as a Stripe Customer Balance credit, so it can be
 *      drawn down as their first month's subscription charge at go-live.
 *   3. Records a `subscriptions` row with status "pending" and
 *      conversion_date = GO_LIVE_DATE, which the 14-day notice job reads.
 *
 * "life_assessment_purchase" (the $99 LIFE Assessment, added 2026-07-17):
 *   1. Same account creation/reuse as above — a subscriber can arrive via
 *      either product first.
 *   2. Records a `life_assessment_purchases` row. No customer-balance
 *      credit and no `subscriptions` row — this is a standalone product,
 *      not a deposit toward the Founding Subscription. See
 *      supabase/migrations/0010_life_assessment_purchases.sql.
 *
 * charge.refunded — when a Founding deposit is fully refunded, flips the
 * matching `subscriptions` row to status "refunded". Portal access is then
 * blocked at the application layer (see app/intake/page.tsx,
 * app/dashboard/page.tsx, app/api/intake/chat/route.ts) — their prior
 * intake/profile/track data is intentionally left in place, not deleted.
 * (LIFE Assessment purchases don't currently have a refund-triggered
 * access block — $99 is a much lower-stakes one-time charge than the
 * $249 deposit; add one here if that changes.)
 *
 * Add this route's URL (https://yourdomain.com/api/webhooks/stripe) as an
 * endpoint in Stripe: Developers > Webhooks, subscribed to
 * checkout.session.completed AND charge.refunded. Stripe will give you a
 * signing secret — put that in STRIPE_WEBHOOK_SECRET.
 *
 * TODO (not yet built): the actual "go-live conversion" job — the thing
 * that takes every "pending" subscriptions row and creates a REAL Stripe
 * Subscription, drawing down the balance credit created below — doesn't
 * exist yet. Today, only `lib/email/send-pre-conversion-notice.ts` /
 * `netlify/functions/notify-pre-conversion.mts` exist, and they only send
 * the 14-day warning email; nothing currently converts "pending" to
 * "active" or starts real recurring billing. As of 2026-07-10 the intended
 * pricing for that not-yet-built job is: create the subscription at Stripe's
 * standard $499/month price, with a repeating coupon (duration: "repeating",
 * duration_in_months: 6, amount_off: 25000) applied so Founding Subscribers
 * are actually charged $249/month for the first 6 cycles before it steps up
 * to $499/month automatically. See project memory for full context.
 */
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — rejecting webhook.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature ?? "",
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "charge.refunded") {
    return handleChargeRefunded(event.data.object as Stripe.Charge);
  }

  if (event.type !== "checkout.session.completed") {
    // Not an event we act on yet — acknowledge so Stripe doesn't retry.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.type === "life_assessment_purchase") {
    return handleLifeAssessmentPurchase(session, request);
  }

  if (session.metadata?.type !== "founding_reservation_deposit") {
    return NextResponse.json({ received: true });
  }

  const email = session.customer_details?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!email || !customerId) {
    console.error("Checkout completed without an email or customer id:", session.id);
    return NextResponse.json(
      { error: "Missing email or customer id on session." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();

  try {
    // 1. Create the portal account and email the user an invite link.
    // reservation_id ties back to this Checkout Session; the
    // handle_new_user() trigger copies it onto public.users automatically.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const userId = await getOrCreateUserForCheckout(supabaseAdmin, {
      email,
      reservationId: session.id,
      siteUrl,
      redirectNext: "/intake",
    });

    // 2. Apply what was ACTUALLY PAID as a Stripe Customer Balance credit
    // (negative amount = credit in the customer's favor) — deliberately
    // reads session.amount_total rather than assuming the full
    // FOUNDING_RESERVATION_DEPOSIT_CENTS, so a 100%-off promotion code
    // (e.g. for comped feedback-tester reservations) correctly credits $0
    // instead of a phantom $249 credit for a payment that never happened.
    // Skip the balance transaction entirely when nothing was paid — a $0
    // credit is a no-op Stripe call.
    const amountPaidCents = session.amount_total ?? FOUNDING_RESERVATION_DEPOSIT_CENTS;
    if (amountPaidCents > 0) {
      await stripe.customers.createBalanceTransaction(customerId, {
        amount: -amountPaidCents,
        currency: "usd",
        description:
          "Founding Subscription deposit — credited toward your Protocol Subscription at go-live ($249/mo for 6 months, then $499/mo).",
      });
    }

    // 3. Record the subscription as pending until go-live conversion.
    // conversion_date drives the 14-day pre-conversion notice job.
    const conversionDate = process.env.GO_LIVE_DATE || null;
    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          status: "pending",
          conversion_date: conversionDate,
          // See supabase/migrations/0006_subscription_amount_paid.sql —
          // 0 here means a 100%-off promotion code was used (a comped
          // feedback-tester reservation), distinguishable from a real
          // $249 deposit without cross-referencing Stripe by hand.
          amount_paid_cents: amountPaidCents,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw upsertError;

    // 4. Add the new Founding Subscriber to the beehiiv mailing list for
    // the daily branded educational email. Deliberately NOT awaited into
    // the try/catch above — a beehiiv outage or missing API key must
    // never fail reservation provisioning (account creation, balance
    // credit, subscription row) for a paying customer. addBeehiivSubscriber
    // already fails soft internally and only logs; this just makes sure a
    // slow beehiiv response can't add latency to the webhook response either.
    void addBeehiivSubscriber(email, { stripeCustomerId: customerId });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing failed:", err);
    // Non-2xx so Stripe retries this event.
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

/**
 * Handles the $99 LIFE Assessment product — same account creation/reuse
 * as the Founding deposit, but records a life_assessment_purchases row
 * instead of a subscriptions row (no balance credit, no go-live
 * conversion). See supabase/migrations/0010_life_assessment_purchases.sql.
 */
async function handleLifeAssessmentPurchase(session: Stripe.Checkout.Session, request: NextRequest) {
  const email = session.customer_details?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!email || !customerId) {
    console.error("LIFE Assessment checkout completed without an email or customer id:", session.id);
    return NextResponse.json(
      { error: "Missing email or customer id on session." },
      { status: 400 }
    );
  }

  const supabaseAdmin = createAdminClient();

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const userId = await getOrCreateUserForCheckout(supabaseAdmin, {
      email,
      reservationId: session.id,
      siteUrl,
      redirectNext: "/intake",
    });

    const amountPaidCents = session.amount_total ?? 0;
    const { error: insertError } = await supabaseAdmin.from("life_assessment_purchases").insert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_checkout_session_id: session.id,
      amount_paid_cents: amountPaidCents,
    });
    if (insertError) throw insertError;

    // Same daily-email list as Founding Subscribers — an assessment-only
    // customer is exactly the audience the daily digest is meant to warm
    // up toward the $249/mo upsell.
    void addBeehiivSubscriber(email, { stripeCustomerId: customerId });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("LIFE Assessment webhook processing failed:", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

/**
 * Flags the matching subscription as "refunded" when a charge is fully
 * refunded, which blocks portal access at the application layer (see
 * app/intake/page.tsx, app/dashboard/page.tsx, app/api/intake/chat/route.ts).
 * Ignores partial refunds (charge.refunded is only true once the full
 * amount has been returned) so a partial goodwill refund doesn't lock
 * someone out.
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.refunded) {
    return NextResponse.json({ received: true });
  }

  const customerId =
    typeof charge.customer === "string" ? charge.customer : charge.customer?.id;

  if (!customerId) {
    console.error("charge.refunded event had no customer id:", charge.id);
    return NextResponse.json({ received: true });
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "refunded" })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("Failed to mark subscription refunded:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
