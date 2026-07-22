import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { sendSms } from "../../lib/sms/twilio";

/**
 * Sage's daily SMS nudge (2026-07-22) — one short text a day to every
 * subscriber who's opted in from their dashboard (public.profiles'
 * sms_opt_in/phone_number columns, migration 0014). Content is pulled
 * straight from the same water_intake_recommendation/fasting_recommendation
 * guidance already shown on the dashboard and in the LIFE Brief PDF — no
 * separate content system, no new Claude call per subscriber per day.
 *
 * Alternates between the hydration and fasting recommendation by day of
 * year, so a subscriber with both isn't getting two texts a day (the
 * dashboard toggle promises "about 1/day"). Falls back to whichever one
 * recommendation exists if only one is set.
 *
 * Same self-contained-function pattern as notify-pre-conversion.mts and
 * generate-daily-digest.mts: relative imports (no @/ alias — this runs
 * outside the Next.js build), a plain Supabase client built with the
 * service-role key, default export handler returning a plain Response,
 * and the Config/schedule export at the bottom.
 *
 * Requires TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER (see
 * lib/sms/twilio.ts) in addition to the usual Supabase service-role env
 * vars — skips (not errors) if either is missing, so a not-yet-configured
 * Twilio account never breaks the scheduled run.
 */

const MAX_BODY_LENGTH = 300;
const SIGNATURE = "\n\n— Sage, Supplement :: LIFE. Reply STOP to opt out.";

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export default async () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.warn("Twilio env vars not set — skipping today's SMS nudge run.");
    return new Response("Twilio not configured", { status: 200 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase service-role env vars not set — skipping today's SMS nudge run.");
    return new Response("Supabase not configured", { status: 200 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: optedIn, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, phone_number, water_intake_recommendation, fasting_recommendation")
    .eq("sms_opt_in", true)
    .not("phone_number", "is", null);

  if (error) {
    console.error("Failed to load SMS opt-in profiles:", error);
    return new Response("Failed to load profiles", { status: 500 });
  }

  // Day-of-year parity picks hydration on even days, fasting on odd days —
  // deterministic (no per-subscriber state to track) and keeps this at
  // roughly one text a day even for subscribers with both recommendations.
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const preferHydrationToday = dayOfYear % 2 === 0;

  let sent = 0;
  let skipped = 0;
  let optedOut = 0;

  for (const profile of optedIn ?? []) {
    const phone = profile.phone_number as string | null;
    const hydration = profile.water_intake_recommendation as string | null;
    const fasting = profile.fasting_recommendation as string | null;
    if (!phone) continue;

    let label: string;
    let content: string | null;
    if (preferHydrationToday && hydration) {
      label = "Hydration";
      content = hydration;
    } else if (!preferHydrationToday && fasting) {
      label = "Fasting window";
      content = fasting;
    } else if (hydration) {
      label = "Hydration";
      content = hydration;
    } else if (fasting) {
      label = "Fasting window";
      content = fasting;
    } else {
      label = "";
      content = null;
    }

    if (!content) {
      skipped++;
      continue;
    }

    const body = truncate(`${label}: ${content}`, MAX_BODY_LENGTH - SIGNATURE.length) + SIGNATURE;
    const result = await sendSms({ to: phone, body });

    if (result.ok) {
      sent++;
    } else {
      console.error(`Failed to text user ${profile.user_id}: ${result.error}`);
      if (result.unsubscribed) {
        optedOut++;
        await supabaseAdmin
          .from("profiles")
          .update({ sms_opt_in: false })
          .eq("user_id", profile.user_id);
      }
    }
  }

  return new Response(
    `Sent ${sent} SMS nudge(s), skipped ${skipped} (no guidance yet), ${optedOut} auto-opted-out.`,
    { status: 200 }
  );
};

export const config: Config = {
  // 13:00 UTC lands in the morning across the US (~9am ET / 6am PT,
  // shifting an hour with DST) — a reasonable single fixed time for a v1.
  // Revisit if per-subscriber timezone-aware sending is ever worth building.
  schedule: "0 13 * * *",
};
