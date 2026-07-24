import type { RoadmapProps } from "@/lib/life-brief/types";

/** P3-7, Pages 8-9 — the 30/60/90-day roadmap plus weekly check-in spec. */
export function Roadmap({ phases, weeklyCheckIn }: RoadmapProps) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Your 90-Day Roadmap</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {phases.map((phase) => (
          <div key={phase.label} className="rounded-xl bg-navy/5 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-copper">{phase.dayRange}</p>
            <p className="mt-1 font-serif text-xl text-navy">{phase.label}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-navy/80">{phase.focus}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {phase.milestones.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-navy/70">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-copper" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-navy/10 pt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Your Weekly Check-In</p>
        <p className="mt-1.5 text-sm text-navy/60">
          Priority marker: <span className="font-bold text-navy/90">{weeklyCheckIn.priorityMarkerQuestion}</span>
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {weeklyCheckIn.questions.map((q, i) => (
            <li key={i} className="text-sm font-medium text-navy/85">
              {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
