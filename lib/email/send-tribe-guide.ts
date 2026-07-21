import { Resend } from "resend";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Emails the free lead-magnet guide ("7 Signs Your Body Is Asking for a
 * Reset After 35", public/Supplement-LIFE-7-Signs-Reset-After-35.pdf)
 * immediately after someone joins the free LIFE Tribe (app/join). Same
 * attach-the-actual-PDF pattern as sendLifeBriefEmail, for consistency —
 * a durable copy in the subscriber's inbox, not just a page they might
 * navigate away from before downloading.
 *
 * Called fire-and-forget from app/api/join-tribe/route.ts, same
 * fail-soft posture as every other email/beehiiv call in that route — a
 * Resend outage must never block someone from joining the free list.
 * The /join success screen's direct download link is the real
 * "immediate access" guarantee; this email is the durable backup.
 */
export async function sendTribeGuideEmail(email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `RESEND_API_KEY not set — skipping tribe guide email to ${email}. ` +
        "The guide is still directly downloadable from the /join success screen."
    );
    return;
  }

  try {
    const pdfPath = path.join(
      process.cwd(),
      "public",
      "Supplement-LIFE-7-Signs-Reset-After-35.pdf"
    );
    const pdfBytes = await readFile(pdfPath);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourlifeprotocol.com";

    await resend.emails.send({
      from: "Supplement :: LIFE <hello@yourlifeprotocol.com>",
      to: email,
      subject: "Your free guide: 7 Signs Your Body Is Asking for a Reset After 35",
      text: `Hi,

Here's your free guide — 7 Signs Your Body Is Asking for a Reset After 35. It's attached as a PDF.

When you're ready to see what Sage would say about you specifically, the guided LIFE Assessment is here: ${siteUrl}/assessment

— Supplement :: LIFE`,
      attachments: [
        {
          filename: "Supplement-LIFE-7-Signs-Reset-After-35.pdf",
          content: pdfBytes,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to send tribe guide email:", err);
  }
}
