/**
 * `track_assignments.rationale` is a plain `text` column (see
 * supabase/migrations/0001_init.sql) — no migration needed to change its
 * shape, since Postgres `text` happily holds a JSON-encoded string.
 *
 * As of 2026-07-13, Sage returns rationale as a per-track array
 * (`TrackRationale[]`, JSON-encoded before insert) instead of one
 * single-paragraph string, so the UI can render each recommended track's
 * "why" as its own short, scannable block instead of one dense paragraph
 * blending all 2-3 tracks together — this was the direct fix for user
 * feedback that the dashboard's "Your Botanical Tracks" rationale text
 * was hard to read.
 *
 * Rows written before this change still hold the old plain-string shape.
 * `parseRationale` normalizes both: valid JSON matching the new shape
 * comes back as-is; anything else (a legacy paragraph, or malformed data)
 * comes back as a single entry with an empty `track_id`, which the UI
 * treats as "not tied to a specific track card" and renders as one
 * general paragraph — old data still displays, just without the
 * per-track breakdown.
 */
export type TrackRationale = { track_id: string; reason: string };

export function parseRationale(raw: string | null | undefined): TrackRationale[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (p) => p && typeof p.track_id === "string" && typeof p.reason === "string"
      )
    ) {
      return parsed;
    }
  } catch {
    // Not JSON — legacy plain-string rationale, fall through.
  }
  return [{ track_id: "", reason: raw }];
}
