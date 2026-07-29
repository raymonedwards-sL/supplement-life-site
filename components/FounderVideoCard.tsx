"use client";

import { useRef, useState } from "react";

const VIDEO_SRC = "/videos/supplement-life-intro-founder.mp4";
const POSTER_SRC = "/videos/supplement-life-intro-founder-poster.jpg";
const CAPTIONS_SRC = "/videos/supplement-life-intro-founder.vtt";

/**
 * Click-to-play founder trust video for /join. Same "wire it now, it
 * activates the moment the asset exists" pattern as the join-sizzle video
 * above it on this page — the card hides itself via onError until the mp4
 * actually lands in public/videos/.
 */
export default function FounderVideoCard() {
  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!available) return null;

  function play() {
    setPlaying(true);
    videoRef.current?.play();
  }

  return (
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-navy/10 bg-white/60 shadow-sm md:mx-0">
      <div className="relative aspect-[9/16] w-full bg-navy">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={POSTER_SRC}
          controls={playing}
          playsInline
          onError={() => setAvailable(false)}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
          <track
            kind="captions"
            src={CAPTIONS_SRC}
            srcLang="en"
            label="English"
            default
          />
        </video>

        {!playing && (
          <button
            type="button"
            onClick={play}
            aria-label="Play a message from our founder"
            className="absolute inset-0 flex items-center justify-center bg-navy/30 transition-colors hover:bg-navy/40"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-copper text-cream shadow-[0_0_0_6px_var(--color-ivory)] transition-transform hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                className="ml-1 h-6 w-6"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/40">
          A Message From Our Founder
        </p>
        <p className="mt-1 text-sm text-navy/70">
          Why we built Supplement :: LIFE — straight from the source.
        </p>
      </div>
    </div>
  );
}
