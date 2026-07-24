/**
 * Shared "which words are botanical/Track names" logic (founder request,
 * 2026-07-25): wherever a Botanical Track name (lib/tracks.ts) or an
 * ingredient name (lib/ingredient-education.ts) appears inside prose —
 * Sage's live intake chat, the LIFE Brief report (web + PDF), and the
 * dashboard — it should render in bold, for recallability, education,
 * and branding.
 *
 * This module is pure text logic with no React/pdf-lib dependency, so it
 * can be shared by both rendering paths:
 *   - components/BoldBotanicals.tsx wraps this for JSX (`<strong>`)
 *   - lib/pdf/life-brief.ts uses this directly to decide which words to
 *     draw with the bold font, since pdf-lib has no inline style runs.
 *
 * Word list is derived at runtime from the two real catalogs (TRACKS,
 * INGREDIENT_EDUCATION) rather than hardcoded here, so it can never drift
 * out of sync with what's actually in the product.
 *
 * Known tradeoff: a few Track names are common English words on their
 * own (e.g. "Reset", "Vitality", "Immunity"). Matching is intentionally
 * broad per the founder's "across our entire site" instruction — the
 * risk of occasionally bolding a generic use of a word that's also a
 * Track name is accepted in favor of consistent brand recallability.
 */
import { TRACKS } from "@/lib/tracks";
import { INGREDIENT_EDUCATION } from "@/lib/ingredient-education";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let cachedTerms: string[] | null = null;

/** All Track names + canonical ingredient names, longest-first so a
 * multi-word name (e.g. "Yellow Dock") is matched whole rather than a
 * shorter term winning first. */
export function getBotanicalTerms(): string[] {
  if (cachedTerms) return cachedTerms;
  const trackNames = TRACKS.map((t) => t.name);
  const ingredientNames = Object.values(INGREDIENT_EDUCATION).map((e) => e.name);
  const all = Array.from(new Set([...trackNames, ...ingredientNames]));
  cachedTerms = all.sort((a, b) => b.length - a.length);
  return cachedTerms;
}

let cachedPattern: RegExp | null = null;

/**
 * Builds one alternation pattern covering every term, with a per-term
 * boundary check instead of a single wrapping `\b(...)`  — several terms
 * end in a non-word character (e.g. "Ashwagandha (KSM-66)", "Longjack
 * (Tongkat Ali)"), and `\b` fails to match at a position between two
 * non-word characters (e.g. ")" followed by a space), which would have
 * silently broken matching for every parenthetical ingredient name.
 */
function getPattern(): RegExp {
  if (cachedPattern) return cachedPattern;
  const pieces = getBotanicalTerms().map((term) => {
    const escaped = escapeRegExp(term);
    const startsWithWordChar = /^[A-Za-z0-9]/.test(term);
    const endsWithWordChar = /[A-Za-z0-9]$/.test(term);
    const prefix = startsWithWordChar ? "(?<![A-Za-z0-9])" : "";
    const suffix = endsWithWordChar ? "(?![A-Za-z0-9])" : "";
    return `${prefix}${escaped}${suffix}`;
  });
  cachedPattern = new RegExp(pieces.join("|"), "gi");
  return cachedPattern;
}

export type TextSegment = { text: string; bold: boolean };

/**
 * Splits `text` into an ordered list of segments that together
 * reconstruct the original string exactly, tagging any substring that
 * matches a known Track or ingredient name as `bold: true`. Preserves
 * the original casing/whitespace of the source text — never rewrites
 * content, only marks which ranges should render bold.
 */
export function segmentText(text: string): TextSegment[] {
  if (!text) return [{ text, bold: false }];
  const pattern = getPattern();
  pattern.lastIndex = 0;
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index === pattern.lastIndex) {
      // Zero-length match safety net — shouldn't happen with this term
      // list, but avoids an infinite loop if it ever does.
      pattern.lastIndex += 1;
      continue;
    }
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[0], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }
  return segments.length > 0 ? segments : [{ text, bold: false }];
}
