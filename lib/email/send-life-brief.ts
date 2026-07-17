import { Resend } from "resend";

/**
 * Emails "Your LIFE Brief" (the PDF from lib/pdf/life-brief.ts)
 * immediately after Sage's intake conversation completes — the
 * "she receives the Brief immediately — it's beautiful, shareable, and
 * genuinely hers" moment from the LIFE Assessment funnel.
 *
 * Called fire-and-forget from app/api/intake/chat/route.ts's completion
 * branch (same pattern as addBeehiivSubscriber in the Stripe webhook) —
 * a Resend outage or missing API key must never fail intake completion
 * for the subscriber. Fails soft internally; only logs.
 */
export async function sendLifeBriefEmail(params: { email: string; pdfBytes: Uint8Array }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `RESEND_API_KEY not set — skipping LIFE Brief email to ${params.email}. ` +
        "The Brief is still available on-demand from the dashboard."
    );
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourlifeprotocol.com";

    await resend.emails.send({
      from: "Supplement :: LIFE <hello@yourlifeprotocol.com>",
      to: params.email,
      subject: "Your LIFE Brief is ready",
      text: `Hi,

Sage just finished your personalized LIFE Brief — your Botanical Track, the reasoning behind every ingredient, and what your first 90 days is designed to do. It's attached as a PDF.

You can revisit it anytime from your dashboard: ${siteUrl}/dashboard

— Supplement :: LIFE`,
      attachments: [
        {
          filename: "your-life-brief.pdf",
          content: Buffer.from(params.pdfBytes),
        },
      ],
    });
  } catch (err) {
    console.error("Failed to send LIFE Brief email:", err);
  }
}
