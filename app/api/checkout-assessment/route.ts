import { NextRequest, NextResponse } from "next/server";
import { stripe, LIFE_ASSESSMENT_PRICE_CENTS } from "@/lib/stripe/server";

/**
 * Creates a Stripe Checkout Session for the $89 LIFE Assessment
 * (one-time payment) and returns the hosted checkout URL.
 *
 * Mirrors app/api/checkout/route.ts's Founding Reservation deposit
 * pattern exactly (geo self-attestation, customer_creation: "always"),
 * but is a genuinely separate, cheaper product: paying this unlocks
 * Sage's guided intake and the subscriber's LIFE Brief. It is NOT a
 * deposit and nothing here is credited toward the $249 Founding
 * Subscription — that remains a distinct upsell offered after the
 * Brief is delivered (see app/dashboard/page.tsx's assessment-only
 * upsell card).
 *
 * No shipping_address_collection here — unlike the Founding deposit,
 * nothing physical ships at this stage, so there's no reason to ask.
 */
export async function POST(request: NextRequest) {
  const { name, email, residencyConfirmed } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Same 3-layer US/CA/MX eligibility check as /api/checkout — layer 1
  // is the IP geo-check in middleware.ts, layer 3 is Stripe's own
  // country restriction isn't applicable here (no shipping collected),
  // so this self-attestation is the meaningful backstop.
  if (residencyConfirmed !== true) {
    return NextResponse.json(
      {
        error:
          "You must confirm you are located in the United States, Canada, or Mexico to take the LIFE Assessment.",
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
            unit_amount: LIFE_ASSESSMENT_PRICE_CENTS,
            product_data: {
              name: "LIFE Assessment",
              description:
                "A guided conversation with Sage, Your LIFE Guide, that becomes your personalized LIFE Brief — your Botanical Track, the reasoning behind every ingredient, and what your first 90 days is designed to do. One-time charge, separate from the $249/month Founding Subscription (offered afterward).",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "life_assessment_purchase",
        name: name ?? "",
      },
      success_url: `${origin}/assessment?checkout=success`,
      cancel_url: `${origin}/assessment?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe LIFE Assessment checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
