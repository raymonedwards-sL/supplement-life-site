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
 * email. The /dashboard link below is now live — it has a "Manage
 * Billing" button that opens Stripe's Customer Portal, where
 * cancellation is enabled. Final subject/body copy should still get the
 * attorney review flagged for the disclaimer language in PRD Section 12
 * before this goes out to real customers.
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourlifeprotocol.com";
  const formattedDate = new Date(params.conversionDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  await resend.emails.send({
    from: "Supplement :: LIFE <hello@yourlifeprotocol.com>",
    to: params.email,
    subject: "Your Founding Subscription converts in 14 days",
    text: `Your $249 Founding Subscription deposit will convert to your Protocol Subscription on ${formattedDate}, per the Founding Subscriber Program terms you agreed to when reserving. As a Founding Subscriber, you're billed $249/month for your first six months — half the $499/month price we're offering the public starting October 2026 — then $499/month (our standard rate) after that.

If you'd like to cancel and receive a refund instead, you can do so any time before that date here: ${siteUrl}/dashboard

No action is needed if you'd like your subscription to begin as planned.

— Supplement :: LIFE`,
  });
}
