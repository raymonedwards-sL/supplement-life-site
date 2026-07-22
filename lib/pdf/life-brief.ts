import { readFile } from "fs/promises";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { findTrack, type Track } from "@/lib/tracks";
import type { TrackRationale } from "@/lib/rationale";

/**
 * Builds "Your LIFE Brief" — the branded PDF snapshot of a subscriber's
 * wellness profile + Botanical Track assignment.
 *
 * 2026-07-22 redesign: the original version (Helvetica-only, text on a
 * white page, one small logo) read thin next to the $797 LIFE Assessment
 * price — a subscriber's own words after seeing it. This pass adds real
 * photography (the same track-packaging shots and hero botanicals image
 * used on the dashboard/site, so the Brief and the live product feel like
 * one thing, not two), tinted card layouts in place of bare paragraphs,
 * and a callout that ties the Brief to the new SMS daily-nudge feature —
 * making clear this document is the start of an ongoing relationship
 * with Sage, not a one-time printout. Still pure pdf-lib (no headless
 * Chrome / native binary), still built on demand from live Supabase data
 * — same architecture, richer output.
 *
 * Extracted out of app/api/dashboard/insights-pdf/route.ts into this
 * shared module so both that on-demand download route AND the automatic
 * post-intake email (lib/email/send-life-brief.ts) generate from one
 * canonical builder.
 */

const TRACK_ROLE_LABELS = ["Primary", "Secondary", "Tertiary"];

const NAVY = rgb(0x1b / 255, 0x2a / 255, 0x4a / 255);
const COPPER = rgb(0xb5 / 255, 0x73 / 255, 0x2b / 255);
const INK = rgb(0.15, 0.15, 0.17);
const MUTED = rgb(0.42, 0.42, 0.46);
const CARD_BORDER = rgb(0.85, 0.82, 0.76);
const CARD_TINT = rgb(0xfb / 255, 0xf7 / 255, 0xf0 / 255);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 56;
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 60;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

type Cursor = { page: PDFPage; y: number; pageNumber: number };

export type LifeBriefInput = {
  email: string;
  currentSummary: string | null;
  waterIntakeRecommendation: string | null;
  fastingRecommendation: string | null;
  trackIds: string[];
  rationale: TrackRationale[];
  subscriptionStatus: string | null;
  conversionDate: string | null;
  /** Whether this subscriber has already opted in to Sage's daily SMS nudge (lib/sms) — swaps the closing callout between a status note and a sign-up CTA. */
  smsOptedIn?: boolean;
};

