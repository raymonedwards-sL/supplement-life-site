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
import { segmentText } from "@/lib/text/botanical-terms";
import {
  buildLifeRevelationProps,
  buildLifeIndexProps,
  buildPatternMapProps,
  buildTrackCardProps,
  buildDailyRhythmProps,
  buildRoadmapProps,
  buildProgressComparisonProps,
  type LifeBriefContext,
  type TrackAssignmentRow,
} from "@/lib/life-brief/adapter";
import type {
  LifeRevelationProps,
  LifeIndexProps,
  PatternMapProps,
  TrackCardProps,
  DailyRhythmProps,
  RhythmBlock,
  RoadmapProps,
  ProgressComparisonProps,
} from "@/lib/life-brief/types";

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

const TIER_LABELS: Record<TrackCardProps["tier"], string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
};

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

type BriefFonts = {
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
};

/**
 * Report content beyond `email`/`currentSummary`/subscription fields is
 * sourced from the same `LifeBriefContext` + row(s) that
 * lib/life-brief/adapter.ts's builder functions feed to /dashboard/brief —
 * one source of truth for both renderers, added 2026-07-26 so this PDF can
 * carry the same LIFE Revelation/Index/Pattern Map/Roadmap/Progress
 * Comparison sections the web report already has, without re-deriving the
 * scoring-engine math a second time. `oldestRow` is optional — Progress
 * Comparison only renders when a caller has (and passes) a real prior
 * sitting to compare against.
 */
