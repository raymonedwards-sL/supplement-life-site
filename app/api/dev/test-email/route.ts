import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPreConversionNotice } from "@/lib/email/send-pre-conversion-notice";

/**
 * Manual trigger to verify the Resend pipeline end-to-end without waiting
 * for the real 14-day window before GO_LIVE_DATE. Sends the actual
 * pre-conversion notice email to the logged-in user's own address —
 * auth-gated so this can't be used to spam arbitrary addresses.
 *
 * Usage: while logged in, visit /api/dev/test-email in the browser (GET),
 * or POST to it. Remove this route once Resend is confirmed working, or
 * leave it — it can only ever email the account you're signed in as.
 */
async function handle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const conversionDate = process.env.GO_LIVE_DATE ?? new Date().toISOString();

  try {
    await sendPreConversionNotice({ email: user.email, conversionDate });
    return NextResponse.json({
      ok: true,
      sentTo: user.email,
      conversionDate,
      note: "If RESEND_API_KEY isn't set on this environment yet, this was logged, not actually sent — check function logs.",
    });
  } catch (err) {
    console.error("Test email send failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