export async function buildLifeBriefPdf(input: LifeBriefInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Supplement :: LIFE — Your LIFE Brief");
  pdfDoc.setAuthor("Supplement :: LIFE");
  pdfDoc.setSubject("Personal LIFE Brief");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const serifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fonts = { font, bold, italic, serifBold, serifItalic };

  const firstPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const headerBottomY = await drawBrandHeader(pdfDoc, firstPage, bold, font, input.email);

  const cursor: Cursor = { page: firstPage, y: headerBottomY - 18, pageNumber: 1 };

  const generatedOn = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  drawText(pdfDoc, cursor, `Generated ${generatedOn}`, font, 9, MUTED);
  cursor.y -= 8;

  // --- Editorial headline + hero botanicals photo ---
  drawText(pdfDoc, cursor, "Your Personal Protocol.", serifBold, 24, NAVY, 30);
  cursor.y -= 8;
  await drawFullWidthImage(pdfDoc, cursor, "products/hero-botanicals.png", {
    maxHeight: 190,
  });

  // --- Wellness Profile ---
  drawSectionHeading(pdfDoc, cursor, "Your Wellness Profile", bold);
  if (input.currentSummary) {
    drawPullQuoteBox(pdfDoc, cursor, input.currentSummary, serifItalic);
  } else {
    drawParagraph(
      pdfDoc,
      cursor,
      "You haven't completed your LIFE Assessment yet. Once you do, this section will summarize your personal wellness profile in your own words.",
      italic,
      11,
      MUTED
    );
    cursor.y -= 18;
  }

  // --- Botanical Track(s) ---
  drawSectionHeading(pdfDoc, cursor, "Your Botanical Track(s)", bold);
  const tracks = input.trackIds
    .map((id) => findTrack(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  if (tracks.length > 0) {
    const legacyRationale = input.rationale.find((r) => !r.track_id)?.reason;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const label = TRACK_ROLE_LABELS[i] ?? "Additional";
      const reason = input.rationale.find((r) => r.track_id === track.id)?.reason;
      await drawTrackCard(pdfDoc, cursor, track, label, reason, fonts);
    }

    // Legacy rows (pre 2026-07-13) stored one shared paragraph with no
    // track_id — still show it rather than silently dropping it.
    if (legacyRationale) {
      drawText(pdfDoc, cursor, "Why this fits you", bold, 11, NAVY);
      cursor.y -= 16;
      drawParagraph(pdfDoc, cursor, legacyRationale, font, 11, INK);
      cursor.y -= 12;
    }
  } else {
    drawParagraph(
      pdfDoc,
      cursor,
      "No Botanical Track has been assigned yet — complete your LIFE Assessment to get matched.",
      italic,
      11,
      MUTED
    );
    cursor.y -= 18;
  }

  // --- Daily Practices ---
  if (input.waterIntakeRecommendation || input.fastingRecommendation) {
    drawSectionHeading(pdfDoc, cursor, "Your Daily Practices", bold);
    const items: { label: string; text: string }[] = [];
    if (input.waterIntakeRecommendation) {
      items.push({ label: "Hydration", text: input.waterIntakeRecommendation });
    }
    if (input.fastingRecommendation) {
      items.push({ label: "Fasting Window", text: input.fastingRecommendation });
    }
    drawPracticeCards(pdfDoc, cursor, items, { bold, font });
  }

  // --- SMS nudge callout — ties the Brief to the ongoing relationship,
  // not just a one-time snapshot ---
  drawSmsCallout(pdfDoc, cursor, Boolean(input.smsOptedIn), { bold, font });

  // --- Closing lifestyle photo ---
  await drawFullWidthImage(pdfDoc, cursor, "lifestyle/product-line.jpg", {
    maxHeight: 170,
  });

  // --- Subscription status ---
  drawSectionHeading(pdfDoc, cursor, "Subscription Status", bold);
  const statusLabel = input.subscriptionStatus ?? "Not yet started";
  const conversionDate = input.conversionDate
    ? new Date(input.conversionDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const statusDateLabel =
    input.subscriptionStatus === "active" ? "Next billing date" : "Subscription begins";
  drawStatusCard(
    pdfDoc,
    cursor,
    capitalize(statusLabel),
    conversionDate ? `${statusDateLabel}: ${conversionDate}` : null,
    { bold, font }
  );

  drawFooters(pdfDoc, font);

  return pdfDoc.save();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------
// Low-level drawing primitives
// ---------------------------------------------------------------------

function ensureSpace(doc: PDFDocument, cursor: Cursor, neededHeight: number) {
  if (cursor.y - neededHeight < BOTTOM_MARGIN) {
    const newPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursor.page = newPage;
    cursor.y = PAGE_HEIGHT - TOP_MARGIN;
    cursor.pageNumber += 1;
  }
}

/** Wraps `text` to fit within `maxWidth`, returning the lines without drawing anything. */
function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  lineHeight = size * 1.4,
  x = MARGIN_X
) {
  ensureSpace(doc, cursor, lineHeight);
  cursor.page.drawText(text, { x, y: cursor.y, size, font, color });
  cursor.y -= lineHeight;
}

/** Wraps `text` to fit the page's content width, drawing line by line and advancing the cursor. Adds a new page when it runs out of vertical room. Does NOT add trailing space after the paragraph — callers add their own gap. */
function drawParagraph(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  maxWidth: number = CONTENT_WIDTH,
  x = MARGIN_X
) {
  const lineHeight = size * 1.45;
  for (const line of wrapLines(text, font, size, maxWidth)) {
    drawText(doc, cursor, line, font, size, color, lineHeight, x);
  }
}

function drawSectionHeading(doc: PDFDocument, cursor: Cursor, text: string, bold: PDFFont) {
  ensureSpace(doc, cursor, 40);
  const bandHeight = 24;
  const bandTopY = cursor.y + 2;
  const bandY = bandTopY - bandHeight;
  cursor.page.drawRectangle({
    x: MARGIN_X - 14,
    y: bandY,
    width: CONTENT_WIDTH + 28,
    height: bandHeight,
    color: CARD_TINT,
  });
  cursor.page.drawText(text.toUpperCase(), {
    x: MARGIN_X,
    y: bandY + 8,
    size: 11.5,
    font: bold,
    color: COPPER,
  });
  cursor.y = bandY - 16;
}

// ---------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------

async function loadPublicImage(relPath: string): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "public", relPath));
}

