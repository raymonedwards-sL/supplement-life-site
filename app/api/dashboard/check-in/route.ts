import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  buildCheckInAcknowledgmentPrompt,
  CHECKIN_ACKNOWLEDGMENT_TOOL,
} from "@/lib/claude/intake";
import { findTrack } from "@/lib/tracks";
import { getNextCheckInAvailableAt } from "@/lib/checkin";

const MODEL = "claude-sonnet-5";
const FALLBACK_ACKNOWLEDGMENT = "Sage has noted your check-in — thank you.";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set — /api/dashboard/check-in's acknowledgment will fall back to a static message.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type CheckInAnswer = { question: string; answer: string; priorityMarker?: boolean };

/**
 * Weekly Check-In Loop (docs/SAGE_Weekly_CheckIn_Loop_Gap2.md, 2026-07-25).
 * Persists a subscriber's answers to components/life-brief/WeeklyCheckInForm.tsx,
 * enforces the 7-day cadence server-side, and generates a short, compliant
 * acknowledgment (surfaced immediately in the response, and again on the
 * Daily LIFE Rhythm timeline's "wake" block on the next Brief view — see
 * lib/life-brief/adapter.ts's buildDailyRhythmProps).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { answers }: { answers?: CheckInAnswer[] } = await request.json();

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: "No check-in answers provided." }, { status: 400 });
  }
  if (answers.some((a) => typeof a.question !== "string" || typeof a.answer !== "string" || !a.answer.trim())) {
    return NextResponse.json({ error: "Every question needs an answer." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_summary, last_check_in_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Cadence enforcement — checked BEFORE any insert, so a blocked
  // resubmission never writes duplicate rows. An unenforced "weekly"
  // cadence would make the week-over-week trend data (and the landing
  // page's "continually adjusts" claim) meaningless.
  const nextAvailableAt = getNextCheckInAvailableAt(profile?.last_check_in_at ?? null);
  if (nextAvailableAt && nextAvailableAt.getTime() > Date.now()) {
    return NextResponse.json(
      {
        error: "You've already checked in this week — check back soon.",
        nextAvailableAt: nextAvailableAt.toISOString(),
      },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase.from("check_in_responses").insert(
    answers.map((a) => ({
      user_id: user.id,
      question: a.question,
      answer: a.answer,
      priority_marker: a.priorityMarker === true,
    }))
  );
  if (insertError) {
    console.error("Failed to persist check-in answers:", insertError);
    return NextResponse.json({ error: "Failed to save your check-in. Please try again." }, { status: 500 });
  }

  // Locked in immediately, before the Claude call below — the cadence
  // record must hold even if acknowledgment generation fails.
  const { error: cadenceUpdateError } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, last_check_in_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (cadenceUpdateError) console.error("Failed to update last_check_in_at:", cadenceUpdateError);

  // A downstream LLM hiccup must never fail the request — the subscriber's
  // answers are already safely persisted above regardless of what happens
  // here. Same fire-and-forget-safety reasoning as the LIFE Brief email.
  let acknowledgment = FALLBACK_ACKNOWLEDGMENT;
  try {
    const { data: latestTrackRow } = await supabase
      .from("track_assignments")
      .select("tracks")
      .eq("user_id", user.id)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const primaryTrackName = findTrack((latestTrackRow?.tracks as string[] | null)?.[0] ?? "")?.name ?? null;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: buildCheckInAcknowledgmentPrompt(
        profile?.current_summary ?? null,
        primaryTrackName,
        answers.map((a) => ({ question: a.question, answer: a.answer }))
      ),
      tools: [CHECKIN_ACKNOWLEDGMENT_TOOL],
      tool_choice: { type: "tool", name: "checkin_acknowledgment" },
      messages: [{ role: "user", content: "Here is my weekly check-in — see the system prompt for my answers." }],
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const generated = (toolUse?.input as { acknowledgment?: string } | undefined)?.acknowledgment;
    if (generated) acknowledgment = generated;
  } catch (err) {
    console.error("Check-in acknowledgment generation failed, using fallback:", err);
  }

  const { error: noteUpdateError } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, last_check_in_note: acknowledgment }, { onConflict: "user_id" });
  if (noteUpdateError) console.error("Failed to update last_check_in_note:", noteUpdateError);

  return NextResponse.json({ ok: true, acknowledgment });
}
