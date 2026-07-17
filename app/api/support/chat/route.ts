import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSupportSystemPrompt } from "@/lib/claude/support";

const MODEL = "claude-sonnet-5";

type ChatMessage = { role: "user" | "assistant"; content: string };

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set — /api/support/chat will fail.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Public support-widget chat endpoint — deliberately NOT behind auth,
 * unlike /api/intake/chat. Anonymous visitors on marketing pages should
 * be able to ask billing/policy questions before ever creating an
 * account; logged-in subscribers can use it too. No Supabase reads or
 * writes here at all: this is a stateless Q&A layer over static company
 * knowledge (lib/claude/support.ts), not a persisted conversation or an
 * account-aware assistant. That's a deliberate v1 scope limit, not an
 * oversight — see the file-level comment in lib/claude/support.ts.
 *
 * No forced tool-use (unlike the intake_turn pattern in
 * app/api/intake/chat/route.ts) — plain conversational replies are all
 * this needs.
 */
export async function POST(request: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: buildSupportSystemPrompt(),
      messages: anthropicMessages,
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );

    if (!textBlock) {
      console.error("Support chat: no text block in response", response);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json({ reply: textBlock.text });
  } catch (error) {
    console.error("Support chat failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