export type LifeBriefInput = {
  email: string;
  currentSummary: string | null;
  ctx: LifeBriefContext;
  newestRow: TrackAssignmentRow;
  oldestRow?: TrackAssignmentRow;
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
    drawPullQuoteBox(pdfDoc, cursor, input.currentSummary, serifItalic, serifBold);
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

  // --- LIFE Revelation / LIFE Index / Pattern Map — same adapter builder
  // functions app/dashboard/brief/page.tsx uses; each renders only when
  // its builder returns real (non-null) data, same contract as the web
  // page. ---
  const { ctx } = input;
  const lifeRevelation = buildLifeRevelationProps(ctx);
  if (lifeRevelation) {
    drawLifeRevelation(pdfDoc, cursor, lifeRevelation, fonts);
  }

  const lifeIndex = buildLifeIndexProps(ctx, input.newestRow, input.oldestRow);
  if (lifeIndex) {
    drawLifeIndex(pdfDoc, cursor, lifeIndex, fonts);
  }

  const patternMap = buildPatternMapProps(ctx);
  if (
    patternMap &&
    (patternMap.observed.length > 0 || patternMap.uncertain.length > 0 || patternMap.monitoring.length > 0)
  ) {
    drawPatternMap(pdfDoc, cursor, patternMap, fonts);
  }

  // --- Botanical Track(s) ---
  drawSectionHeading(pdfDoc, cursor, "Your Botanical Track(s)", bold);
  const trackCards = buildTrackCardProps(ctx);

  if (trackCards.length > 0) {
    for (const card of trackCards) {
      await drawTrackCard(pdfDoc, cursor, card, fonts);
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

  // --- Daily LIFE Rhythm — replaces the old flat hydration/fasting
  // cards; buildDailyRhythmProps already folds water/fasting guidance
  // into the Wake / Midday Stability blocks, so showing both would
  // repeat the same guidance under two headings. ---
  drawDailyRhythm(pdfDoc, cursor, buildDailyRhythmProps(ctx), fonts);

  // --- 90-Day Roadmap ---
  drawRoadmap(pdfDoc, cursor, buildRoadmapProps(ctx), fonts);

  // --- Then vs. Now — only when a real prior sitting was passed in and
  // there's enough real data on both rows to compare. ---
  if (input.oldestRow) {
    const progressComparison = buildProgressComparisonProps(input.oldestRow, input.newestRow);
    if (progressComparison) {
      drawProgressComparison(pdfDoc, cursor, progressComparison, fonts);
    }
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

// ---------------------------------------------------------------------
// Rich (bold-aware) text — Track/ingredient names bold, 2026-07-25
// founder request ("recallability, education and branding"). pdf-lib has
// no concept of an inline style run within a single drawn string, so
// unlike the React side (components/BoldBotanicals.tsx, which just
// wraps matched substrings in <strong>), bolding here requires
// tokenizing each paragraph into words tagged bold/not-bold BEFORE
// wrapping (word-width math must use the correct font per word), then
// drawing each line word-by-word, advancing the x cursor by that word's
// own font metrics. Shares lib/text/botanical-terms.ts's segmentText()
// with the web renderer for "which words are bold" — only the drawing
// step is duplicated, because it has to be.
// ---------------------------------------------------------------------

/** `spaceBefore` tracks whether whitespace actually separated this token
 * from the previous one in the source text — needed because segmentText
 * splits on bold-term boundaries, not whitespace, so a bold term glued
 * directly to trailing punctuation (e.g. "Restore's", "dock:") is a
 * segment boundary with NO space in the original string. Without this,
 * drawRichLine used to insert a space at every segment boundary
 * unconditionally, producing phantom spaces like "Restore 's" / "dock :"
 * (found 2026-07-26 generating a real test PDF against the new Track
 * Card / benchmark sections, which lean on rich text far more than the
 * original single-rationale-string design did). */
type RichToken = { text: string; bold: boolean; spaceBefore: boolean };

function tokenizeRich(text: string): RichToken[] {
  const tokens: RichToken[] = [];
  let pendingSpace = false;
  for (const seg of segmentText(text)) {
    for (const part of seg.text.split(/(\s+)/)) {
      if (part === "") continue;
      if (/^\s+$/.test(part)) {
        pendingSpace = true;
        continue;
      }
      tokens.push({ text: part, bold: seg.bold, spaceBefore: pendingSpace });
      pendingSpace = false;
    }
  }
  return tokens;
}

/** Same wrapping algorithm as wrapLines(), but measures each word with
 * its own (regular vs. bold) font before deciding whether it fits, and
 * only reserves space for a gap when the source text actually had one
 * (see RichToken.spaceBefore). */
function wrapRichLines(
  text: string,
  font: PDFFont,
  boldFont: PDFFont,
  size: number,
  maxWidth: number
): RichToken[][] {
  const tokens = tokenizeRich(text);
  const spaceWidth = font.widthOfTextAtSize(" ", size);
  const lines: RichToken[][] = [];
  let current: RichToken[] = [];
  let currentWidth = 0;

  for (const token of tokens) {
    const tokenWidth = (token.bold ? boldFont : font).widthOfTextAtSize(token.text, size);
    const gap = current.length > 0 && token.spaceBefore ? spaceWidth : 0;
    const addedWidth = gap + tokenWidth;
    if (currentWidth + addedWidth > maxWidth && current.length > 0) {
      lines.push(current);
      // A token that wraps to a new line never needs a leading space.
      current = [{ ...token, spaceBefore: false }];
      currentWidth = tokenWidth;
    } else {
      current.push(token);
      currentWidth += addedWidth;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

/** Draws one already-wrapped line word-by-word, switching fonts per
 * word so bold Track/ingredient names render bold inline with regular
 * text — pdf-lib's page.drawText() only ever takes one font per call,
 * so a "line" here isn't a single draw call the way plain drawText() is. */
function drawRichLine(
  page: PDFPage,
  line: RichToken[],
  x: number,
  y: number,
  font: PDFFont,
  boldFont: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>
) {
  const spaceWidth = font.widthOfTextAtSize(" ", size);
  let cx = x;
  line.forEach((token, i) => {
    const tokenFont = token.bold ? boldFont : font;
    if (i > 0 && token.spaceBefore) cx += spaceWidth;
    page.drawText(token.text, { x: cx, y, size, font: tokenFont, color });
    cx += tokenFont.widthOfTextAtSize(token.text, size);
  });
}

/** Bold-aware counterpart to drawParagraph() — same wrapping/cursor
 * behavior, but Track and ingredient names within `text` draw with
 * `boldFont` instead of `font`. */
function drawRichParagraph(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  font: PDFFont,
  boldFont: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  maxWidth: number = CONTENT_WIDTH,
  x = MARGIN_X
) {
  const lineHeight = size * 1.45;
  for (const line of wrapRichLines(text, font, boldFont, size, maxWidth)) {
    ensureSpace(doc, cursor, lineHeight);
    drawRichLine(cursor.page, line, x, cursor.y, font, boldFont, size, color);
    cursor.y -= lineHeight;
  }
}

/** Rich (bold-aware), dot-bulleted list — one item per bullet, each
 * independently wrapped and paginated via ensureSpace. Shared by every
 * new report section below (LIFE Revelation's supporting signals, LIFE
 * Index's strengths/frictions/benchmarks, Pattern Map's buckets, the
 * Roadmap's milestones, Progress Comparison's whatChanged). Not used
 * inside drawTrackCard, which pre-computes one fixed card height up
 * front and draws onto it directly — this helper's per-line ensureSpace
 * would fight that fixed-height card background. */
function drawBulletList(
  doc: PDFDocument,
  cursor: Cursor,
  items: string[],
  font: PDFFont,
  boldFont: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  opts: { maxWidth?: number; x?: number; dotColor?: ReturnType<typeof rgb> } = {}
) {
  const x = opts.x ?? MARGIN_X;
  const dotIndent = 12;
  const textX = x + dotIndent;
  const maxWidth = (opts.maxWidth ?? CONTENT_WIDTH) - dotIndent;
  const lineHeight = size * 1.45;
  const dotColor = opts.dotColor ?? COPPER;

  for (const item of items) {
    const lines = wrapRichLines(item, font, boldFont, size, maxWidth);
    lines.forEach((line, i) => {
      ensureSpace(doc, cursor, lineHeight);
      if (i === 0) {
        cursor.page.drawEllipse({
          x: x + 3,
          y: cursor.y + size * 0.35,
          xScale: 2,
          yScale: 2,
          color: dotColor,
        });
      }
      drawRichLine(cursor.page, line, textX, cursor.y, font, boldFont, size, color);
      cursor.y -= lineHeight;
    });
  }
}

/** Two side-by-side bulleted lists sharing one fixed card height,
 * computed up front — same precomputed-height pattern as the old
 * drawPracticeCards (which this doesn't replace; that section is gone,
 * but the two-column layout it established is reused here for LIFE
 * Index's Top Strengths / Top Frictions). */
function drawTwoColumnLists(
  doc: PDFDocument,
  cursor: Cursor,
  columns: { heading: string; items: string[] }[],
  fonts: BriefFonts
) {
  const { bold, font } = fonts;
  const gutter = 24;
  const colWidth = (CONTENT_WIDTH - gutter) / 2;
  const bodySize = 10;
  const bodyLH = bodySize * 1.45;
  const dotIndent = 12;

  const wrappedColumns = columns.map((col) =>
    col.items.map((item) => wrapRichLines(item, font, bold, bodySize, colWidth - dotIndent))
  );
  const colHeights = wrappedColumns.map(
    (lines) => 16 + lines.reduce((sum, l) => sum + l.length * bodyLH, 0)
  );
  const blockHeight = Math.max(...colHeights);

  ensureSpace(doc, cursor, blockHeight + 18);
  const topY = cursor.y;

  columns.forEach((col, ci) => {
    const x = MARGIN_X + ci * (colWidth + gutter);
    let ty = topY;
    cursor.page.drawText(col.heading.toUpperCase(), { x, y: ty, size: 9.5, font: bold, color: COPPER });
    ty -= 16;
    wrappedColumns[ci].forEach((lines) => {
      lines.forEach((line, li) => {
        if (li === 0) {
          cursor.page.drawEllipse({ x: x + 3, y: ty + bodySize * 0.35, xScale: 2, yScale: 2, color: COPPER });
        }
        drawRichLine(cursor.page, line, x + dotIndent, ty, font, bold, bodySize, INK);
        ty -= bodyLH;
      });
    });
  });

  cursor.y = topY - blockHeight - 18;
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
  serifItalic: PDFFont,
  serifBold: PDFFont
) {
  const barWidth = 4;
  const padding = 16;
  const textX = MARGIN_X - 12 + barWidth + padding;
  const maxWidth = CONTENT_WIDTH + 24 - barWidth - padding - 12;
  const size = 12.5;
  const lineHeight = size * 1.55;
  // Bold-aware: Track/ingredient names Sage mentions in this freeform
  // summary render in serifBold rather than staying italic — same
  // Times family, so "bold breaks italic" here reads as emphasis, not
  // a font mismatch.
  const lines = wrapRichLines(text, serifItalic, serifBold, size, maxWidth);
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
    drawRichLine(cursor.page, line, textX, ty, serifItalic, serifBold, size, NAVY);
    ty -= lineHeight;
  }
  cursor.y = topY - boxHeight - 18;
}

// ---------------------------------------------------------------------
// LIFE Revelation / LIFE Index / Pattern Map — mirror
// app/dashboard/brief/page.tsx's section set, fed by the same
// lib/life-brief/adapter.ts builder functions.
// ---------------------------------------------------------------------

function drawLifeRevelation(pdfDoc: PDFDocument, cursor: Cursor, props: LifeRevelationProps, fonts: BriefFonts) {
  const { bold, font, serifBold } = fonts;
  drawSectionHeading(pdfDoc, cursor, "Your LIFE Revelation", bold);

  drawText(pdfDoc, cursor, props.dominantPattern, serifBold, 18, NAVY, 24);
  cursor.y -= 4;
  drawParagraph(pdfDoc, cursor, props.sageInterpretation, font, 11, INK);
  cursor.y -= 10;

  drawBulletList(pdfDoc, cursor, props.supportingSignals, font, bold, 10.5, INK);
  cursor.y -= 6;

  drawText(pdfDoc, cursor, props.ninetyDayCta, bold, 11, COPPER, 18);
  cursor.y -= 12;
}

function drawLifeIndex(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  props: LifeIndexProps,
  fonts: BriefFonts
) {
  const { bold, font, italic, serifBold } = fonts;
  drawSectionHeading(pdfDoc, cursor, "Your LIFE Index", bold);

  if (props.vitalityIndex != null) {
    drawText(pdfDoc, cursor, `${props.vitalityIndex}/100`, serifBold, 30, COPPER, 38);
  } else {
    drawText(pdfDoc, cursor, "Still building your picture", serifBold, 16, NAVY, 22);
  }
  drawParagraph(pdfDoc, cursor, props.vitalityIndexDisclaimer, italic, 9, MUTED);
  cursor.y -= 10;

  drawTwoColumnLists(
    pdfDoc,
    cursor,
    [
      { heading: "Top strengths", items: props.topStrengths },
      { heading: "Top frictions", items: props.topFrictions },
    ],
    fonts
  );

  const matchNames = [props.trackMatches.primary, props.trackMatches.secondary, props.trackMatches.tertiary]
    .filter((id): id is string => Boolean(id))
    .map((id) => findTrack(id)?.name ?? id);
  if (matchNames.length > 0) {
    drawParagraph(pdfDoc, cursor, `Track matches: ${matchNames.join(", ")}`, font, 10.5, INK);
    cursor.y -= 6;
  }

  drawParagraph(pdfDoc, cursor, props.momentumBehavior, font, 10.5, INK);
  cursor.y -= 10;

  if (props.benchmarks.length > 0) {
    drawText(pdfDoc, cursor, "SELF-BASELINE BENCHMARKS", bold, 9.5, COPPER, 14);
    drawBulletList(
      pdfDoc,
      cursor,
      props.benchmarks.map(
        (b) => `${b.metric}: ${b.current}/100 (personal baseline ${b.personalBaseline}/100). ${b.thirtyDayTarget}.`
      ),
      font,
      bold,
      10,
      INK
    );
  }
  cursor.y -= 8;
}

function drawPatternMap(pdfDoc: PDFDocument, cursor: Cursor, props: PatternMapProps, fonts: BriefFonts) {
  const { bold, font } = fonts;
  drawSectionHeading(pdfDoc, cursor, "Your Personal Pattern Map", bold);

  if (props.chain.length > 0) {
    // pdf-lib's StandardFonts use WinAnsi encoding, which has no glyph
    // for "→" (unlike the web UI's PatternMap.tsx, which can rely on the
    // browser's font stack) — "->" is the ASCII-safe equivalent.
    drawParagraph(pdfDoc, cursor, props.chain.join("   ->   "), bold, 10.5, NAVY);
    cursor.y -= 10;
  }

  const buckets: { label: string; items: string[] }[] = [
    { label: "What Sage observed", items: props.observed },
    { label: "What remains uncertain", items: props.uncertain },
    { label: "What Sage is monitoring", items: props.monitoring },
  ];
  for (const bucket of buckets) {
    if (bucket.items.length === 0) continue;
    drawText(pdfDoc, cursor, bucket.label.toUpperCase(), bold, 9.5, COPPER, 14);
    drawBulletList(pdfDoc, cursor, bucket.items, font, bold, 10, INK);
    cursor.y -= 6;
  }
}

/**
 * Renders the full TrackCardProps set — matches
 * components/life-brief/TrackCard.tsx's field set (whySelected as 3
 * bullets, plus what-you-may-observe/not-intended-for/precautions/
 * reconsider-conditions as labeled mini-sections), not just the single
 * rationale string this used to draw. `evidenceStrength` is
 * deliberately never rendered here either — same reasoning as
 * TrackCard.tsx's own comment: it's always "blocked" pending the
 * Claims/Evidence Library, and a "Pending Evidence Review" badge isn't
 * something a paying subscriber should see.
 */
async function drawTrackCard(
  pdfDoc: PDFDocument,
  cursor: Cursor,
  card: TrackCardProps,
  fonts: { bold: PDFFont; font: PDFFont; italic: PDFFont }
) {
  const track = findTrack(card.track);
  if (!track) return;

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

  const titleText = `${TIER_LABELS[card.tier].toUpperCase()} — ${track.name}`;
  const needLines = wrapLines(track.consumerNeed, italic, 10, textMaxWidth);
  // Rich (bold-aware): these name specific ingredients or Track names —
  // see the "Rich (bold-aware) text" section above for why this needs a
  // separate word-by-word wrap+draw path rather than the plain
  // wrapLines()/drawText() used for needLines below (which don't
  // mention them).
  const ingredientsLines = wrapRichLines(`Ingredients: ${card.ingredients.join(", ")}`, font, bold, 10, textMaxWidth);
  const formatLines = wrapLines(`Format: ${card.timingAndFormat}`, font, 10, textMaxWidth);
  const whySelectedLines = card.whySelected.map((reason) => wrapRichLines(reason, font, bold, 10, textMaxWidth - 12));
  const observeLines = wrapLines(card.whatYouMayObserve, font, 9.5, textMaxWidth);
  const notForLines = wrapLines(card.whatItIsNotFor, font, 9.5, textMaxWidth);
  const precautionsLines =
    card.precautions.length > 0 ? wrapRichLines(card.precautions.join(" "), font, bold, 9.5, textMaxWidth) : [];
  const reconsiderLines =
    card.reconsiderConditions.length > 0 ? wrapLines(card.reconsiderConditions.join(" "), font, 9.5, textMaxWidth) : [];

  const titleLH = 17;
  const needLH = 10 * 1.45;
  const bodyLH = 10 * 1.45;
  const smallLH = 9.5 * 1.45;

  let textHeight =
    titleLH + needLines.length * needLH + 4 + ingredientsLines.length * bodyLH + formatLines.length * bodyLH;
  textHeight += 8 + 13 + whySelectedLines.reduce((sum, lines) => sum + lines.length * bodyLH, 0);
  textHeight += 8 + 12 + observeLines.length * smallLH;
  textHeight += 6 + 12 + notForLines.length * smallLH;
  if (precautionsLines.length > 0) textHeight += 6 + 12 + precautionsLines.length * smallLH;
  if (reconsiderLines.length > 0) textHeight += 6 + 12 + reconsiderLines.length * smallLH;

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
    drawRichLine(cursor.page, line, textX, ty, font, bold, 10, INK);
    ty -= bodyLH;
  }
  for (const line of formatLines) {
    cursor.page.drawText(line, { x: textX, y: ty, size: 10, font, color: INK });
    ty -= bodyLH;
  }

  ty -= 8;
  cursor.page.drawText("WHY THIS FITS YOU", { x: textX, y: ty, size: 9, font: bold, color: NAVY });
  ty -= 13;
  for (const lines of whySelectedLines) {
    lines.forEach((line, i) => {
      if (i === 0) {
        cursor.page.drawEllipse({ x: textX + 3, y: ty + 3.5, xScale: 1.8, yScale: 1.8, color: COPPER });
      }
      drawRichLine(cursor.page, line, textX + 12, ty, font, bold, 10, INK);
      ty -= bodyLH;
    });
  }

  ty -= 8;
  cursor.page.drawText("WHAT YOU MAY OBSERVE", { x: textX, y: ty, size: 9, font: bold, color: NAVY });
  ty -= 12;
  for (const line of observeLines) {
    cursor.page.drawText(line, { x: textX, y: ty, size: 9.5, font, color: INK });
    ty -= smallLH;
  }

  ty -= 6;
  cursor.page.drawText("NOT INTENDED FOR", { x: textX, y: ty, size: 9, font: bold, color: NAVY });
  ty -= 12;
  for (const line of notForLines) {
    cursor.page.drawText(line, { x: textX, y: ty, size: 9.5, font, color: MUTED });
    ty -= smallLH;
  }

  if (precautionsLines.length > 0) {
    ty -= 6;
    cursor.page.drawText("PRECAUTIONS", { x: textX, y: ty, size: 9, font: bold, color: NAVY });
    ty -= 12;
    for (const line of precautionsLines) {
      drawRichLine(cursor.page, line, textX, ty, font, bold, 9.5, MUTED);
      ty -= smallLH;
    }
  }

  if (reconsiderLines.length > 0) {
    ty -= 6;
    cursor.page.drawText("WE'D REVISIT THIS IF", { x: textX, y: ty, size: 9, font: bold, color: NAVY });
    ty -= 12;
    for (const line of reconsiderLines) {
      cursor.page.drawText(line, { x: textX, y: ty, size: 9.5, font, color: MUTED });
      ty -= smallLH;
    }
  }

  cursor.y = cardTopY - cardHeight - 16;
}

// Every optional narrative field a RhythmBlock can carry, in the order
// checked — most populated blocks only ever set exactly one of these
// (see lib/life-brief/adapter.ts's buildDailyRhythmProps), but checking
// all of them (rather than hardcoding which field belongs to which
// timeOfDay) keeps this in sync with the type without this file needing
// its own copy of that mapping.
const RHYTHM_DETAIL_FIELDS: (keyof RhythmBlock)[] = [
  "hydrationCue",
  "botanicalTiming",
  "mealRhythm",
  "nutritionCue",
  "movement",
  "caffeineBoundary",
  "recoveryPractice",
  "sageCheckIn",
];

// Mirrors DailyRhythm.tsx's CUE_FIELDS labels — only used when a block
// carries more than one populated field (see drawDailyRhythm below), so a
// reader can tell which line is which. A single-field block still reads
// as plain prose with no label, same as before.
const RHYTHM_DETAIL_LABELS: Partial<Record<keyof RhythmBlock, string>> = {
  botanicalTiming: "Botanical",
  hydrationCue: "Hydration",
  mealRhythm: "Meals",
  nutritionCue: "Nutrition",
  movement: "Movement",
  caffeineBoundary: "Caffeine",
  recoveryPractice: "Recovery",
  sageCheckIn: "Sage check-in",
};

/** P3-6 — the full ordered wake-to-sleep timeline, replacing the old
 * flat "Your Daily Practices" hydration/fasting cards (those values now
 * live inside the Wake / Midday Stability blocks here, via
 * buildDailyRhythmProps — showing them twice under two headings would
 * just repeat the same guidance). A block with no populated field is
 * skipped rather than shown empty.
 *
 * Draws every populated field on a block, not just the first — Midday
 * Stability now carries both mealRhythm and nutritionCue (2026-07-25),
 * and taking only the first match would have silently dropped nutrition
 * guidance from the PDF while it still showed on the web report. */
function drawDailyRhythm(pdfDoc: PDFDocument, cursor: Cursor, props: DailyRhythmProps, fonts: BriefFonts) {
  const { bold, font, italic } = fonts;
  drawSectionHeading(pdfDoc, cursor, "Your Daily LIFE Rhythm", bold);

  for (const block of props.blocks) {
    const details = RHYTHM_DETAIL_FIELDS
      .map((field) => ({ field, value: block[field] }))
      .filter((d): d is { field: keyof RhythmBlock; value: string } => Boolean(d.value));
    if (details.length === 0) continue;
    drawText(pdfDoc, cursor, block.label, bold, 11, COPPER, 15);
    for (const { field, value } of details) {
      const label = details.length > 1 ? RHYTHM_DETAIL_LABELS[field] : undefined;
      drawRichParagraph(pdfDoc, cursor, label ? `${label}: ${value}` : value, font, bold, 10.5, INK);
    }
    cursor.y -= 8;
  }

  if (props.lifestyleCompatibilityNote) {
    drawParagraph(pdfDoc, cursor, props.lifestyleCompatibilityNote, italic, 9.5, MUTED);
    cursor.y -= 8;
  }
}

/** P3-7 — the 3 fixed Stabilize/Build/Personalize phases plus the
 * weekly check-in's priority marker question (the other 7 rotating
 * questions aren't listed verbatim — too much for a print page, and the
 * priority question is the one the report should foreground). */
function drawRoadmap(pdfDoc: PDFDocument, cursor: Cursor, props: RoadmapProps, fonts: BriefFonts) {
  const { bold, font, italic } = fonts;
  drawSectionHeading(pdfDoc, cursor, "Your 90-Day Roadmap", bold);

  for (const phase of props.phases) {
    const padding = 14;
    const barWidth = 3;
    const textX = MARGIN_X + barWidth + padding;
    const textMaxWidth = CONTENT_WIDTH - barWidth - padding * 2;
    const headingLH = 15;
    const bodyLH = 10 * 1.45;
    const dotIndent = 12;

    const focusLines = wrapLines(phase.focus, font, 10, textMaxWidth);
    const milestoneLines = phase.milestones.map((m) => wrapLines(m, font, 10, textMaxWidth - dotIndent));
    const cardHeight =
      headingLH +
      focusLines.length * bodyLH +
      6 +
      milestoneLines.reduce((sum, lines) => sum + lines.length * bodyLH, 0) +
      padding * 2;

    ensureSpace(pdfDoc, cursor, cardHeight + 12);
    const topY = cursor.y;
    const cardX = MARGIN_X - 12;
    const cardWidth = CONTENT_WIDTH + 24;

    cursor.page.drawRectangle({
      x: cardX,
      y: topY - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: CARD_TINT,
      borderColor: CARD_BORDER,
      borderWidth: 1,
    });
    cursor.page.drawRectangle({ x: cardX, y: topY - cardHeight, width: barWidth, height: cardHeight, color: COPPER });

    let ty = topY - padding - 10;
    cursor.page.drawText(`${phase.label.toUpperCase()} — ${phase.dayRange}`, {
      x: textX,
      y: ty,
      size: 12,
      font: bold,
      color: COPPER,
    });
    ty -= headingLH;

    for (const line of focusLines) {
      cursor.page.drawText(line, { x: textX, y: ty, size: 10, font, color: INK });
      ty -= bodyLH;
    }
    ty -= 6;

    milestoneLines.forEach((lines) => {
      lines.forEach((line, i) => {
        if (i === 0) {
          cursor.page.drawEllipse({ x: textX + 3, y: ty + 3.5, xScale: 1.8, yScale: 1.8, color: COPPER });
        }
        cursor.page.drawText(line, { x: textX + dotIndent, y: ty, size: 10, font, color: INK });
        ty -= bodyLH;
      });
    });

    cursor.y = topY - cardHeight - 12;
  }

  cursor.y -= 4;
  drawText(pdfDoc, cursor, "Weekly check-in", bold, 10.5, NAVY, 15);
  drawParagraph(
    pdfDoc,
    cursor,
    `${props.weeklyCheckIn.priorityMarkerQuestion} (plus a short rotating set of check-in questions each week.)`,
    italic,
    10,
    MUTED
  );
  cursor.y -= 10;
}

/** P3-9 — only ever called when a real prior sitting exists; see the
 * `oldestRow` gating in buildLifeBriefPdf. */
function drawProgressComparison(pdfDoc: PDFDocument, cursor: Cursor, props: ProgressComparisonProps, fonts: BriefFonts) {
  const { bold, font } = fonts;
  drawSectionHeading(pdfDoc, cursor, "Then vs. Now", bold);

  const snapshotLine = (snap: ProgressComparisonProps["then"]) => {
    const indexText = snap.vitalityIndex != null ? `${snap.vitalityIndex}/100` : "still building";
    const topBenchmark = snap.topBenchmarks[0];
    return topBenchmark
      ? `${snap.dayLabel}: LIFE Index ${indexText} — ${topBenchmark.metric}: ${topBenchmark.current}`
      : `${snap.dayLabel}: LIFE Index ${indexText}`;
  };

  drawParagraph(pdfDoc, cursor, snapshotLine(props.then), font, 10.5, INK);
  cursor.y -= 4;
  drawParagraph(pdfDoc, cursor, snapshotLine(props.now), bold, 10.5, NAVY);
  cursor.y -= 10;

  if (props.whatChanged.length > 0) {
    drawText(pdfDoc, cursor, "WHAT CHANGED", bold, 9.5, COPPER, 14);
    drawBulletList(pdfDoc, cursor, props.whatChanged, font, bold, 10, INK);
    cursor.y -= 6;
  }

  drawParagraph(pdfDoc, cursor, props.sageRecommendsNext, font, 10.5, INK);
  cursor.y -= 10;
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
