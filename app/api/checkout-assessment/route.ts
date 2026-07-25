import { NextRequest, NextResponse } from "next/server";
import { stripe, LIFE_ASSESSMENT_PRICE_CENTS } from "@/lib/stripe/server";

/** The persisted "LIFE Assessment" Stripe Product — referenced (rather
 * than an ad-hoc product_data block) so FAMILY100/FRIENDS50 (and any
 * future Assessment-only promo code) can be scoped via a coupon's
 * applies_to.products and actually have that restriction enforced by
 * Stripe. An ad-hoc product created fresh per session has no stable ID
 * a coupon could ever match. See sage_launch_package_v2, 2026-07-25. */
const LIFE_ASSESSMENT_PRODUCT_ID = "prod_UvaBPzxJpvpWE1";

/**
 * Creates a Stripe Checkout Session for the $797 LIFE Assessment
 * (one-time payment) and returns the hosted checkout URL.
 *
 * Mirrors app/api/checkout/route.ts's Founding Reservation deposit
 * pattern (customer_creation: "always"), but is a genuinely separate,
 * cheaper product: paying this unlocks Sage's guided intake and the
 * subscriber's LIFE Brief. It is NOT a deposit and nothing here is
 * credited toward the $249 Founding Subscription — that remains a
 * distinct upsell offered after the Brief is delivered (see
 * app/dashboard/page.tsx's assessment-only upsell card).
 *
 * Unrestricted geographically (2026-07-25, sage_launch_package_v2): the
 * LIFE Assessment is a digital/service deliverable with no customs,
 * import, or controlled-ingredient exposure, unlike the physical
 * Botanical Kits shipped via the Founding Reservation/Concierge — so
 * unlike app/api/checkout/route.ts, there is no geo self-attestation or
 * middleware.ts country check here. No shipping_address_collection
 * either, for the same "nothing physical ships" reason.
 */
export async function POST(request: NextRequest) {
  const { name, email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
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
            // References the persisted product (see LIFE_ASSESSMENT_PRODUCT_ID
            // above) instead of an inline product_data block — name/
            // description now live on that Stripe product record itself.
            product: LIFE_ASSESSMENT_PRODUCT_ID,
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
