import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Receives inbound SMS replies to Sage's daily nudge (netlify/functions/
 * send-daily-sms.mts) — specifically STOP/START-family keywords.
 *
 * Twilio already enforces opt-outs at the carrier/account level for every
 * number (a STOP reply makes Twilio itself refuse future sends, and
 * Twilio sends its own default confirmation text) — this webhook is
 * defense in depth so OUR OWN sms_opt_in column (and therefore the
 * dashboard toggle) reflects reality instead of silently drifting out of
 * sync with what Twilio is actually willing to send.
 *
 * Configure this route's URL (https://yourdomain.com/api/webhooks/twilio-sms)
 * as the "A MESSAGE COMES IN" webhook on the TWILIO_FROM_NUMBER in the
 * Twilio console, HTTP POST. Requires TWILIO_AUTH_TOKEN (same one used by
 * lib/sms/twilio.ts) to verify the request actually came from Twilio.
 */

const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]);
const START_KEYWORDS = new Set(["START", "YES", "UNSTOP"]);

/** Twilio's documented request-signing scheme: HMAC-SHA1 of the webhook URL plus every POST param (sorted by key, key+value concatenated with no separator), keyed with the Auth Token, base64-encoded. */
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }
  const expected = crypto.createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

const EMPTY_TWIML_RESPONSE = new NextResponse("<Response></Response>", {
  status: 200,
  headers: { "Content-Type": "text/xml" },
});

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature");
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourlifeprotocol.com";
  const webhookUrl = `${siteUrl}/api/webhooks/twilio-sms`;

  if (!authToken || !signature || !verifyTwilioSignature(webhookUrl, params, signature, authToken)) {
    console.error("Twilio SMS webhook: signature verification failed.");
    return new NextResponse("Invalid signature.", { status: 403 });
  }

  const from = params.From;
  const body = (params.Body ?? "").trim().toUpperCase();

  if (from && (STOP_KEYWORDS.has(body) || START_KEYWORDS.has(body))) {
    const nextOptIn = START_KEYWORDS.has(body);
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        sms_opt_in: nextOptIn,
        ...(nextOptIn ? { sms_consent_at: new Date().toISOString() } : {}),
      })
      .eq("phone_number", from);

    if (error) {
      console.error("Failed to update sms_opt_in from inbound Twilio message:", error);
    }
  }

  // Empty TwiML — Twilio already sends its own default STOP/START
  // confirmation reply; we don't need to (and shouldn't) send a second one.
  return EMPTY_TWIML_RESPONSE;
}
