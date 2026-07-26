import { notFound } from "next/navigation";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LifeRevelation } from "@/components/life-brief/LifeRevelation";
import { TrackCard } from "@/components/life-brief/TrackCard";
import { IngredientIntelligenceCard } from "@/components/life-brief/IngredientIntelligenceCard";
import { LifeIndex } from "@/components/life-brief/LifeIndex";
import { PatternMap } from "@/components/life-brief/PatternMap";
import { DailyRhythm } from "@/components/life-brief/DailyRhythm";
import { Roadmap } from "@/components/life-brief/Roadmap";
import { ProgressComparison } from "@/components/life-brief/ProgressComparison";
import { ShareCard } from "@/components/life-brief/ShareCard";
import {
  mockLifeRevelationProps,
  mockTrackCards,
  mockIngredientIntelligenceCards,
  mockLifeIndexProps,
  mockPatternMapProps,
  mockDailyRhythmProps,
  mockRoadmapProps,
  mockProgressComparisonProps,
  mockShareCardProps,
} from "@/lib/life-brief/mock-data";

export const metadata = {
  title: "LIFE Brief Preview (Dev)",
  robots: { index: false, follow: false },
};

/**
 * Dev-only visual preview of the 9 Phase 3 "LIFE Brief" report shells
 * (P3-1 through P3-9), rendered against lib/life-brief/mock-data.ts —
 * NOT wired to real Supabase data, no auth, not linked from any real
 * navigation. Blocked on the real production deploy; visible in local
 * dev and Netlify deploy previews so it can be reviewed before real data
 * wiring happens.
 *
 * Netlify sets CONTEXT to "production"/"deploy-preview"/"branch-deploy"
 * during its own builds (unlike NODE_ENV, which Netlify sets to
 * "production" for ALL of those) — gating on CONTEXT keeps this visible
 * on preview deploys. The NODE_ENV fallback covers any other production
 * deploy path where CONTEXT isn't set at all.
 */
const isProduction =
  process.env.CONTEXT === "production" ||
  (!process.env.CONTEXT && process.env.NODE_ENV === "production");

export default function LifeBriefPreviewPage() {
  if (isProduction) notFound();

  return (
    <section className="py-16">
      <Container className="max-w-4xl">
        <div className="mb-10 rounded-xl border border-copper/30 bg-copper/5 px-5 py-4">
          <p className="text-sm font-semibold text-copper">DEV PREVIEW — mock data only, not wired to live data</p>
          <p className="mt-1 text-xs text-navy/50">
            Renders the 9 Phase 3 LIFE Brief report shells against one consistent sample-subscriber story
            (lib/life-brief/mock-data.ts). Not linked from real navigation, not shown in production.
          </p>
        </div>

        <div className="flex flex-col gap-14">
          <PreviewSection label="P3-1 — Your LIFE Revelation (Page 1)">
            <LifeRevelation {...mockLifeRevelationProps} />
          </PreviewSection>

          <PreviewSection label="P3-2 — LIFE Index + Benchmarks (Pages 2 & 4)">
            <LifeIndex {...mockLifeIndexProps} />
          </PreviewSection>

          <PreviewSection label="P3-3 — Personal Pattern Map (Page 3)">
            <PatternMap {...mockPatternMapProps} />
          </PreviewSection>

          <PreviewSection label="P3-4 — Track Cards, “Why Sage Chose This” (Page 5)">
            <div className="flex flex-col gap-4">
              {mockTrackCards.map((card) => (
                <TrackCard key={card.track} {...card} />
              ))}
            </div>
          </PreviewSection>

          <PreviewSection label="P3-5 — Ingredient Intelligence (Page 6)">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mockIngredientIntelligenceCards.map((card) => (
                <IngredientIntelligenceCard key={card.ingredientName} {...card} />
              ))}
            </div>
          </PreviewSection>

          <PreviewSection label="P3-6 — Daily LIFE Rhythm (Page 7)">
            <DailyRhythm {...mockDailyRhythmProps} />
          </PreviewSection>

          <PreviewSection label="P3-7 — 90-Day Roadmap + Weekly Check-In (Pages 8-9)">
            <Roadmap {...mockRoadmapProps} lastCheckInAt={null} checkInHistory={[]} />
          </PreviewSection>

          <PreviewSection label="P3-9 — Progress Comparison (Then / Now / What Changed)">
            <ProgressComparison {...mockProgressComparisonProps} />
          </PreviewSection>

          <PreviewSection label="P3-8 — Private-Safe Share Card (Page 10, “sneeze” feature)">
            <div className="max-w-sm">
              <ShareCard {...mockShareCardProps} />
            </div>
          </PreviewSection>
        </div>
      </Container>
    </section>
  );
}

function PreviewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-4">{children}</div>
    </div>
  );
}
