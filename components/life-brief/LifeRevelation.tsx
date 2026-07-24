import Image from "next/image";
import { findTrack } from "@/lib/tracks";
import type { LifeRevelationProps } from "@/lib/life-brief/types";

/** P3-1, Page 1 of the LIFE Brief report. */
export function LifeRevelation({
  dominantPattern,
  sageInterpretation,
  supportingSignals,
  topOpportunity,
  botanicalVisualTrackId,
  ninetyDayCta,
}: LifeRevelationProps) {
  const track = findTrack(botanicalVisualTrackId);

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white/70">
      <div className="grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-copper">Your LIFE Revelation</p>
          <h2 className="mt-3 font-serif text-3xl text-navy sm:text-4xl">{dominantPattern}</h2>
          <p className="mt-4 border-l-4 border-copper/30 pl-5 text-lg leading-relaxed text-navy/80">
            {sageInterpretation}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {supportingSignals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <p className="text-sm leading-relaxed text-navy/70">{signal}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-navy/60">
            Top opportunity: <span className="font-semibold text-navy">{topOpportunity}</span>
          </p>

          <p className="mt-8 font-serif text-xl text-navy">{ninetyDayCta}</p>
        </div>

        {track && (
          <div className="relative mx-auto h-56 w-32 shrink-0 overflow-hidden rounded-md shadow-sm">
            <Image src={track.image} alt={`${track.name} packaging`} fill sizes="128px" className="object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
