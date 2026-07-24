import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveIntakeAccess } from "@/lib/access/intake-access";
import { parseRationale } from "@/lib/rationale";

/**
 * Read path for "Talk with Sage" reloads. Returns one of three shapes,
 * keyed on the subscriber's most recent conversation_id:
 *   1. Nothing yet (no chat_messages at all) — { conversationId: null, messages: [] }.
 *   2. Unfinished sitting (SAGE_Return_Greeting_and_Chat_History_Spec.md,
 *      2026-07-24) — { conversationId, messages } to resume in place.
 *      conversation_id keeps its existing meaning everywhere else in this
 *      schema (one intake sitting for the scoring engine, see
 *      supabase/migrations/0015_assessment_scoring_engine.sql), so this
 *      never resumes an already-completed sitting — the next visit starts
 *      a fresh conversation_id for a real retake (app/api/intake/chat/route.ts).
 *   3. Completed sitting (SAGE_Intake_Completion_Handoff_Spec.md,
 *      2026-07-24) — { conversationId: null, messages: [], completedConversation }
 *      reconstructing the same closing message + LIFE Brief CTA content the
 *      subscriber saw live, so a reload right after finishing doesn't lose it.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Same defense-in-depth reasoning as app/api/intake/chat/route.ts — the
  // /intake page only ever mounts IntakeChat when access.allowed is true,
  // but this endpoint enforces it independently rather than trusting that.
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
    return NextResponse.json({ error: "Access window has closed." }, { status: 403 });
  }

  const { data: latestMessage } = await supabase
    .from("chat_messages")
    .select("conversation_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestMessage) {
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const { conversation_id: conversationId } = latestMessage;

  const { data: existingAssignment } = await supabase
    .from("track_assignments")
    .select("tracks, rationale, ingredient_highlights")
    .eq("user_id", user.id)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (existingAssignment) {
    // That sitting already completed — nothing to RESUME (the next visit
    // starts a fresh conversation_id for a real retake, see
    // app/api/intake/chat/route.ts), but per
    // SAGE_Intake_Completion_Handoff_Spec.md a reload right after
    // finishing must still show the same closing message + CTA the
    // subscriber just saw, not silently drop them into a new conversation.
    // Reconstruct the same Completion shape the live done:true response
    // returns, from what's actually persisted — same fields
    // /api/dashboard/insights-pdf already reads the same way.
    const [{ data: profile }, { data: lastReply }] = await Promise.all([
      supabase
        .from("profiles")
        .select("current_summary, water_intake_recommendation, fasting_recommendation")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("chat_messages")
        .select("content")
        .eq("user_id", user.id)
        .eq("conversation_id", conversationId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      conversationId: null,
      messages: [],
      completedConversation: {
        closingMessage: lastReply?.content ?? null,
        email: user.email ?? null,
        summary: {
          summary: profile?.current_summary ?? "",
          recommended_track_ids: existingAssignment.tracks ?? [],
          rationale: parseRationale(existingAssignment.rationale),
          ingredient_highlights: existingAssignment.ingredient_highlights ?? [],
          daily_practices: {
            water_intake: profile?.water_intake_recommendation ?? "",
            fasting: profile?.fasting_recommendation ?? "",
          },
        },
      },
    });
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ conversationId, messages: messages ?? [] });
}
