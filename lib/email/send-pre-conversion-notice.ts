import { Resend } from "resend";

/**
 * Sends the FR-6 "14 days before conversion" notice.
 *
 * PROVIDER CHOICE: the launch guide references a "Technical Launch Guide"
 * for the exact spec of this job, which isn't available yet — Resend was
 * picked here as a reasonable, low-friction default (simple API, generous
 * free tier). Swap this out if the Technical Launch Guide specifies a
 * different provider (SendGrid, Postmark, etc.) — only this file and the
 * RESEND_API_KEY env var would need to change.
 *
 * COMPLIANCE NOTE: FR-6 requires "a one-click cancel option" in this
 * email. The link below points at /dashboard as a placeholder — wire it
 * to the actual cancel action once Step 7 (dashboard + Stripe Customer
 * Portal) exists. Final subject/body copy should get the same attorney
 * review flagged for the disclaimer language in PRD Section 12.
 */
export async function sendPreConversionNotice(params: {
  email: string;
  conversionDate: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `RESEND_API_KEY not set — skipping send to ${params.email}. ` +
        "Notification will still be logged so the pipeline can be verified end-to-end."
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://supplementlife.com";
  const formattedDate = new Date(params.conversionDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await resend.emails.send({
    from: "Supplement :: LIFE <hello@supplementlife.com>",
    to: params.email,
    subject: "Your Founding Reservation converts to a subscription in 14 days",
    text: `Your $249 Founding Reservation deposit will convert to your first monthly subscription charge on ${formattedDate}, per the terms you agreed to when reserving.

If you'd like to cancel and receive a refund instead, you can do so any time before that date here: ${siteUrl}/dashboard

No action is needed if you'd like your subscription to begin as planned.

— Supplement :: LIFE`,
  });
}
