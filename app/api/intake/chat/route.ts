import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, INTAKE_TOOLS } from "@/lib/claude/intake";

const MODEL = "claude-sonnet-5";
const MAX_TOOL_ITERATIONS = 5;

type ChatMessage = { role: "user" | "assistant"; content: string };

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set — /api/intake/chat will fail.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
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
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(),
        tools: INTAKE_TOOLS,
        messages: anthropicMessages,
      });

      if (response.stop_reason !== "tool_use") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        return NextResponse.json({ reply: text, done: false });
      }

      // Model wants to call one or more tools before continuing.
      anthropicMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let completion: {
        summary: string;
        recommended_track_ids: string[];
        rationale: string;
        ingredient_highlights: { ingredient: string; role: string }[];
      } | null = null;

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        if (block.name === "log_intake_response") {
          const input = block.input as {
            category: string;
            question: string;
            answer: string;
            structured_value: { field: string; value: unknown };
          };

          const { error } = await supabase.from("intake_responses").insert({
            user_id: user.id,
            category: input.category,
            question: input.question,
            answer: input.answer,
            structured_value: input.structured_value,
          });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: error ? `Failed to save: ${error.message}` : "Saved.",
            is_error: Boolean(error),
          });
        } else if (block.name === "complete_intake") {
          completion = block.input as {
            summary: string;
            recommended_track_ids: string[];
            rationale: string;
            ingredient_highlights: { ingredient: string; role: string }[];
          };

          const { error: profileError } = await supabase.from("profiles").upsert(
            {
              user_id: user.id,
              current_summary: completion.summary,
            },
            { onConflict: "user_id" }
          );

          const { error: trackError } = await supabase.from("track_assignments").insert({
            user_id: user.id,
            tracks: completion.recommended_track_ids,
            rationale: completion.rationale,
          });

          const error = profileError ?? trackError;
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: error ? `Failed to save: ${error.message}` : "Saved.",
            is_error: Boolean(error),
          });
        }
      }

      if (completion) {
        return NextResponse.json({ done: true, summary: completion });
      }

      anthropicMessages.push({ role: "user", content: toolResults });
    }

    return NextResponse.json(
      { error: "Intake got stuck in a loop — please try again." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Intake chat failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
