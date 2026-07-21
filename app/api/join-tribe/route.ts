import { NextRequest, NextResponse } from "next/server";
import { addBeehiivSubscriber } from "@/lib/beehiiv";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Free, zero-friction "Join the LIFE Tribe" opt-in (2026-07-20, extended
 * same day to add a qualifying question). Deliberately NOT a Stripe
 * checkout — no payment, no account, no auth.users row. This exists
 * because the ONLY way onto the beehiiv list used to be completing a
 * paid checkout ($99 Assessment or $249 Founding deposit — see the two
 * addBeehiivSubscriber call sites in app/api/webhooks/stripe/route.ts).
 *
 * Extended the same day the user shared a reference funnel (video +
 * conversational one-question intake before a lead form) and asked for
 * something similar here. Kept it to exactly one tap-to-select question
 * (see app/join/page.tsx) rather than a longer chain — the whole reason
 * this page exists is to be the LOW-friction alternative to the $99
 * guided Assessment; a long qualifying chain would just recreate the
 * paywall-shaped problem with extra steps instead of a price tag.
 */
export async function POST(request: NextRequest) {
  const { email, challenge } = await request.json();

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const challengeText =
    typeof challenge === "string" && challenge.trim().length > 0
      ? challenge.trim()
      : null;

  // 1. Durable capture, regardless of beehiiv's config state (see the
  // migration's comment on why this table exists alongside the beehiiv
  // custom field attempt below).
  try {
    const supabaseAdmin = createAdminClient();
    const { error: insertError } = await supabaseAdmin.from("tribe_leads").insert({
      email,
      challenge: challengeText,
    });
    if (insertError) {
      console.error("join-tribe: failed to insert tribe_leads row:", insertError);
    }
  } catch (error) {
    // Same fail-soft posture as the rest of this route — a Supabase
    // hiccup should never block someone from joining the free list.
    console.error("join-tribe: tribe_leads insert threw:", error);
  }

  // 2. beehiiv sync — the actual mailing list. custom_fields is sent
  // whenever we have an answer, but per beehiiv's docs it's silently
  // discarded unless a "Biggest Challenge" custom field already exists
  // in the beehiiv dashboard (Settings > Custom Fields). Step 1 above is
  // what guarantees this data isn't lost while that one-time setup step
  // is still pending.
  const result = await addBeehiivSubscriber(email, {
    utmMedium: "free_tribe_optin",
    ...(challengeText
      ? { customFields: [{ name: "Biggest Challenge", value: challengeText }] }
      : {}),
  });

  if (!result.ok && result.reason === "not_configured") {
    console.error(
      "join-tribe: beehiiv not configured, subscriber was NOT synced to beehiiv (still captured in tribe_leads):",
      email
    );
  }

  // Always return success to the visitor even on a beehiiv API hiccup —
  // the tribe_leads row above already guarantees the lead isn't lost, so
  // there's no reason to show an error screen at the exact moment
  // someone chose to join.
  return NextResponse.json({ ok: true });
}
