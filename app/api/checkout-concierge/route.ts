import { NextRequest, NextResponse } from "next/server";
import {
  stripe,
  LIFE_CONCIERGE_PRICE_CENTS,
  LIFE_CONCIERGE_PRACTITIONER_SESSIONS,
} from "@/lib/stripe/server";

/**
 * Creates a Stripe Checkout Session for the $1,995 LIFE Concierge
 * enrollment (one-time payment) and returns the hosted checkout URL.
 *
 * Mirrors app/api/checkout-assessment/route.ts's pattern exactly (geo
 * self-attestation, customer_creation: "always"), but is a genuinely
 * separate, premium add-on: 3 private 30-minute sessions with a
 * dedicated wellness practitioner, plus Sage's own guided intake and
 * ongoing reformulation. It does NOT include any Botanical Track kits —
 * product only ships as part of the ongoing $249/mo Founding
 * Subscription, so this description is deliberately explicit that
 * kits aren't included here, to avoid any checkout-page ambiguity about
 * what's actually being purchased.
 *
 * No shipping_address_collection here — nothing physical ships from
 * this checkout.
 */
export async function POST(request: NextRequest) {
  const { name, email, residencyConfirmed } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Same 3-layer US/CA/MX eligibility check as the other checkout routes —
  // layer 1 is the IP geo-check in middleware.ts, layer 3 (Stripe country
  // restriction) isn't applicable here (no shipping collected), so this
  // self-attestation is the meaningful backstop.
  if (residencyConfirmed !== true) {
    return NextResponse.json(
      {
        error:
          "You must confirm you are located in the United States, Canada, or Mexico to enroll in LIFE Concierge.",
      },
      { status: 400 }
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: LIFE_CONCIERGE_PRICE_CENTS,
            product_data: {
              name: "LIFE Concierge",
              description: `${LIFE_CONCIERGE_PRACTITIONER_SESSIONS} private 30-minute sessions with a dedicated wellness practitioner, plus Sage's own guided intake and ongoing reformulation. One-time enrollment — does not include Botanical Track kits, which ship as part of the ongoing $249/month Founding Subscription (reserved separately).`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "life_concierge_purchase",
        name: name ?? "",
      },
      success_url: `${origin}/concierge?checkout=success`,
      cancel_url: `${origin}/concierge?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe LIFE Concierge checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
