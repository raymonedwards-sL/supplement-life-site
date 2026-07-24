import { findTrack } from "@/lib/tracks";
import type { LifeIndexProps, BenchmarkMetric } from "@/lib/life-brief/types";

const DIRECTION_GLYPH: Record<BenchmarkMetric["ninetyDayDirection"], string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

/** Colocated here rather than a shared component — only LifeIndex uses
 * the full BenchmarkMetric shape. */
function BenchmarkBar({ metric }: { metric: BenchmarkMetric }) {
  return (
    <div className="border-b border-navy/10 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-navy">{metric.metric}</p>
        <span className="shrink-0 text-xs font-semibold text-copper">
          {DIRECTION_GLYPH[metric.ninetyDayDirection]} 90-day target
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-navy/70">
        <span>
          Current: <span className="font-bold text-navy/95">{metric.current}</span>
        </span>
        <span>
          Your baseline: <span className="font-bold text-navy/95">{metric.personalBaseline}</span>
        </span>
        <span>
          30-day target: <span className="font-bold text-navy/95">{metric.thirtyDayTarget}</span>
        </span>
      </div>
      {metric.publicReferenceNote && (
        <p className="mt-1 text-[11px] text-navy/40">
          {metric.publicReferenceNote}
          {metric.publicReferenceSource ? ` — ${metric.publicReferenceSource}` : ""}
        </p>
      )}
    </div>
  );
}

/** P3-2, Pages 2 & 4 of the LIFE Brief report — the LIFE Index composite
 * plus benchmark bars. */
export function LifeIndex({
  vitalityIndex,
  vitalityIndexDisclaimer,
  topStrengths,
  topFrictions,
  trackMatches,
  sageConfidence,
  momentumBehavior,
  benchmarks,
}: LifeIndexProps) {
  const primaryTrack = findTrack(trackMatches.primary);
  const secondaryTrack = trackMatches.secondary ? findTrack(trackMatches.secondary) : undefined;
  const tertiaryTrack = trackMatches.tertiary ? findTrack(trackMatches.tertiary) : undefined;

  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Your LIFE Index</p>
          {vitalityIndex != null ? (
            <>
              <p className="mt-1 font-serif text-6xl text-copper">{vitalityIndex}</p>
              <p className="text-sm text-navy/40">/ 100</p>
            </>
          ) : (
            <p className="mt-2 max-w-[14rem] font-serif text-2xl leading-snug text-navy/60">
              Still building your picture
            </p>
          )}
          <p className="mt-2 max-w-[14rem] text-xs leading-relaxed text-navy/60">{vitalityIndexDisclaimer}</p>
          <p className="mt-4 text-xs text-navy/60">
            Sage confidence: <span className="font-bold text-navy/90">{sageConfidence}/100</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Top strengths</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {topStrengths.map((s, i) => (
                <li key={i} className="text-[15px] font-medium leading-relaxed text-navy/90">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Top frictions</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {topFrictions.map((f, i) => (
                <li key={i} className="text-[15px] font-medium leading-relaxed text-navy/90">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-navy/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Your Track Matches</p>
        <p className="mt-1.5 text-[15px] font-medium text-navy/90">
          {[primaryTrack, secondaryTrack, tertiaryTrack]
            .filter((t): t is NonNullable<typeof t> => Boolean(t))
            .map((t) => t.name)
            .join(" · ")}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Where momentum comes from</p>
        <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-navy/90">{momentumBehavior}</p>
      </div>

      {benchmarks.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Benchmarks</p>
          <div className="mt-1">
            {benchmarks.map((b, i) => (
              <BenchmarkBar key={i} metric={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
