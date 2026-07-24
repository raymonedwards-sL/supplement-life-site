import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveIntakeAccess } from "@/lib/access/intake-access";

/**
 * Read path for resuming "Talk with Sage" mid-conversation
 * (SAGE_Return_Greeting_and_Chat_History_Spec.md, 2026-07-24). Only ever
 * offers to resume an UNFINISHED sitting — conversation_id keeps its
 * existing meaning everywhere else in this schema (one intake sitting for
 * the scoring engine, see supabase/migrations/0015_assessment_scoring_
 * engine.sql), so a conversation that already produced a track_assignments
 * row is treated as done, not resumable; the next visit is a real retake
 * with a fresh conversation_id (see app/api/intake/chat/route.ts).
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
    .select("id")
    .eq("user_id", user.id)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (existingAssignment) {
    // That sitting already completed — nothing to resume. The next visit
    // starts a fresh conversation_id, a real retake.
    return NextResponse.json({ conversationId: null, messages: [] });
  }

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ conversationId, messages: messages ?? [] });
}
