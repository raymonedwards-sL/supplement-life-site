import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, INTAKE_TURN_TOOL } from "@/lib/claude/intake";

const MODEL = "claude-sonnet-5";

type ChatMessage = { role: "user" | "assistant"; content: string };

type TurnInput = {
  log_entry: {
    category: string;
    question: string;
    answer: string;
    structured_value: { field: string; value: unknown };
  } | null;
  reply: string;
  completion: {
    summary: string;
    recommended_track_ids: string[];
    rationale: string;
    ingredient_highlights: { ingredient: string; role: string }[];
  } | null;
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set — /api/intake/chat will fail.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BLOCKED_STATUSES = new Set(["refunded", "canceled"]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Refunded/canceled reservations lose intake access even though the
  // account still exists — checked server-side too, not just in the UI.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.status && BLOCKED_STATUSES.has(subscription.status)) {
    return NextResponse.json(
      { error: "This account's reservation is no longer active." },
      { status: 403 }
    );
  }

  const { messages }: { messages: ChatMessage[] } = await request.json();

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // First load sends an empty history to get Claude's opening question —
  // the API requires at least one message, so seed a hidden starter turn.
  if (anthropicMessages.length === 0) {
    anthropicMessages.push({ role: "user", content: "Hi, I'm ready to begin." });
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system: buildSystemPrompt(),
      tools: [INTAKE_TURN_TOOL],
      tool_choice: { type: "tool", name: "intake_turn" },
      messages: anthropicMessages,
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (!toolUse) {
      console.error("Intake chat: no tool_use block in response", response);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    const input = toolUse.input as TurnInput;

    if (input.log_entry) {
      const { error } = await supabase.from("intake_responses").insert({
        user_id: user.id,
        category: input.log_entry.category,
        question: input.log_entry.question,
        answer: input.log_entry.answer,
        structured_value: input.log_entry.structured_value,
      });
      if (error) console.error("Failed to log intake response:", error);
    }

    if (input.completion) {
      const completion = input.completion;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          current_summary: completion.summary,
        },
        { onConflict: "user_id" }
      );
      if (profileError) console.error("Failed to save profile:", profileError);

      const { error: trackError } = await supabase.from("track_assignments").insert({
        user_id: user.id,
        tracks: completion.recommended_track_ids,
        rationale: completion.rationale,
      });
      if (trackError) console.error("Failed to save track assignment:", trackError);

      return NextResponse.json({ done: true, summary: completion });
    }

    return NextResponse.json({ done: false, reply: input.reply });
  } catch (error) {
    console.error("Intake chat failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