/** Embeds an image by its actual byte signature rather than trusting the file extension — a couple of assets under /public are PNG bytes saved with a .jpg name. */
async function embedAutoImage(pdfDoc: PDFDocument, bytes: Buffer): Promise<PDFImage> {
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50;
  return isPng ? pdfDoc.embedPng(bytes) : pdfDoc.embedJpg(bytes);
}

/** Draws a bordered, full-content-width image (scaled to fit, never cropped/stretched). Fails soft — a missing/corrupt asset just skips the image rather than failing the whole Brief. */
async function drawFullWidthImage(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  relPath: string,
  opts: { maxHeight?: number } = {}
) {
  try {
    const bytes = await loadPublicImage(relPath);
    const image = await embedAutoImage(pdfDoc, bytes);
    const { width, height } = image.scaleToFit(CONTENT_WIDTH, opts.maxHeight ?? 400);

    ensureSpace(pdfDoc, cursor, height + 18);
    const x = MARGIN_X + (CONTENT_WIDTH - width) / 2;
    cursor.page.drawRectangle({
      x: x - 1,
      y: cursor.y - height - 1,
      width: width + 2,
      height: height + 2,
      borderColor: CARD_BORDER,
      borderWidth: 1,
    });
    cursor.page.drawImage(image, { x, y: cursor.y - height, width, height });
    cursor.y -= height + 18;
  } catch (err) {
    console.error(`LIFE Brief: failed to embed image "${relPath}":`, err);
  }
}

// ---------------------------------------------------------------------
// Composite blocks
// ---------------------------------------------------------------------

function drawPullQuoteBox(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  serifItalic: PDFFont
) {
  const barWidth = 4;
  const padding = 16;
  const textX = MARGIN_X - 12 + barWidth + padding;
  const maxWidth = CONTENT_WIDTH + 24 - barWidth - padding - 12;
  const size = 12.5;
  const lineHeight = size * 1.55;
  const lines = wrapLines(text, serifItalic, size, maxWidth);
  const boxHeight = lines.length * lineHeight + padding * 2;

  ensureSpace(doc, cursor, boxHeight + 18);
  const topY = cursor.y;
  const boxX = MARGIN_X - 12;
  const boxWidth = CONTENT_WIDTH + 24;

  cursor.page.drawRectangle({
    x: boxX,
    y: topY - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: CARD_TINT,
  });
  cursor.page.drawRectangle({
    x: boxX,
    y: topY - boxHeight,
    width: barWidth,
    height: boxHeight,
    color: COPPER,
  });

  let ty = topY - padding - size * 0.85;
  for (const line of lines) {
    cursor.page.drawText(line, { x: textX, y: ty, size, font: serifItalic, color: NAVY });
    ty -= lineHeight;
  }
  cursor.y = topY - boxHeight - 18;
}

