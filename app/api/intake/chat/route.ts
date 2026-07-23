import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  buildSystemPrompt,
  buildRationaleSystemPrompt,
  INTAKE_TURN_TOOL,
  INTAKE_RATIONALE_TOOL,
  type EngineSelectedTrack,
} from "@/lib/claude/intake";
import {
  buildSubscriberContext,
  isCuriositySignal,
  LIFESTYLE_FIELD_COLUMNS,
} from "@/lib/claude/subscriber-context";
import { runAssessmentEngine, type StructuredAnswer } from "@/lib/scoring";
import { findTrack } from "@/lib/tracks";
import { buildLifeBriefPdf } from "@/lib/pdf/life-brief";
import { sendLifeBriefEmail } from "@/lib/email/send-life-brief";
import { resolveIntakeAccess } from "@/lib/access/intake-access";

const MODEL = "claude-sonnet-5";
const ROLE_LABELS: EngineSelectedTrack["role"][] = ["Primary", "Secondary", "Tertiary"];

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
  // Phase 1 completion: Sage signals the conversation is done. Track
  // selection is NOT part of this anymore — see lib/scoring/engine.ts and
  // the phase-2 rationale call below.
  completion: {
    summary: string;
    daily_practices: { water_intake: string; fasting: string };
  } | null;
};

