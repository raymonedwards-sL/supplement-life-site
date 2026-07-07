import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates a Stripe billing portal session for the logged-in user and
 * returns the URL to redirect them to. PRD 5.7: billing self-service goes
 * through Stripe's hosted Customer Portal rather than custom UI.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (error || !subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found for this user." },
      { status: 404 }
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Billing portal session creation failed:", err);
    return NextResponse.json(
      { error: "Could not open billing portal. Please try again." },
      { status: 500 }
    );
  }
}
