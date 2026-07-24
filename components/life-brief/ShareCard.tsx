import type { ShareCardProps } from "@/lib/life-brief/types";

/**
 * P3-8, Page 10 — the private-safe LIFE Map share card ("sneeze"
 * feature). Renders ONLY the four fields on ShareCardProps — see that
 * type's doc-comment in lib/life-brief/types.ts for why the type shape
 * itself is the privacy control here, and why real (non-mock) wiring
 * must construct the props object as an explicit field-by-field literal,
 * never via spread from a larger subscriber-data record.
 */
export function ShareCard({ lifePattern, topStrength, currentOpportunity, ninetyDayIntention }: ShareCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-copper/30 bg-white/80 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-copper">My LIFE Map</p>
      <h3 className="mt-3 font-serif text-2xl text-navy">{lifePattern}</h3>

      <div className="mt-5 flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/40">Top Strength</p>
          <p className="mt-0.5 text-[15px] font-medium text-navy/90">{topStrength}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/40">Current Opportunity</p>
          <p className="mt-0.5 text-[15px] font-medium text-navy/90">{currentOpportunity}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/40">90-Day Intention</p>
          <p className="mt-0.5 text-[15px] font-medium text-navy/90">{ninetyDayIntention}</p>
        </div>
      </div>

      <p className="mt-6 text-xs text-navy/40">Supplement :: LIFE — yourlifeprotocol.com</p>
    </div>
  );
}
