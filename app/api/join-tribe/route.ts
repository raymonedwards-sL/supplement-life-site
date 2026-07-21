import { NextRequest, NextResponse } from "next/server";
import { addBeehiivSubscriber } from "@/lib/beehiiv";

/**
 * Free, zero-friction "Join the LIFE Tribe" opt-in (2026-07-20 launch-push
 * build). Deliberately NOT a Stripe checkout — no payment, no account, no
 * Supabase row. This exists because, before this route, the ONLY way onto
 * the beehiiv list was completing a paid checkout ($99 Assessment or $249
 * Founding deposit — see the two addBeehiivSubscriber call sites in
 * app/api/webhooks/stripe/route.ts). That meant there was no low-friction
 * capture for someone who's interested but not ready to pay, which is a
 * real gap for a broad reach push (cold/warm social, practitioner shares,
 * press) where most people who click a link aren't ready to buy on the
 * spot. This route is that capture.
 *
 * Tagged with utmMedium: "free_tribe_optin" (see lib/beehiiv.ts) so this
 * list is segmentable in beehiiv from actual paying customers — don't
 * silently email this segment the same upsell cadence as a $99/$249
 * customer without accounting for that difference.
 */
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const result = await addBeehiivSubscriber(email, {
    utmMedium: "free_tribe_optin",
  });

  if (!result.ok && result.reason === "not_configured") {
    // beehiiv isn't wired up in this environment — don't tell the visitor
    // it failed (that reads as broken), but don't silently claim success
    // to hide a real integration gap either. Log it; this is loud enough
    // for the deploy owner to notice in server logs without leaking
    // internal config state to the client.
    console.error(
      "join-tribe: beehiiv not configured, subscriber was NOT captured:",
      email
    );
  }

  // Always return success to the visitor even on a beehiiv API hiccup —
  // same fail-soft posture as the existing webhook call sites. Someone
  // handing over their email on a free opt-in should never see an error
  // screen; if beehiiv genuinely fails, that's a server-log problem to
  // fix, not something to surface as friction at the exact moment someone
  // chose to join.
  return NextResponse.json({ ok: true });
}
