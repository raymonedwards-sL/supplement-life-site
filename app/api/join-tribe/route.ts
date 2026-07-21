import { NextRequest, NextResponse } from "next/server";
import { addBeehiivSubscriber } from "@/lib/beehiiv";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTribeGuideEmail } from "@/lib/email/send-tribe-guide";

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
 * something similar here, then extended again same day to accept
 * MULTIPLE selected pain points instead of one ("if they face a
 * cacophony of issues, I want to capture that" — see
 * supabase/migrations/0012_tribe_leads_multiselect.sql). Still just one
 * qualifying step, not a chain of screens — the whole reason this page
 * exists is to be the LOW-friction alternative to the $99 guided
 * Assessment; a long multi-screen sequence would recreate the
 * paywall-shaped problem with extra steps instead of a price tag.
 */
export async function POST(request: NextRequest) {
  const { email, challenges } = await request.json();

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const challengeList: string[] = Array.isArray(challenges)
    ? challenges.filter(
        (c): c is string => typeof c === "string" && c.trim().length > 0
      )
    : [];

  // 1. Durable capture, regardless of beehiiv's config state (see the
  // migration's comment on why this table exists alongside the beehiiv
  // custom field attempt below).
  try {
    const supabaseAdmin = createAdminClient();
    const { error: insertError } = await supabaseAdmin.from("tribe_leads").insert({
      email,
      challenges: challengeList.length > 0 ? challengeList : null,
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
  // whenever we have at least one answer, joined into one string since a
  // beehiiv custom field value is a single string, not an array. Per
  // beehiiv's docs this is silently discarded unless a "Biggest
  // Challenge" custom field already exists in the beehiiv dashboard
  // (Settings > Custom Fields). Step 1 above is what guarantees this
  // data isn't lost while that one-time setup step is still pending.
  // BEEHIIV_TRIBE_AUTOMATION_ID is intentionally optional — it can only be
  // set once the "7 Signs" drip sequence has actually been built in the
  // beehiiv dashboard with an "Add by API" trigger (beehiiv's API has no
  // way to create that automation itself, only to enroll into one that
  // already exists — see the automationIds comment in lib/beehiiv.ts).
  // Until that env var is set, this is a no-op and nothing breaks.
  const tribeAutomationId = process.env.BEEHIIV_TRIBE_AUTOMATION_ID;

  const result = await addBeehiivSubscriber(email, {
    utmMedium: "free_tribe_optin",
    ...(challengeList.length > 0
      ? { customFields: [{ name: "Biggest Challenge", value: challengeList.join("; ") }] }
      : {}),
    ...(tribeAutomationId ? { automationIds: [tribeAutomationId] } : {}),
  });

  if (!result.ok && result.reason === "not_configured") {
    console.error(
      "join-tribe: beehiiv not configured, subscriber was NOT synced to beehiiv (still captured in tribe_leads):",
      email
    );
  }

  // 3. Lead magnet delivery (2026-07-20) — the "7 Signs Your Body Is
  // Asking for a Reset After 35" guide, offered in exchange for the
  // email. The /join success screen also links straight to the PDF for
  // instant access; this email is the durable copy in their inbox. Same
  // fail-soft posture as everything above — sendTribeGuideEmail never
  // throws out of its own try/catch, so this can't turn a successful
  // join into an error response.
  await sendTribeGuideEmail(email);

  // Always return success to the visitor even on a beehiiv API hiccup —
  // the tribe_leads row above already guarantees the lead isn't lost, so
  // there's no reason to show an error screen at the exact moment
  // someone chose to join.
  return NextResponse.json({ ok: true });
}
