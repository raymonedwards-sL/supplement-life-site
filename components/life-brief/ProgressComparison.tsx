import type { ProgressComparisonProps, ProgressSnapshot } from "@/lib/life-brief/types";

function SnapshotCard({ snapshot }: { snapshot: ProgressSnapshot }) {
  return (
    <div className="rounded-xl bg-navy/5 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-copper">{snapshot.dayLabel}</p>
      <p className="mt-1 font-serif text-3xl text-navy">{snapshot.vitalityIndex ?? "—"}</p>
      <p className="text-xs text-navy/40">{snapshot.vitalityIndex != null ? "LIFE Index" : "LIFE Index — still building"}</p>
      <div className="mt-3 flex flex-col gap-1.5">
        {snapshot.topBenchmarks.map((b, i) => (
          <p key={i} className="text-xs text-navy/60">
            <span className="font-medium text-navy/50">{b.metric}: </span>
            {b.current}
          </p>
        ))}
      </div>
    </div>
  );
}

/** P3-9, standalone progress-comparison module — Then / Now / What Changed. */
export function ProgressComparison({ then, now, whatChanged, sageRecommendsNext }: ProgressComparisonProps) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Then vs. Now</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SnapshotCard snapshot={then} />
        <SnapshotCard snapshot={now} />
      </div>

      {whatChanged.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">What Changed</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {whatChanged.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 border-t border-navy/10 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Sage Recommends Next</p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy/75">{sageRecommendsNext}</p>
      </div>
    </div>
  );
}
