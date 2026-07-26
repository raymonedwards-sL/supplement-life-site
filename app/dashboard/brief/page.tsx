import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LoginPrompt from "@/components/LoginPrompt";
import AccessRevoked from "@/components/AccessRevoked";
import { Container, Eyebrow } from "@/components/ui/Container";
import {
  buildLifeBriefContext,
  buildLifeRevelationProps,
  buildLifeIndexProps,
  buildPatternMapProps,
  buildTrackCardProps,
  buildDailyRhythmProps,
  buildRoadmapProps,
  buildShareCardProps,
  buildProgressComparisonProps,
  type TrackAssignmentRow,
} from "@/lib/life-brief/adapter";
import { LifeRevelation } from "@/components/life-brief/LifeRevelation";
import { TrackCard } from "@/components/life-brief/TrackCard";
import { LifeIndex } from "@/components/life-brief/LifeIndex";
import { PatternMap } from "@/components/life-brief/PatternMap";
import { DailyRhythm } from "@/components/life-brief/DailyRhythm";
import { Roadmap } from "@/components/life-brief/Roadmap";
import type { CheckInHistoryRow } from "@/components/life-brief/WeeklyCheckInForm";
import { ProgressComparison } from "@/components/life-brief/ProgressComparison";
import { ShareCard } from "@/components/life-brief/ShareCard";
import { ProfileAvatar } from "@/components/life-brief/ProfileAvatar";

const BLOCKED_STATUSES = new Set(["refunded", "canceled"]);

/**
 * The full LIFE Brief report — a deeper, richer view than the compact
 * summary on /dashboard, built from real subscriber data via
 * lib/life-brief/adapter.ts. Sections whose adapter function returns
 * null are skipped entirely (most commonly: this account's most recent
 * intake predates the scoring engine, so domain_scores is NULL — real,
 * expected state for the one production account on file as of
 * 2026-07-24, not a bug).
 */
export default async function LifeBriefPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="py-20">
        <Container className="max-w-xl">
          <Eyebrow>Your LIFE Brief</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Welcome back</h1>
          <p className="mt-4 text-navy/70">Log in to see your full LIFE Brief report.</p>
          <LoginPrompt redirectPath="/dashboard/brief" />
        </Container>
      </section>
    );
  }

  const [
    { data: subscription },
    { data: assignmentRows },
    { data: profile },
    { data: accountRow },
    { data: checkInHistory },
  ] = await Promise.all([
    supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("track_assignments")
      .select("tracks, rationale, domain_scores, confidence_score, contradiction_flags, safety_gate, assigned_at")
      .eq("user_id", user.id)
      .order("assigned_at", { ascending: false })
      .limit(2)
      .returns<TrackAssignmentRow[]>(),
    supabase
      .from("profiles")
      .select(
        "water_intake_recommendation, fasting_recommendation, movement_recommendation, nutrition_recommendation, travel_frequency, work_environment, last_check_in_at, last_check_in_note"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("users").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    // Weekly Check-In Loop (docs/SAGE_Weekly_CheckIn_Loop_Gap2.md) — up to
    // 3 recent submissions' worth of rows (8 questions each), grouped by
    // calendar day in WeeklyCheckInForm's history view.
    supabase
      .from("check_in_responses")
      .select("question, answer, priority_marker, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24)
      .returns<CheckInHistoryRow[]>(),
  ]);

  if (subscription?.status && BLOCKED_STATUSES.has(subscription.status)) {
    return (
      <section className="py-20">
        <Container className="max-w-xl">
          <Eyebrow>Your LIFE Brief</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-navy/70">{user.email}</p>
          <AccessRevoked />
        </Container>
      </section>
    );
  }

  const newestRow = assignmentRows?.[0];

  if (!newestRow) {
    return (
      <section className="py-20">
        <Container className="max-w-xl">
          <Eyebrow>Your LIFE Brief</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Your LIFE Brief isn&apos;t ready yet
          </h1>
          <p className="mt-4 text-navy/70">
            Complete your wellness intake first, and Sage will put together your full report.
          </p>
          <Link href="/intake" className="mt-6 inline-block font-semibold text-copper underline underline-offset-2">
            Start your intake
          </Link>
        </Container>
      </section>
    );
  }

  const ctx = buildLifeBriefContext(newestRow, profile ?? null);
  const oldestRow = assignmentRows?.[1];

  const lifeRevelation = buildLifeRevelationProps(ctx);
  const lifeIndex = buildLifeIndexProps(ctx, newestRow, oldestRow);
  const patternMap = buildPatternMapProps(ctx);
  const trackCards = buildTrackCardProps(ctx);
  const dailyRhythm = buildDailyRhythmProps(ctx);
  const roadmap = buildRoadmapProps(ctx);
  const shareCard = buildShareCardProps(ctx);
  const progressComparison = oldestRow ? buildProgressComparisonProps(oldestRow, newestRow) : null;

  return (
    <section className="py-16">
      <Container className="max-w-4xl">
        <div className="border-b border-copper/20 pb-6">
          <Eyebrow>Your LIFE Brief</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Your full report
          </h1>
          <p className="mt-2 text-navy/70">
            <Link href="/dashboard" className="font-semibold text-copper underline underline-offset-2">
              ← Back to your dashboard
            </Link>
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-14">
          {lifeRevelation && (
            <div className="relative">
              <ProfileAvatar
                avatarUrl={accountRow?.avatar_url ?? null}
                fullName={accountRow?.full_name ?? ""}
                email={user.email ?? ""}
              />
              <LifeRevelation {...lifeRevelation} />
            </div>
          )}

          {lifeIndex && <LifeIndex {...lifeIndex} />}

          {patternMap && (patternMap.reported.length > 0 || patternMap.uncertain.length > 0 || patternMap.monitoring.length > 0) && (
            <PatternMap {...patternMap} />
          )}

          {trackCards.length > 0 && (
            <div className="flex flex-col gap-4">
              {trackCards.map((card) => (
                <TrackCard key={card.track} {...card} />
              ))}
            </div>
          )}

          <DailyRhythm {...dailyRhythm} />

          <Roadmap
            {...roadmap}
            lastCheckInAt={profile?.last_check_in_at ?? null}
            checkInHistory={checkInHistory ?? []}
          />

          {progressComparison && <ProgressComparison {...progressComparison} />}

          {shareCard && (
            <BriefSection label="Share Your LIFE Map">
              <div className="max-w-sm">
                <ShareCard {...shareCard} />
              </div>
            </BriefSection>
          )}
        </div>
      </Container>
    </section>
  );
}

function BriefSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-navy/60">{label}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