async function drawTrackCard(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  track: Track,
  roleLabel: string,
  reason: string | undefined,
  fonts: { bold: PDFFont; font: PDFFont; italic: PDFFont }
) {
  const { bold, font, italic } = fonts;
  const imgTargetWidth = 92;
  const gutter = 16;
  const textX = MARGIN_X + imgTargetWidth + gutter;
  const textMaxWidth = CONTENT_WIDTH - imgTargetWidth - gutter;
  const padding = 16;

  let image: PDFImage | null = null;
  let imgWidth = 0;
  let imgHeight = 0;
  try {
    const bytes = await loadPublicImage(track.image);
    image = await embedAutoImage(pdfDoc, bytes);
    const scaled = image.scaleToFit(imgTargetWidth, 200);
    imgWidth = scaled.width;
    imgHeight = scaled.height;
  } catch (err) {
    console.error(`LIFE Brief: failed to embed packaging photo for ${track.id}:`, err);
  }

  const titleText = `${roleLabel.toUpperCase()} — ${track.name}`;
  const needLines = wrapLines(track.consumerNeed, italic, 10, textMaxWidth);
  const ingredientsLines = wrapLines(
    `Ingredients: ${track.ingredients.join(", ")}`,
    font,
    10,
    textMaxWidth
  );
  const formatLines = wrapLines(`Format: ${track.format}`, font, 10, textMaxWidth);
  const reasonLines = reason ? wrapLines(reason, font, 10, textMaxWidth) : [];

  const titleLH = 17;
  const needLH = 10 * 1.45;
  const bodyLH = 10 * 1.45;

  let textHeight =
    titleLH + needLines.length * needLH + 4 + ingredientsLines.length * bodyLH + formatLines.length * bodyLH;
  if (reasonLines.length > 0) {
    textHeight += 8 + 13 + reasonLines.length * bodyLH;
  }

  const cardHeight = Math.max(imgHeight, textHeight) + padding * 2;
  ensureSpace(pdfDoc, cursor, cardHeight + 16);

  const cardTopY = cursor.y;
  const cardX = MARGIN_X - 12;
  const cardWidth = CONTENT_WIDTH + 24;

  cursor.page.drawRectangle({
    x: cardX,
    y: cardTopY - cardHeight,
    width: cardWidth,
    height: cardHeight,
    color: CARD_TINT,
    borderColor: CARD_BORDER,
    borderWidth: 1,
  });

  if (image) {
    cursor.page.drawImage(image, {
      x: MARGIN_X,
      y: cardTopY - padding - imgHeight,
      width: imgWidth,
      height: imgHeight,
    });
  }

  let ty = cardTopY - padding - 10;
  cursor.page.drawText(titleText, { x: textX, y: ty, size: 13, font: bold, color: COPPER });
  ty -= titleLH;

  for (const line of needLines) {
    cursor.page.drawText(line, { x: textX, y: ty, size: 10, font: italic, color: MUTED });
    ty -= needLH;
  }
  ty -= 4;

  for (const line of ingredientsLines) {
    cursor.page.drawText(line, { x: textX, y: ty, size: 10, font, color: INK });
    ty -= bodyLH;
  }
  for (const line of formatLines) {
    cursor.page.drawText(line, { x: textX, y: ty, size: 10, font, color: INK });
    ty -= bodyLH;
  }

  if (reasonLines.length > 0) {
    ty -= 8;
    cursor.page.drawText("WHY THIS FITS YOU", { x: textX, y: ty, size: 9, font: bold, color: NAVY });
    ty -= 13;
    for (const line of reasonLines) {
      cursor.page.drawText(line, { x: textX, y: ty, size: 10, font, color: INK });
      ty -= bodyLH;
    }
  }

  cursor.y = cardTopY - cardHeight - 16;
}

function drawPracticeCards(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  items: { label: string; text: string }[],
  fonts: { bold: PDFFont; font: PDFFont }
) {
  if (items.length === 0) return;
  const { bold, font } = fonts;
  const gutter = 16;
  const barWidth = 3;
  const padding = 14;
  const colWidth = items.length > 1 ? (CONTENT_WIDTH - gutter) / 2 : CONTENT_WIDTH;
  const textMaxWidth = colWidth - barWidth - padding * 2;
  const bodyLH = 10 * 1.45;

  const wrapped = items.map((it) => wrapLines(it.text, font, 10, textMaxWidth));
  const cardHeight =
    Math.max(...wrapped.map((lines) => 16 + lines.length * bodyLH)) + padding * 2;

  ensureSpace(pdfDoc, cursor, cardHeight + 16);
  const topY = cursor.y;

  items.forEach((it, i) => {
    const x = MARGIN_X + i * (colWidth + gutter);
    cursor.page.drawRectangle({
      x,
      y: topY - cardHeight,
      width: colWidth,
      height: cardHeight,
      color: CARD_TINT,
      borderColor: CARD_BORDER,
      borderWidth: 1,
    });
    cursor.page.drawRectangle({
      x,
      y: topY - cardHeight,
      width: barWidth,
      height: cardHeight,
      color: COPPER,
    });

    const textX = x + barWidth + padding;
    let ty = topY - padding - 9;
    cursor.page.drawText(it.label.toUpperCase(), {
      x: textX,
      y: ty,
      size: 10,
      font: bold,
      color: COPPER,
    });
    ty -= 16;
    for (const line of wrapped[i]) {
      cursor.page.drawText(line, { x: textX, y: ty, size: 10, font, color: INK });
      ty -= bodyLH;
    }
  });

  cursor.y = topY - cardHeight - 18;
}

