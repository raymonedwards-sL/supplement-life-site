import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, FOUNDING_RESERVATION_DEPOSIT_CENTS } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Handles Stripe webhook events.
 *
 * checkout.session.completed — on the $249 Founding Reservation Deposit:
 *   1. Creates (or reuses) the user's Supabase account and emails them an
 *      invite link to set a password / log in (PRD 5.1).
 *   2. Applies the $249 as a Stripe Customer Balance credit, so it can be
 *      drawn down as their first month's subscription charge at go-live.
 *   3. Records a `subscriptions` row with status "pending" and
 *      conversion_date = GO_LIVE_DATE, which the 14-day notice job reads.
 *
 * charge.refunded — when a deposit is fully refunded, flips the matching
 * `subscriptions` row to status "refunded". Portal access is then blocked
 * at the application layer (see app/intake/page.tsx, app/dashboard/page.tsx,
 * app/api/intake/chat/route.ts) — their prior intake/profile/track data is
 * intentionally left in place, not deleted.
 *
 * Add this route's URL (https://yourdomain.com/api/webhooks/stripe) as an
 * endpoint in Stripe: Developers > Webhooks, subscribed to
 * checkout.session.completed AND charge.refunded. Stripe will give you a
 * signing secret — put that in STRIPE_WEBHOOK_SECRET.
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
    let userId: string;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const { data: invited, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { reservation_id: session.id },
        redirectTo: `${siteUrl}/auth/callback?next=/intake`,
      });

    if (inviteError) {
      const alreadyExists = /already been registered|already exists/i.test(
        inviteError.message
      );
      if (!alreadyExists) throw inviteError;

      // User already has an account (e.g. reserved a second track) —
      // look up their existing id instead of failing the webhook.
      const { data: existing, error: lookupError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (lookupError || !existing) {
        throw lookupError ?? new Error(`No existing user found for ${email}`);
      }
      userId = existing.id;
    } else {
      userId = invited.user.id;
    }

    // 2. Apply the $249 deposit as a Stripe Customer Balance credit
    // (negative amount = credit in the customer's favor).
    await stripe.customers.createBalanceTransaction(customerId, {
      amount: -FOUNDING_RESERVATION_DEPOSIT_CENTS,
      currency: "usd",
      description:
        "Founding Subscription deposit — credited toward first Protocol Subscription charge at go-live.",
    });

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
        },
        { onConflict: "user_id" }
      );

    if (upsertError) throw upsertError;

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing failed:", err);
    // Non-2xx so Stripe retries this event.
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
