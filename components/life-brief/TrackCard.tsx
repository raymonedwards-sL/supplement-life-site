import Image from "next/image";
import { findTrack } from "@/lib/tracks";
import type { TrackCardProps } from "@/lib/life-brief/types";

const TIER_LABELS: Record<TrackCardProps["tier"], string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
};

const EVIDENCE_LABELS: Record<TrackCardProps["evidenceStrength"], string> = {
  confirmed: "Confirmed",
  "partial-pending-review": "Partial — Pending Review",
  "not-yet-validated": "Not Yet Validated",
  blocked: "Pending Evidence Review",
};

/** P3-4, Page 5 — "Why Sage Chose This" track cards. Renders whatever
 * tracks it's given (1-3), not a fixed 3 — EngineResult.recommendedTrackIds
 * is documented as 0-3 entries. */
export function TrackCard({
  track,
  tier,
  whySelected,
  ingredients,
  timingAndFormat,
  whatYouMayObserve,
  whatItIsNotFor,
  evidenceStrength,
  precautions,
  reconsiderConditions,
}: TrackCardProps) {
  const trackData = findTrack(track);

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white/70">
      <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr]">
        {trackData && (
          <div className="relative mx-auto h-48 w-28 shrink-0 overflow-hidden rounded-md shadow-sm lg:mx-0">
            <Image src={trackData.image} alt={`${trackData.name} packaging`} fill sizes="112px" className="object-cover" />
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-copper/70">{TIER_LABELS[tier]}</span>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy/50">
              Evidence: {EVIDENCE_LABELS[evidenceStrength]}
            </span>
          </div>
          <h3 className="mt-1 font-serif text-2xl text-navy">{trackData?.name ?? track}</h3>
          <p className="mt-1 text-sm text-navy/60">{timingAndFormat}</p>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Why Sage chose this</p>
            <ul className="mt-2 flex flex-col gap-2">
              {whySelected.map((reason, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy/75">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-navy/70">
            <span className="font-semibold text-navy">What you may observe: </span>
            {whatYouMayObserve}
          </p>

          {ingredients.length > 0 && (
            <p className="mt-3 text-sm text-navy/60">
              <span className="font-semibold text-navy/80">Ingredients: </span>
              {ingredients.join(", ")}
            </p>
          )}

          <p className="mt-4 text-xs leading-relaxed text-navy/50">
            <span className="font-semibold">Not intended for: </span>
            {whatItIsNotFor}
          </p>

          {precautions.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-navy/50">
              <span className="font-semibold">Precautions: </span>
              {precautions.join(" ")}
            </p>
          )}

          {reconsiderConditions.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-navy/50">
              <span className="font-semibold">We'd revisit this if: </span>
              {reconsiderConditions.join(" ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