type RationaleInput = {
  rationale: { track_id: string; reason: string }[];
  ingredient_highlights: { ingredient: string; role: string }[];
};

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("ANTHROPIC_API_KEY is not set — /api/intake/chat will fail.");
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Occasionally the model double-escapes a paragraph break inside the
// tool_use JSON it constructs for the `reply` field — instead of a real
// newline character, the string ends up containing the literal two-character
// sequence backslash-n (and sometimes backslash-r-backslash-n), which then
// renders on screen as visible "\n\n" text rather than a line break. This is
// a known quirk of models generating multi-paragraph prose inside a JSON
// string value, not something the client should have to work around — fix
// it once here so every consumer of `reply` gets a clean string. Order
// matters: collapse \r\n before \n so Windows-style sequences don't leave a
// stray \r behind.
function sanitizeModelText(text: string): string {
  return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Enforced server-side too, not just in the /intake page UI — a
  // refunded/canceled reservation always blocks access; a LIFE
  // Assessment-only or LIFE Concierge-only account only has access for
  // its retake window (see lib/access/intake-access.ts for the full rule).
  const [{ data: accessSubscription }, { data: lifeAssessmentPurchase }, { data: lifeConciergePurchase }] =
    await Promise.all([
      supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("life_assessment_purchases")
        .select("purchased_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("life_concierge_purchases")
        .select("purchased_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const access = resolveIntakeAccess({
    subscriptionStatus: accessSubscription?.status ?? null,
    lifeAssessmentPurchasedAt: lifeAssessmentPurchase?.purchased_at ?? null,
    lifeConciergePurchasedAt: lifeConciergePurchase?.purchased_at ?? null,
  });

  if (!access.allowed) {
    const message =
      access.reason === "refunded_or_canceled"
        ? "This account's reservation is no longer active."
        : "Your access window has closed. Reserve a Founding Subscription to continue with Sage.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const {
    messages,
    conversationId: incomingConversationId,
  }: { messages: ChatMessage[]; conversationId?: string } = await request.json();

  // Generated once per browser session by the client (see IntakeChat.tsx)
  // and echoed back on every turn — scopes intake_responses rows to "this
  // sitting" so the scoring engine can read back exactly this
  // conversation's structured answers at completion time, not a
  // subscriber's entire history. Always returned in the response so the
  // client can capture it after turn one.
  const conversationId = incomingConversationId ?? randomUUID();

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
        conversation_id: conversationId,
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

      // Pull back exactly this conversation's structured answers (scoped
      // by conversation_id, not this subscriber's whole history) plus
      // their currently-active permanent safety flags, and hand both to
      // the deterministic engine — this is the actual decision layer now,
      // not Sage's own judgment. See lib/scoring/engine.ts.
      const [{ data: conversationRows }, { data: activeFlags }] = await Promise.all([
        supabase
          .from("intake_responses")
          .select("structured_value")
          .eq("user_id", user.id)
          .eq("conversation_id", conversationId),
        supabase.from("active_safety_flags").select("flag_type, value").eq("user_id", user.id),
      ]);

      const structuredAnswers: StructuredAnswer[] = (conversationRows ?? [])
        .map((r) => r.structured_value as { field?: string; value?: unknown } | null)
        .filter(
          (v): v is { field: string; value: unknown } =>
            Boolean(v) && typeof v!.field === "string"
        );

      const engine = runAssessmentEngine(structuredAnswers, activeFlags ?? []);

      if (engine.hardBlock) {
        const flag = engine.contradictionFlags.find((f) => f.hardError);
        console.warn("Intake chat: hard-block contradiction, prompting re-entry:", flag?.message);
        return NextResponse.json({
          done: false,
          conversationId,
          reply:
            "Before I put your profile together — a couple of the details you've shared don't quite line up. Could you confirm your age for me again?",
        });
      }

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

      // Build the engine's selected tracks (already ranked, primary
      // first) into the shape the phase-2 rationale prompt needs.
      const selectedTracks: EngineSelectedTrack[] = engine.recommendedTrackIds.map((trackId, i) => {
        const track = findTrack(trackId);
        const trackResult = engine.tracks.find((t) => t.trackId === trackId);
        const domainResult = engine.domains.find((d) => d.trackId === trackId);
        return {
          trackId,
          trackName: track?.name ?? trackId,
          role: ROLE_LABELS[i] ?? "Tertiary",
          domainOpportunityScore: domainResult?.opportunityScore ?? null,
          trackFitScore: trackResult?.trackFitScore ?? null,
          cautions: trackResult?.reasons ?? [],
        };
      });

      // Phase 2: a second, narrower Claude call — the engine has already
      // decided WHICH tracks; Sage only writes the rationale prose for
      // them. Skipped entirely if the engine couldn't recommend anything
      // (e.g. every track got safety-gate-excluded).
      let rationale: RationaleInput["rationale"] = [];
      let ingredientHighlights: RationaleInput["ingredient_highlights"] = [];

      if (selectedTracks.length > 0) {
        const rationaleResponse = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: buildRationaleSystemPrompt(subscriberContext.text, completion.summary, selectedTracks),
          tools: [INTAKE_RATIONALE_TOOL],
          tool_choice: { type: "tool", name: "intake_rationale" },
          messages: [
            ...anthropicMessages,
            {
              role: "user",
              content: "The engine has selected your tracks (see system prompt). Write the rationale and ingredient highlights now.",
            },
          ],
        });

        const rationaleToolUse = rationaleResponse.content.find(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        if (rationaleToolUse) {
          const rationaleInput = rationaleToolUse.input as RationaleInput;
          rationale = rationaleInput.rationale;
          ingredientHighlights = rationaleInput.ingredient_highlights;
        } else {
          console.error("Intake chat: no tool_use block in rationale response", rationaleResponse);
        }
      }

      const { error: trackError } = await supabase.from("track_assignments").insert({
        user_id: user.id,
        conversation_id: conversationId,
        tracks: engine.recommendedTrackIds,
        // rationale is a plain `text` column — JSON-encode the per-track
        // array into it rather than migrating the column type. See
        // lib/rationale.ts for the corresponding parser used on read.
        rationale: JSON.stringify(rationale),
        // Real jsonb/numeric columns (0015_assessment_scoring_engine.sql)
        // — the audit trail behind this recommendation.
        domain_scores: engine.domains,
        safety_gate: engine.safetyGate,
        track_fit_scores: engine.tracks,
        confidence_score: engine.confidenceScore,
        contradiction_flags: engine.contradictionFlags,
      });
      if (trackError) console.error("Failed to save track assignment:", trackError);

      const finalCompletion = {
        summary: completion.summary,
        recommended_track_ids: engine.recommendedTrackIds,
        rationale,
        ingredient_highlights: ingredientHighlights,
        daily_practices: completion.daily_practices,
      };

      // Email "Your LIFE Brief" immediately on completion — the
      // "she receives the Brief immediately" moment from the LIFE
      // Assessment funnel. Fire-and-forget: a PDF-build or Resend hiccup
      // must never fail intake completion for the subscriber.
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
              currentSummary: finalCompletion.summary,
              waterIntakeRecommendation: finalCompletion.daily_practices.water_intake,
              fastingRecommendation: finalCompletion.daily_practices.fasting,
              trackIds: finalCompletion.recommended_track_ids,
              rationale: finalCompletion.rationale,
              subscriptionStatus: subscription?.status ?? null,
              conversionDate: subscription?.conversion_date ?? null,
              // SMS opt-in only happens later from the dashboard (never at
              // intake) — always false for this immediate post-completion
              // email, so the callout below always shows the sign-up CTA.
              smsOptedIn: false,
            });
            await sendLifeBriefEmail({ email: user.email!, pdfBytes });
          } catch (err) {
            console.error("Failed to generate/send LIFE Brief email:", err);
          }
        })();
      }

      return NextResponse.json({ done: true, conversationId, summary: finalCompletion });
    }

    return NextResponse.json({ done: false, conversationId, reply: sanitizeModelText(input.reply) });
  } catch (error) {
    console.error("Intake chat failed:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
