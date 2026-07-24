import type { PatternMapProps } from "@/lib/life-brief/types";

function Bucket({ label, items, tone }: { label: string; items: string[]; tone: "solid" | "muted" }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-2.5 text-sm leading-relaxed ${
              tone === "solid" ? "text-navy/80" : "text-navy/55"
            }`}
          >
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "solid" ? "bg-copper" : "bg-navy/30"}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** P3-3, Page 3 — the Personal Pattern Map: the ordered chain plus what's
 * reported/observed/uncertain/still-being-monitored. */
export function PatternMap({ chain, reported, observed, uncertain, monitoring }: PatternMapProps) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Your Personal Pattern Map</p>

      {chain.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chain.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-full bg-navy/5 px-3 py-1.5 text-xs font-medium text-navy/75">{step}</span>
              {i < chain.length - 1 && <span className="text-navy/30">→</span>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Bucket label="What you reported" items={reported} tone="solid" />
        <Bucket label="What Sage observed" items={observed} tone="solid" />
        <Bucket label="What remains uncertain" items={uncertain} tone="muted" />
        <Bucket label="What Sage is monitoring" items={monitoring} tone="muted" />
      </div>
    </div>
  );
}
