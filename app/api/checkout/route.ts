import { NextRequest, NextResponse } from "next/server";
import { stripe, FOUNDING_RESERVATION_DEPOSIT_CENTS } from "@/lib/stripe/server";

/**
 * Creates a Stripe Checkout Session for the $249 Founding Reservation
 * Deposit (one-time payment) and returns the hosted checkout URL.
 *
 * customer_creation: "always" ensures a Stripe Customer object exists
 * even for a one-off payment, since the webhook needs a customer id to
 * apply the $249 credit to Customer Balance.
 */
export async function POST(request: NextRequest) {
  const { name, email, residencyConfirmed } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Layer 2 of the US/CA/MX eligibility check (layer 1 is the IP geo-check
  // in middleware.ts, layer 3 is Stripe's shipping_address_collection
  // allowed_countries below). See lib/geo/allowed-countries.ts for details.
  if (residencyConfirmed !== true) {
    return NextResponse.json(
      {
        error:
          "You must confirm you are located in the United States, Canada, or Mexico to reserve.",
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
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "MX"],
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: FOUNDING_RESERVATION_DEPOSIT_CENTS,
            product_data: {
              name: "Founding Subscription Deposit",
              description:
                "Supplement :: LIFE Founding Subscription — a $249 deposit that reserves first access to your Personalized LIFE Protocol. Credited toward your Protocol Subscription at go-live: $249/month for your first six months, then $499/month standard rate.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "founding_reservation_deposit",
        name: name ?? "",
      },
      success_url: `${origin}/reserve?checkout=success`,
      cancel_url: `${origin}/reserve?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
