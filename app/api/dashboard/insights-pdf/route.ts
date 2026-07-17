import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRationale } from "@/lib/rationale";
import { buildLifeBriefPdf } from "@/lib/pdf/life-brief";

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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [{ data: profile }, { data: trackAssignment }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "current_summary, updated_at, water_intake_recommendation, fasting_recommendation"
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("track_assignments")
        .select("tracks, rationale, assigned_at")
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
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

  const pdfBytes = await buildLifeBriefPdf({
    email: user.email ?? "",
    currentSummary: profile?.current_summary ?? null,
    waterIntakeRecommendation: profile?.water_intake_recommendation ?? null,
    fastingRecommendation: profile?.fasting_recommendation ?? null,
    trackIds: (trackAssignment?.tracks ?? []) as string[],
    rationale: parseRationale(trackAssignment?.rationale),
    subscriptionStatus: subscription?.status ?? null,
    conversionDate: subscription?.conversion_date ?? null,
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
