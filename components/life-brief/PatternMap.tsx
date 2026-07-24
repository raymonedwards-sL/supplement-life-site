import type { PatternMapProps } from "@/lib/life-brief/types";

function Bucket({ label, items, tone }: { label: string; items: string[]; tone: "solid" | "muted" }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-navy/60">{label}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-2.5 text-[15px] font-medium leading-relaxed ${
              tone === "solid" ? "text-navy/90" : "text-navy/70"
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
 * reported/observed/uncertain/still-being-monitored. Tiles + body text
 * sized up and bolded (founder feedback, 2026-07-25) — this section is
 * meant to be skimmed at a glance, and the prior text-xs/text-sm weight
 * read too faint against the white card background. */
export function PatternMap({ chain, reported, observed, uncertain, monitoring }: PatternMapProps) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wide text-navy/60">Your Personal Pattern Map</p>

      {chain.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chain.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-full bg-navy/5 px-4 py-2 text-sm font-bold text-navy/90 sm:text-base">
                {step}
              </span>
              {i < chain.length - 1 && <span className="text-navy/40">→</span>}
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
