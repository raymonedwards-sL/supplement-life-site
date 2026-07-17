import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, INTAKE_TURN_TOOL } from "@/lib/claude/intake";
import {
  buildSubscriberContext,
  isCuriositySignal,
  LIFESTYLE_FIELD_COLUMNS,
} from "@/lib/claude/subscriber-context";
import { buildLifeBriefPdf } from "@/lib/pdf/life-brief";
import { sendLifeBriefEmail } from "@/lib/email/send-life-brief";

const MODEL = "claude-sonnet-5";

type ChatMessage = { role: "user" | "assistant"; content: string };

type TurnInput = {
  log_entry: {
    category: string;
    question: string;
    answer: string;
    structured_value: { field: string; value: unknown };
  } | null;
  safety_flag: {
    flag_type: "medication" | "allergy" | "pregnancy_nursing" | "health_condition";
    value: string;
    action: "add" | "remove";
    note?: string;
  } | null;
  reply: string;
  completion: {
    summary: string;
    recommended_track_ids: string[];
    rationale: { track_id: string; reason: string }[];
    ingredient_highlights: { ingredient: string; role: string }[];
    daily_practices: { water_intake: string; fasting: string };
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

  // Empty history means this is a brand-new conversation (the very first
  // load, before the seed message below is added) — used both to fetch
  // the opening question and, further down, to bump conversation_count
  // exactly once per conversation rather than once per turn.
  const isNewConversation = anthropicMessages.length === 0;

  // First load sends an empty history to get Claude's opening question —
  // the API requires at least one message, so seed a hidden starter turn.
  if (isNewConversation) {
    anthropicMessages.push({ role: "user", content: "Hi, I'm ready to begin." });
  }

  try {
    // Stage 3 of the Sage Knowledge Architecture spec: pull the
    // subscriber's persisted profile (safety flags, lifestyle inputs,
    // engagement signals, track/feedback history — see
    // lib/claude/subscriber-context.ts) into context so Sage can
    // self-assess Depth Ladder tier from real data density, not just
    // what's been said in this one conversation.
    const subscriberContext = await buildSubscriberContext(supabase, user.id);

    if (isNewConversation) {
      const { error: convCountError } = await supabase.rpc("increment_conversation_count", {
        p_user_id: user.id,
      });
      if (convCountError) console.error("Failed to increment conversation_count:", convCountError);
    }

    // NOTE: buildSystemPrompt() now includes the full Hero Ingredient
    // Reference (lib/claude/ingredient-reference.ts) and the Systems
    // Framework, plus the subscriber-specific context block above, so it
    // varies per subscriber and is NOT identical across every intake
    // conversation the way it used to be — the catalog/ingredient/systems
    // portions are still static and remain a good candidate for Anthropic
    // prompt caching (cache_control on a shared prefix) to cut repeat-turn
    // cost/latency. Not wired up yet: the installed @anthropic-ai/sdk
    // (0.32.1) only exposes cache_control via the beta client
    // (anthropic.beta.messages.create), which has slightly different
    // response/type shapes than the stable client used below — switching
    // call sites deserves its own tested pass.
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system: buildSystemPrompt(subscriberContext.text),
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

      // Opportunistically persist lifestyle inputs to the rolled-up
      // profile (Stage 2 schema) so they're available as Tier context in
      // future conversations — a partial upsert only touches the one
      // column named here, so this never clobbers other profile fields.
      const column = LIFESTYLE_FIELD_COLUMNS[input.log_entry.structured_value.field];
      if (column) {
        const { error: lifestyleError } = await supabase
          .from("profiles")
          .upsert({ user_id: user.id, [column]: input.log_entry.structured_value.value }, { onConflict: "user_id" });
        if (lifestyleError) console.error("Failed to persist lifestyle field:", lifestyleError);
      }

      // Simple keyword-based curiosity-signal detection (spec Section 7)
      // — not a classifier, just a "did they ask a why/mechanism
      // question" check — feeds Tier 3 unlock in future conversations.
      if (isCuriositySignal(input.log_entry.answer)) {
        const { error: curiosityError } = await supabase.rpc("increment_curiosity_signal", {
          p_user_id: user.id,
        });
        if (curiosityError) console.error("Failed to increment curiosity_signal_count:", curiosityError);
      }
    }

    if (input.safety_flag) {
      const { error: safetyError } = await supabase.from("safety_flags").insert({
        user_id: user.id,
        flag_type: input.safety_flag.flag_type,
        value: input.safety_flag.value,
        action: input.safety_flag.action,
        note: input.safety_flag.note ?? null,
      });
      if (safetyError) console.error("Failed to record safety flag:", safetyError);
    }

    if (input.completion) {
      const completion = input.completion;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          current_summary: completion.summary,
          // Sage's synthesized daily guidance (distinct from the
          // self-reported water_intake/fasting_pattern columns from
          // 0007) — refreshed on every intake completion so it evolves
          // the same way current_summary does. See 0009_daily_practices.sql.
          water_intake_recommendation: completion.daily_practices.water_intake,
          fasting_recommendation: completion.daily_practices.fasting,
        },
        { onConflict: "user_id" }
      );
      if (profileError) console.error("Failed to save profile:", profileError);

      const { error: trackError } = await supabase.from("track_assignments").insert({
        user_id: user.id,
        tracks: completion.recommended_track_ids,
        // rationale is a plain `text` column — JSON-encode the per-track
        // array into it rather than migrating the column type. See
        // lib/rationale.ts for the corresponding parser used on read.
        rationale: JSON.stringify(completion.rationale),
      });
      if (trackError) console.error("Failed to save track assignment:", trackError);

      // Email "Your LIFE Brief" immediately on completion — the
      // "she receives the Brief immediately" moment from the LIFE
      // Assessment funnel. Built straight from this turn's completion
      // data (no extra profile/track re-fetch needed) plus one light
      // subscription-status lookup so the Brief's status section is
      // accurate for both a $249 Founding Subscriber and an
      // assessment-only ($89) customer with no subscriptions row at all.
      // Fire-and-forget: a PDF-build or Resend hiccup must never fail
      // intake completion for the subscriber.
      if (user.email) {
        void (async () => {
          try {
            const { data: subscription } = await supabase
              .from("subscriptions")
              .select("status, conversion_date")
              .eq("user_id", user.id)
              .maybeSingle();

            const pdfBytes = await buildLifeBriefPdf({
              email: user.email!,
              currentSummary: completion.summary,
              waterIntakeRecommendation: completion.daily_practices.water_intake,
              fastingRecommendation: completion.daily_practices.fasting,
              trackIds: completion.recommended_track_ids,
              rationale: completion.rationale,
              subscriptionStatus: subscription?.status ?? null,
              conversionDate: subscription?.conversion_date ?? null,
            });
            await sendLifeBriefEmail({ email: user.email!, pdfBytes });
          } catch (err) {
            console.error("Failed to generate/send LIFE Brief email:", err);
          }
        })();
      }

      return NextResponse.json({ done: true, summary: completion });
    }

    return NextResponse.json({ done: false, reply: input.reply });
  } catch (error) {
    console.error("Intake chat failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
