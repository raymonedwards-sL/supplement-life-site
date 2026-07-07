import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { sendPreConversionNotice } from "../../lib/email/send-pre-conversion-notice";

/**
 * FR-6: notifies every pending Founding Reservation subscriber once their
 * shared go-live conversion date is 14 days out or closer, so they have a
 * chance to cancel before the deposit converts to a subscription charge.
 *
 * Runs daily rather than only on the exact 14-day mark, and skips anyone
 * already logged in notification_log — so a missed or delayed run still
 * catches up instead of silently never notifying someone.
 */
export default async () => {
  const goLiveDate = process.env.GO_LIVE_DATE;
  if (!goLiveDate) {
    console.warn("GO_LIVE_DATE is not set — nothing to check yet.");
    return new Response("GO_LIVE_DATE not set", { status: 200 });
  }

  const daysUntilConversion = Math.ceil(
    (new Date(goLiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilConversion > 14 || daysUntilConversion < 0) {
    return new Response(
      `Not in the notice window yet (${daysUntilConversion} days out).`,
      { status: 200 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: pendingSubs, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, conversion_date, users(email)")
    .eq("status", "pending");

  if (error) {
    console.error("Failed to load pending subscriptions:", error);
    return new Response("Failed to load subscriptions", { status: 500 });
  }

  const { data: alreadyNotified } = await supabaseAdmin
    .from("notification_log")
    .select("user_id")
    .eq("type", "pre_conversion_14_day");

  const notifiedUserIds = new Set((alreadyNotified ?? []).map((r) => r.user_id));

  let sent = 0;
  for (const sub of pendingSubs ?? []) {
    if (notifiedUserIds.has(sub.user_id)) continue;

    // Supabase types this as an array from the join even though it's 1:1.
    const user = Array.isArray(sub.users) ? sub.users[0] : sub.users;
    const email = (user as { email?: string } | null)?.email;
    if (!email) continue;

    try {
      await sendPreConversionNotice({ email, conversionDate: goLiveDate });

      await supabaseAdmin.from("notification_log").insert({
        user_id: sub.user_id,
        type: "pre_conversion_14_day",
      });

      sent++;
    } catch (err) {
      console.error(`Failed to notify user ${sub.user_id}:`, err);
      // Keep going — one failure shouldn't block the rest of the batch.
    }
  }

  return new Response(`Notified ${sent} subscriber(s).`, { status: 200 });
};

export const config: Config = {
  schedule: "@daily",
};
