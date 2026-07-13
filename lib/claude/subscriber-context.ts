import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Builds the "Subscriber profile" context block injected into Sage's
 * system prompt (lib/claude/intake.ts) — the concrete implementation of
 * Sage_Knowledge_Architecture_Spec.docx Section 7's guidance: "pass the
 * subscriber's available profile fields into the prompt and let Sage
 * self-assess which tier applies." No scoring pipeline here — this only
 * formats raw facts (which fields are populated, counts, recency); Sage
 * itself decides the tier using the Depth Ladder logic in the prompt.
 *
 * Reads from the Stage 2 schema
 * (supabase/migrations/0004_wellness_profile_schema.sql): the
 * active_safety_flags view, profiles' extended columns,
 * track_assignments, and subscriber_feedback.
 */

type ProfileCounters = {
  curiosity_signal_count: number | null;
  conversation_count: number | null;
};

export type SubscriberContextResult = {
  /** Formatted text block to interpolate into the system prompt. */
  text: string;
  /** Raw counters, so callers (the chat route) can build on the same
   * fetch instead of re-querying before an increment. */
  profile: ProfileCounters | null;
};

export async function buildSubscriberContext(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriberContextResult> {
  const [{ data: safetyFlags }, { data: profile }, { data: trackHistory }, { data: feedback }] =
    await Promise.all([
      supabase
        .from("active_safety_flags")
        .select("flag_type, value, note")
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select(
          "current_summary, sleep_hours, sleep_quality, stress_load, alcohol_frequency, exercise_pattern, diet_pattern, cycle_life_stage, recurring_complaints, curiosity_signal_count, conversation_count, last_conversation_at"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("track_assignments")
        .select("tracks, assigned_at")
        .eq("user_id", userId)
        .order("assigned_at", { ascending: false })
        .limit(3),
      supabase
        .from("subscriber_feedback")
        .select("track_id, feedback")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(3),
    ]);

  const lines: string[] = [];

  if (safetyFlags && safetyFlags.length > 0) {
    lines.push(
      "PERMANENT SAFETY FLAGS ON FILE (honor these before any recommendation, regardless of tier):"
    );
    for (const f of safetyFlags) {
      lines.push(`- [${f.flag_type}] ${f.value}${f.note ? ` — ${f.note}` : ""}`);
    }
  } else {
    lines.push("PERMANENT SAFETY FLAGS ON FILE: none yet — still watch for new disclosures this conversation.");
  }

  const lifestyleFields: Array<[string, string | null]> = [
    [
      "Sleep",
      profile?.sleep_hours != null || profile?.sleep_quality
        ? `${profile?.sleep_hours ?? "unspecified hours"}, quality: ${profile?.sleep_quality ?? "unspecified"}`
        : null,
    ],
    ["Stress load", profile?.stress_load ?? null],
    ["Alcohol frequency", profile?.alcohol_frequency ?? null],
    ["Exercise pattern", profile?.exercise_pattern ?? null],
    ["Diet pattern", profile?.diet_pattern ?? null],
    ["Cycle/life stage", profile?.cycle_life_stage ?? null],
  ];
  const populatedLifestyle = lifestyleFields.filter(([, v]) => v);

  lines.push("");
  lines.push(`LIFESTYLE INPUTS ON FILE (${populatedLifestyle.length} of ${lifestyleFields.length} known from prior conversations):`);
  if (populatedLifestyle.length > 0) {
    for (const [label, value] of populatedLifestyle) {
      lines.push(`- ${label}: ${value}`);
    }
  } else {
    lines.push("- None yet — this is a new or thin profile.");
  }

  lines.push("");
  lines.push("ENGAGEMENT SIGNALS:");
  lines.push(`- Curiosity ("why"/mechanism) questions asked, all-time: ${profile?.curiosity_signal_count ?? 0}`);
  lines.push(`- Prior conversations: ${profile?.conversation_count ?? 0}`);
  if (profile?.last_conversation_at) {
    lines.push(`- Last conversation: ${new Date(profile.last_conversation_at).toLocaleDateString()}`);
  }
  const complaints: Array<{ complaint?: string; count?: number }> = Array.isArray(
    profile?.recurring_complaints
  )
    ? profile.recurring_complaints
    : [];
  if (complaints.length > 0) {
    lines.push(
      `- Recurring complaints noted previously: ${complaints
        .map((c) => `${c.complaint ?? "unspecified"} (x${c.count ?? 1})`)
        .join(", ")}`
    );
  }

  lines.push("");
  if (trackHistory && trackHistory.length > 0) {
    lines.push("PRIOR TRACK ASSIGNMENTS (most recent first — first entry each time is the primary track):");
    for (const t of trackHistory) {
      const assigned = t.assigned_at ? new Date(t.assigned_at).toLocaleDateString() : "unknown date";
      lines.push(`- ${assigned}: ${(t.tracks ?? []).join(", ")}`);
    }
  } else {
    lines.push("PRIOR TRACK ASSIGNMENTS: none — this is their first intake.");
  }

  if (feedback && feedback.length > 0) {
    lines.push("");
    lines.push("RECENT SELF-REPORTED OUTCOMES (personalize with this — never use it to make efficacy claims):");
    for (const f of feedback) {
      lines.push(`- ${f.track_id ?? "general"}: ${f.feedback}`);
    }
  }

  if (profile?.current_summary) {
    lines.push("");
    lines.push(`PRIOR WELLNESS PROFILE SUMMARY: ${profile.current_summary}`);
  }

  return {
    text: lines.join("\n"),
    profile: profile
      ? {
          curiosity_signal_count: profile.curiosity_signal_count,
          conversation_count: profile.conversation_count,
        }
      : null,
  };
}

/**
 * Deliberately a keyword heuristic, not a classifier — per spec Section 7:
 * "a small function that counts populated profile fields and checks for a
 * few keyword patterns (e.g., past 'why' questions)... is not a
 * machine-learning model and does not require one." Used to decide
 * whether to call increment_curiosity_signal for this turn.
 */
const CURIOSITY_KEYWORDS = /\b(why|how does|how do|what causes|mechanism|what's happening|whats happening)\b/i;

export function isCuriositySignal(answerText: string): boolean {
  return answerText.includes("?") && CURIOSITY_KEYWORDS.test(answerText);
}

/**
 * Maps the log_entry.structured_value.field names Sage is instructed to
 * use (lib/claude/intake.ts, "Logging" section) to the matching
 * public.profiles column, so the chat route can opportunistically persist
 * lifestyle inputs as they're volunteered. Fields not in this map (e.g.
 * demographics/concerns/goals fields) aren't part of the Lifestyle Inputs
 * schema (spec Section 4.2) and stay in intake_responses / the rolled-up
 * summary only.
 */
export const LIFESTYLE_FIELD_COLUMNS: Record<string, string> = {
  sleep_hours: "sleep_hours",
  sleep_quality: "sleep_quality",
  stress_load: "stress_load",
  alcohol_frequency: "alcohol_frequency",
  exercise_pattern: "exercise_pattern",
  diet_pattern: "diet_pattern",
  cycle_life_stage: "cycle_life_stage",
};
