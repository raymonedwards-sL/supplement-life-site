import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, FOUNDING_RESERVATION_DEPOSIT_CENTS } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addBeehiivSubscriber, extractFirstName } from "@/lib/beehiiv";
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
 * "life_assessment_purchase" (the $797 LIFE Assessment, added 2026-07-17):
 *   1. Same account creation/reuse as above — a subscriber can arrive via
 *      either product first.
 *   2. Records a `life_assessment_purchases` row. No customer-balance
 *      credit and no `subscriptions` row — this is a standalone product,
 *      not a deposit toward the Founding Subscription. See
 *      supabase/migrations/0010_life_assessment_purchases.sql.
 *
 * "life_concierge_purchase" (the $1,995 LIFE Concierge, added 2026-07-21):
 *   1. Same account creation/reuse as above.
 *   2. Records a `life_concierge_purchases` row. No customer-balance
 *      credit and no `subscriptions` row — 3 practitioner sessions plus
 *      Sage's intake/reformulation, but NOT any Botanical Track kits
 *      (those only ship via the Founding Subscription). See
 *      supabase/migrations/0013_life_concierge_purchases.sql.
 *
 * charge.refunded — when a Founding deposit is fully refunded, flips the
 * matching `subscriptions` row to status "refunded". Portal access is then
 * blocked at the application layer (see app/intake/page.tsx,
 * app/dashboard/page.tsx, app/api/intake/chat/route.ts) — their prior
 * intake/profile/track data is intentionally left in place, not deleted.
 * (LIFE Assessment purchases don't currently have a refund-triggered
 * access block. 2026-07-21: repriced from $99 to $797 — now a HIGHER
 * one-time charge than the $249 Founding deposit, so the original "lower
 * stakes, skip the block" reasoning no longer holds. Worth adding a
 * refund-triggered access block here before this price change ships.)
 *
 * customer.subscription.created / .updated / .deleted (added 2026-07-24 —
 * stripe-go-live-runbook.md Blocker 2: the live endpoint previously
 * listened to only two event types, so a renewal failure or any other
 * subscription-state change never reached this app at all) — sync
 * Stripe's own subscription.status onto the matching `subscriptions` row
 * (matched by stripe_customer_id, same lookup charge.refunded already
 * uses) plus stripe_subscription_id, so portal-access checks elsewhere in
 * the app are reading real, current state. See mapStripeSubscriptionStatus
 * below for the status mapping and stripe_subscription_id's own doc
 * comment (supabase/migrations/0020_subscriptions_stripe_subscription_id.sql)
 * for why matching by customer id alone stopped being precise enough.
 *
 * invoice.paid / invoice.payment_failed / invoice.payment_action_required
 * (added 2026-07-24, same audit) — acknowledged and logged, not written to
 * the database: Stripe's own customer.subscription.updated event already
 * reflects a failed/recovered payment via subscription.status (e.g.
 * "past_due"), so these three are handled here purely so a renewal
 * failure is no longer silently dropped (every event type outside the
 * two originally-subscribed ones used to return `{received:true}`
 * immediately without recording anything) — not as a second, potentially
 * racing source of truth for status. A dunning email/notification off
 * these events is a real gap worth building later, but is a separate,
 * larger decision than "stop silently ignoring the event."
 *
 * Add this route's URL (https://yourdomain.com/api/webhooks/stripe) as an
 * endpoint in Stripe: Developers > Webhooks, subscribed to
 * checkout.session.completed, charge.refunded, customer.subscription.created,
 * customer.subscription.updated, customer.subscription.deleted,
 * invoice.paid, invoice.payment_failed, and invoice.payment_action_required.
 * Stripe will give you a signing secret — put that in STRIPE_WEBHOOK_SECRET.
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
 * to $499/month automatically. See project memory for full context. The
 * subscription- and invoice-event handlers below are ready for when that
 * job (or any other path that creates a real Stripe Subscription) starts
 * existing — they don't depend on it, but they're inert until it does,
 * since no code anywhere creates a Stripe Subscription yet.
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

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    return handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
  }

  if (event.type === "customer.subscription.deleted") {
    return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
  }

  if (
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed" ||
    event.type === "invoice.payment_action_required"
  ) {
    return handleInvoiceEvent(event.type, event.data.object as Stripe.Invoice);
  }

  if (event.type !== "checkout.session.completed") {
    // Not an event we act on yet — acknowledge so Stripe doesn't retry.
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.type === "life_assessment_purchase") {
    return handleLifeAssessmentPurchase(session, request);
  }

  if (session.metadata?.type === "life_concierge_purchase") {
    return handleLifeConciergePurchase(session, request);
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
    // the daily branded educational email, enrolled into the Founding
    // Subscriber Welcome Sequence automation (Add by API trigger, built
    // 2026-07-22) and tagged with their first name (from the Reserve
    // form's session.metadata.name) so the sequence's emails can greet them
    // by name instead of "Hi there,". Requires a "First Name" custom field
    // to already exist on the beehiiv publication (Settings > Custom
    // Fields) — see extractFirstName's doc comment in lib/beehiiv.ts.
    // Deliberately NOT awaited into the try/catch above — a beehiiv outage
    // or missing API key must never fail reservation provisioning (account
    // creation, balance credit, subscription row) for a paying customer.
    // addBeehiivSubscriber already fails soft internally and only logs;
    // this just makes sure a slow beehiiv response can't add latency to
    // the webhook response either.
    const firstName = extractFirstName(session.metadata?.name);
    void addBeehiivSubscriber(email, {
      stripeCustomerId: customerId,
      ...(firstName ? { customFields: [{ name: "First Name", value: firstName }] } : {}),
      ...(process.env.BEEHIIV_FOUNDING_WELCOME_AUTOMATION_ID
        ? { automationIds: [process.env.BEEHIIV_FOUNDING_WELCOME_AUTOMATION_ID] }
        : {}),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing failed:", err);
    // Non-2xx so Stripe retries this event.
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

/**
 * Handles the $797 LIFE Assessment product — same account creation/reuse
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
    // up toward the $249/mo upsell. No automationIds here — the Founding
    // Subscriber Welcome Sequence is reserved for actual Founding deposits.
    const firstName = extractFirstName(session.metadata?.name);
    void addBeehiivSubscriber(email, {
      stripeCustomerId: customerId,
      ...(firstName ? { customFields: [{ name: "First Name", value: firstName }] } : {}),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("LIFE Assessment webhook processing failed:", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

/**
 * Handles the $1,995 LIFE Concierge product — same account creation/reuse
 * as the other two products, but records a life_concierge_purchases row
 * instead (no balance credit, no subscriptions row, no Botanical Track
 * kits). See supabase/migrations/0013_life_concierge_purchases.sql.
 */
async function handleLifeConciergePurchase(session: Stripe.Checkout.Session, request: NextRequest) {
  const email = session.customer_details?.email ?? session.customer_email;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!email || !customerId) {
    console.error("LIFE Concierge checkout completed without an email or customer id:", session.id);
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
    const { error: insertError } = await supabaseAdmin.from("life_concierge_purchases").insert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_checkout_session_id: session.id,
      amount_paid_cents: amountPaidCents,
    });
    if (insertError) throw insertError;

    // Same daily-email list as the other two products.
    const firstName = extractFirstName(session.metadata?.name);
    void addBeehiivSubscriber(email, {
      stripeCustomerId: customerId,
      ...(firstName ? { customFields: [{ name: "First Name", value: firstName }] } : {}),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("LIFE Concierge webhook processing failed:", err);
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
 */
function mapStripeSubscriptionStatus(
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

/**
 * customer.subscription.created / .updated — syncs Stripe's own status
 * onto the matching subscriptions row. Matches by stripe_customer_id
 * (same lookup handleChargeRefunded already uses) since every real
 * subscription in this product model is created for a customer who
 * already has a row from their original deposit checkout — there is no
 * scenario yet where this event should create a NEW row (that's the
 * not-yet-built go-live conversion job's job, not the webhook's).
 */
async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mapStripeSubscriptionStatus(subscription.status),
      stripe_subscription_id: subscription.id,
    })
    .eq("stripe_customer_id", customerId)
    .select("id");

  if (error) {
    console.error("Failed to sync subscription status:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // No existing row for this customer — shouldn't happen in the current
    // product model (every subscription customer started with a deposit
    // checkout), but log it rather than silently dropping the event so a
    // real mismatch is visible instead of invisible.
    console.warn(
      `customer.subscription.created/updated: no subscriptions row found for stripe_customer_id ${customerId}`
    );
  }

  return NextResponse.json({ received: true });
}

/** customer.subscription.deleted — explicitly "canceled", regardless of
 * whatever status the subscription object reports at deletion time. */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", stripe_subscription_id: subscription.id })
    .eq("stripe_customer_id", customerId)
    .select("id");

  if (error) {
    console.error("Failed to mark subscription canceled:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    console.warn(`customer.subscription.deleted: no subscriptions row found for stripe_customer_id ${customerId}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * invoice.paid / invoice.payment_failed / invoice.payment_action_required
 * — see the file-level doc comment above for why these are logged rather
 * than written to the database (customer.subscription.updated already
 * carries the resulting status change). Acknowledging them here is what
 * stops Stripe from seeing a non-2xx and retrying an event this app was
 * never going to act on differently.
 */
async function handleInvoiceEvent(
  eventType: "invoice.paid" | "invoice.payment_failed" | "invoice.payment_action_required",
  invoice: Stripe.Invoice
) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? "unknown";

  if (eventType === "invoice.payment_failed" || eventType === "invoice.payment_action_required") {
    console.warn(
      `${eventType}: customer ${customerId}, invoice ${invoice.id}, amount_due ${invoice.amount_due}`
    );
  } else {
    console.log(`invoice.paid: customer ${customerId}, invoice ${invoice.id}, amount_paid ${invoice.amount_paid}`);
  }

  return NextResponse.json({ received: true });
}
