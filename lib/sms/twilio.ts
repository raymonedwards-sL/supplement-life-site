/**
 * Thin wrapper around Twilio's Messages REST API — plain `fetch` + Basic
 * Auth rather than the `twilio` npm SDK, so there's no extra dependency to
 * bundle into the Next.js app or the Netlify Functions build. Used by:
 *   - netlify/functions/send-daily-sms.mts (the daily nudge send)
 *   - anywhere else that might need a one-off transactional text later
 *
 * Required env vars (none of this sends anything until all three are set):
 *   TWILIO_ACCOUNT_SID   — starts with "AC"
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER   — an SMS-capable Twilio number, E.164 (e.g. +15551234567)
 *
 * Twilio auto-enforces STOP/START opt-outs at the carrier/account level on
 * every number — once a recipient texts STOP, Twilio will refuse to send
 * to them and returns error code 21610. Callers should catch that specific
 * code and flip sms_opt_in to false in our own DB too (see
 * netlify/functions/send-daily-sms.mts), so the dashboard toggle reflects
 * reality instead of silently failing every night.
 */

const TWILIO_UNSUBSCRIBED_ERROR_CODE = 21610;

export type SendSmsResult =
  | { ok: true }
  | { ok: false; error: string; unsubscribed?: boolean };

export async function sendSms(params: { to: string; body: string }): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      ok: false,
      error: "Twilio env vars not configured (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER).",
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: params.to,
    From: fromNumber,
    Body: params.body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (res.ok) return { ok: true };

    const payload = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    return {
      ok: false,
      error: payload?.message ?? `Twilio request failed with status ${res.status}`,
      unsubscribed: payload?.code === TWILIO_UNSUBSCRIBED_ERROR_CODE,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown Twilio send error" };
  }
}
