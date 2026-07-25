import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLifeBriefPdf } from "@/lib/pdf/life-brief";
import { buildLifeBriefContext, type TrackAssignmentRow } from "@/lib/life-brief/adapter";

/**
 * On-demand download of "Your LIFE Brief" (renamed from "Wellness
 * Insights" on 2026-07-17 to match the LIFE Assessment funnel naming —
 * same PDF, same live-data design, just the name subscribers see).
 * There is no stored/cached PDF anywhere — every download re-reads live
 * Supabase data and calls the shared builder in lib/pdf/life-brief.ts,
 * which is also used by lib/email/send-life-brief.ts to auto-email the
 * Brief right after intake completes.
 *
 * Route path kept at /api/dashboard/insights-pdf for URL stability
 * (internal, not user-facing) — only the visible branding changed.
 */

const BLOCKED_STATUSES = new Set(["refunded", "canceled"]);

// Used only when a subscriber has never completed an intake — every
// ctx-driven section then cleanly renders its own null/empty state
// (buildTrackCardProps returns [], buildLifeRevelationProps/etc. return
// null), same as app/dashboard/brief/page.tsx's own "not ready yet" path.
const EMPTY_TRACK_ASSIGNMENT_ROW: TrackAssignmentRow = {
  tracks: [],
  rationale: null,
  domain_scores: null,
  confidence_score: null,
  contradiction_flags: null,
  safety_gate: null,
  assigned_at: null,
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [{ data: profile }, { data: assignmentRows }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "current_summary, updated_at, water_intake_recommendation, fasting_recommendation, travel_frequency, work_environment, sms_opt_in"
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      // Same columns + 2-row window as app/dashboard/brief/page.tsx — the
      // second row (oldestRow) enables the Progress Comparison section.
      supabase
        .from("track_assignments")
        .select("tracks, rationale, domain_scores, confidence_score, contradiction_flags, safety_gate, assigned_at")
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(2)
        .returns<TrackAssignmentRow[]>(),
      supabase
        .from("subscriptions")
        .select("status, conversion_date")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (subscription?.status && BLOCKED_STATUSES.has(subscription.status)) {
    return NextResponse.json(
      { error: "This account's reservation is no longer active." },
      { status: 403 }
    );
  }

  const newestRow = assignmentRows?.[0] ?? EMPTY_TRACK_ASSIGNMENT_ROW;
  const oldestRow = assignmentRows?.[1];

  const pdfBytes = await buildLifeBriefPdf({
    email: user.email ?? "",
    currentSummary: profile?.current_summary ?? null,
    ctx: buildLifeBriefContext(newestRow, profile ?? null),
    newestRow,
    oldestRow,
    subscriptionStatus: subscription?.status ?? null,
    conversionDate: subscription?.conversion_date ?? null,
    smsOptedIn: profile?.sms_opt_in ?? false,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="your-life-brief.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