function drawSmsCallout(
  doc: PDFDocument,
  cursor: Cursor,
  alreadyOptedIn: boolean,
  fonts: { bold: PDFFont; font: PDFFont }
) {
  const { bold, font } = fonts;
  const heading = alreadyOptedIn
    ? "You're getting Sage's daily texts"
    : "Turn today's guidance into a text";
  const body = alreadyOptedIn
    ? "Sage sends one short nudge a day, straight from the hydration and fasting guidance above, so it's easier to actually use. Manage it any time from your Protocol Dashboard, or reply STOP to any message to opt out."
    : "Opt in from your Protocol Dashboard and Sage will text you one short, doable nudge each day, straight from the hydration and fasting guidance above, so it's easier to actually use. Reply STOP any time to opt out.";

  const padding = 16;
  const maxWidth = CONTENT_WIDTH + 24 - padding * 2;
  const bodySize = 10.5;
  const bodyLH = bodySize * 1.5;
  const lines = wrapLines(body, font, bodySize, maxWidth);
  const boxHeight = 20 + lines.length * bodyLH + padding * 2;

  ensureSpace(doc, cursor, boxHeight + 18);
  const topY = cursor.y;
  const boxX = MARGIN_X - 12;
  const boxWidth = CONTENT_WIDTH + 24;

  cursor.page.drawRectangle({
    x: boxX,
    y: topY - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: NAVY,
  });

  let ty = topY - padding - 12;
  cursor.page.drawText(heading, { x: MARGIN_X, y: ty, size: 13, font: bold, color: COPPER });
  ty -= 20;
  for (const line of lines) {
    cursor.page.drawText(line, { x: MARGIN_X, y: ty, size: bodySize, font, color: rgb(0.92, 0.92, 0.94) });
    ty -= bodyLH;
  }

  cursor.y = topY - boxHeight - 18;
}

function drawStatusCard(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  statusLabel: string,
  dateLine: string | null,
  fonts: { bold: PDFFont; font: PDFFont }
) {
  const { bold, font } = fonts;
  const padding = 16;
  const cardHeight = dateLine ? 66 : 46;

  ensureSpace(pdfDoc, cursor, cardHeight + 10);
  const topY = cursor.y;
  const boxX = MARGIN_X - 12;
  const boxWidth = CONTENT_WIDTH + 24;

  cursor.page.drawRectangle({
    x: boxX,
    y: topY - cardHeight,
    width: boxWidth,
    height: cardHeight,
    color: CARD_TINT,
    borderColor: CARD_BORDER,
    borderWidth: 1,
  });

  cursor.page.drawText(`Status: ${statusLabel}`, {
    x: MARGIN_X,
    y: topY - padding - 10,
    size: 13,
    font: bold,
    color: COPPER,
  });
  if (dateLine) {
    cursor.page.drawText(dateLine, {
      x: MARGIN_X,
      y: topY - padding - 32,
      size: 11,
      font,
      color: INK,
    });
  }

  cursor.y = topY - cardHeight - 10;
}

/**
 * Draws the real brand lockup (public/branding/logo-light.png) at the top
 * of the report, followed by a copper rule and a "YOUR LIFE BRIEF" eyebrow
 * line with the subscriber's email. Returns the y-coordinate right below
 * the header, so the caller knows where body content can start.
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
  const LOGO_WIDTH = 170;
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
  page.drawText("YOUR LIFE BRIEF", {
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

function drawFooters(doc: PDFDocument, font: PDFFont) {
  const pages = doc.getPages();
  const disclaimer =
    "Supplement :: LIFE provides personalized wellness information, not medical advice, a diagnosis, or a treatment plan. Talk to your healthcare provider before starting any new supplement, especially if you have a medical condition, take prescription medication, or are pregnant or nursing.";

  pages.forEach((page, i) => {
    const lines = wrapLines(disclaimer, font, 7.5, CONTENT_WIDTH);
    let y = 40;

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

    // Sits in its own row above the (possibly 2-line) disclaimer rather
    // than sharing a row with it — sharing a row let long wrapped
    // disclaimer text visually collide with the page number.
    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: PAGE_WIDTH - MARGIN_X - 60,
      y: 40 + lines.length * 10 + 2,
      size: 7.5,
      font,
      color: MUTED,
    });
  });
}
