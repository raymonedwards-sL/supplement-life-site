import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { findTrack } from "@/lib/tracks";
import { parseRationale } from "@/lib/rationale";

/**
 * Generates a branded "Wellness Insights" PDF snapshot of the subscriber's
 * current profile + Botanical Track assignment, on demand. There is no
 * stored/cached PDF anywhere — every download re-reads live Supabase data,
 * which is what makes this "evolve" as the subscriber's wellness
 * experience does: revisit the intake, get re-matched, download again,
 * and the report reflects the new profile automatically.
 *
 * Uses pdf-lib (pure JS, no native/browser binary) rather than something
 * like Puppeteer, since this needs to run in a Netlify serverless
 * function — no headless-Chrome-sized cold starts.
 */

const BLOCKED_STATUSES = new Set(["refunded", "canceled"]);
const TRACK_ROLE_LABELS = ["Primary", "Secondary", "Tertiary"];

const NAVY = rgb(0x1b / 255, 0x2a / 255, 0x4a / 255);
const COPPER = rgb(0xb5 / 255, 0x73 / 255, 0x2b / 255);
const INK = rgb(0.15, 0.15, 0.17);
const MUTED = rgb(0.42, 0.42, 0.46);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 60;

type Cursor = { page: PDFPage; y: number; pageNumber: number };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [{ data: profile }, { data: trackAssignment }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("current_summary, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("track_assignments")
        .select("tracks, rationale, assigned_at")
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, conversion_date")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (subscription?.status && BLOCKED_STATUSES.has(subscription.status)) {
    return NextResponse.json(
      { error: "This account's reservation is no longer active." },
      { status: 403 }
    );
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Supplement :: LIFE — Wellness Insights");
  pdfDoc.setAuthor("Supplement :: LIFE");
  pdfDoc.setSubject("Personal Wellness Insights Report");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const firstPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const headerBottomY = await drawBrandHeader(pdfDoc, firstPage, bold, font, user.email ?? "");

  const cursor: Cursor = { page: firstPage, y: headerBottomY - 20, pageNumber: 1 };

  const generatedOn = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  drawText(pdfDoc, cursor, `Generated ${generatedOn}`, font, 9, MUTED);
  cursor.y -= 22;

  // --- Wellness Profile ---
  drawSectionHeading(pdfDoc, cursor, "Your Wellness Profile", bold);
  if (profile?.current_summary) {
    drawParagraph(pdfDoc, cursor, profile.current_summary, font, 11, INK);
  } else {
    drawParagraph(
      pdfDoc,
      cursor,
      "You haven't completed your wellness intake yet. Once you do, this section will summarize your personal wellness profile in your own words.",
      italic,
      11,
      MUTED
    );
  }
  cursor.y -= 18;

  // --- Botanical Track(s) ---
  drawSectionHeading(pdfDoc, cursor, "Your Botanical Track(s)", bold);
  const trackIds = (trackAssignment?.tracks ?? []) as string[];
  const tracks = trackIds
    .map((id) => findTrack(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (tracks.length > 0) {
    const rationaleEntries = parseRationale(trackAssignment?.rationale);
    const legacyRationale = rationaleEntries.find((r) => !r.track_id)?.reason;

    tracks.forEach((track, i) => {
      const label = TRACK_ROLE_LABELS[i] ?? "Additional";
      drawText(pdfDoc, cursor, `${label.toUpperCase()} — ${track.name}`, bold, 13, COPPER);
      cursor.y -= 16;
      drawParagraph(pdfDoc, cursor, track.consumerNeed, italic, 10, MUTED);
      cursor.y -= 4;
      drawParagraph(
        pdfDoc,
        cursor,
        `Ingredients: ${track.ingredients.join(", ")}`,
        font,
        10,
        INK
      );
      drawParagraph(pdfDoc, cursor, `Format: ${track.format}`, font, 10, INK);

      const reason = rationaleEntries.find((r) => r.track_id === track.id)?.reason;
      if (reason) {
        cursor.y -= 6;
        drawText(pdfDoc, cursor, "Why this fits you", bold, 10, NAVY);
        cursor.y -= 14;
        drawParagraph(pdfDoc, cursor, reason, font, 10, INK);
      }
      cursor.y -= 10;
    });

    // Legacy rows (pre 2026-07-13) stored one shared paragraph with no
    // track_id — still show it rather than silently dropping it.
    if (legacyRationale) {
      drawText(pdfDoc, cursor, "Why this fits you", bold, 11, NAVY);
      cursor.y -= 16;
      drawParagraph(pdfDoc, cursor, legacyRationale, font, 11, INK);
    }
  } else {
    drawParagraph(
      pdfDoc,
      cursor,
      "No Botanical Track has been assigned yet — complete your wellness intake to get matched.",
      italic,
      11,
      MUTED
    );
  }
  cursor.y -= 18;

  // --- Subscription status ---
  drawSectionHeading(pdfDoc, cursor, "Subscription Status", bold);
  const statusLabel = subscription?.status ?? "Not yet started";
  drawParagraph(pdfDoc, cursor, `Status: ${capitalize(statusLabel)}`, font, 11, INK);
  if (subscription?.conversion_date) {
    const conversionDate = new Date(subscription.conversion_date).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );
    const label =
      subscription.status === "active" ? "Next billing date" : "Subscription begins";
    drawParagraph(pdfDoc, cursor, `${label}: ${conversionDate}`, font, 11, INK);
  }

  drawFooters(pdfDoc, font);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="supplement-life-wellness-insights.pdf"',
      "Cache-Control": "no-store",
    },
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const LOGO_WIDTH = 170;

/**
 * Draws the real brand lockup (public/branding/logo-light.png) at the top
 * of the report, followed by a copper rule and a "Your Wellness Insights"
 * eyebrow line with the subscriber's email. Returns the y-coordinate right
 * below the header, so the caller knows where body content can start.
 */
async function drawBrandHeader(
  pdfDoc: PDFDocument,
  page: PDFPage,
  bold: PDFFont,
  font: PDFFont,
  email: string
): Promise<number> {
  const logoBytes = await readFile(
    path.join(process.cwd(), "public", "branding", "logo-light.png")
  );
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoDims = logoImage.scale(LOGO_WIDTH / logoImage.width);
  const logoY = PAGE_HEIGHT - 44 - logoDims.height;

  page.drawImage(logoImage, {
    x: MARGIN_X,
    y: logoY,
    width: logoDims.width,
    height: logoDims.height,
  });

  const ruleY = logoY - 16;
  page.drawLine({
    start: { x: MARGIN_X, y: ruleY },
    end: { x: PAGE_WIDTH - MARGIN_X, y: ruleY },
    thickness: 1.25,
    color: COPPER,
  });

  const labelY = ruleY - 20;
  page.drawText("YOUR WELLNESS INSIGHTS", {
    x: MARGIN_X,
    y: labelY,
    size: 11,
    font: bold,
    color: COPPER,
  });

  if (email) {
    const emailSize = 9;
    const emailWidth = font.widthOfTextAtSize(email, emailSize);
    page.drawText(email, {
      x: PAGE_WIDTH - MARGIN_X - emailWidth,
      y: labelY + 1,
      size: emailSize,
      font,
      color: MUTED,
    });
  }

  return labelY;
}

/** Wraps `text` to fit within the page's content width, drawing line by line and advancing the cursor. Adds a new page when it runs out of vertical room. */
function drawParagraph(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>
) {
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2;
  const lineHeight = size * 1.45;
  const words = text.split(/\s+/);
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      drawText(doc, cursor, line, font, size, color, lineHeight);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    drawText(doc, cursor, line, font, size, color, lineHeight);
  }
}

function drawText(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  lineHeight = size * 1.4
) {
  if (cursor.y - lineHeight < BOTTOM_MARGIN) {
    const newPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursor.page = newPage;
    cursor.y = PAGE_HEIGHT - TOP_MARGIN;
    cursor.pageNumber += 1;
  }
  cursor.page.drawText(text, {
    x: MARGIN_X,
    y: cursor.y,
    size,
    font,
    color,
  });
  cursor.y -= lineHeight;
}

function drawSectionHeading(doc: PDFDocument, cursor: Cursor, text: string, bold: PDFFont) {
  if (cursor.y - 30 < BOTTOM_MARGIN) {
    const newPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursor.page = newPage;
    cursor.y = PAGE_HEIGHT - TOP_MARGIN;
    cursor.pageNumber += 1;
  }
  drawText(doc, cursor, text.toUpperCase(), bold, 12, COPPER, 18);
  cursor.page.drawLine({
    start: { x: MARGIN_X, y: cursor.y + 6 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: cursor.y + 6 },
    thickness: 0.75,
    color: rgb(0.85, 0.82, 0.76),
  });
  cursor.y -= 6;
}

function drawFooters(doc: PDFDocument, font: PDFFont) {
  const pages = doc.getPages();
  const disclaimer =
    "Supplement :: LIFE provides personalized wellness information, not medical advice, a diagnosis, or a treatment plan. Talk to your healthcare provider before starting any new supplement, especially if you have a medical condition, take prescription medication, or are pregnant or nursing.";

  pages.forEach((page, i) => {
    const maxWidth = PAGE_WIDTH - MARGIN_X * 2;
    const words = disclaimer.split(/\s+/);
    let line = "";
    let y = 40;
    const lines: string[] = [];
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, 7.5) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);

    // Draw from the bottom up so the last line sits closest to the page edge.
    for (let li = lines.length - 1; li >= 0; li--) {
      page.drawText(lines[li], {
        x: MARGIN_X,
        y,
        size: 7.5,
        font,
        color: MUTED,
      });
      y += 10;
    }

    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN_X - 60,
      y: 40 + (lines.length - 1) * 10,
      size: 7.5,
      font,
      color: MUTED,
    });
  });
}
