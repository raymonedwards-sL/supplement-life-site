import type { DailyRhythmProps, RhythmBlock } from "@/lib/life-brief/types";

const TIME_LABELS: Record<RhythmBlock["timeOfDay"], string> = {
  wake: "Wake",
  morning_activation: "Morning",
  midday_stability: "Midday",
  movement_window: "Afternoon",
  evening_recovery: "Evening",
  sleep_prep: "Night",
};

const CUE_FIELDS: { key: keyof RhythmBlock; label: string }[] = [
  { key: "botanicalTiming", label: "Botanical" },
  { key: "hydrationCue", label: "Hydration" },
  { key: "mealRhythm", label: "Meals" },
  { key: "movement", label: "Movement" },
  { key: "caffeineBoundary", label: "Caffeine" },
  { key: "recoveryPractice", label: "Recovery" },
  { key: "sageCheckIn", label: "Sage check-in" },
];

/** P3-6, Page 7 — the Daily LIFE Rhythm timeline, wake through sleep prep. */
export function DailyRhythm({ blocks, lifestyleCompatibilityNote }: DailyRhythmProps) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">Your Daily LIFE Rhythm</p>

      <div className="mt-5 flex flex-col gap-4">
        {blocks.map((block, i) => (
          <div key={i} className="flex gap-4 border-b border-navy/10 pb-4 last:border-b-0 last:pb-0">
            <div className="w-20 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-copper">
              {TIME_LABELS[block.timeOfDay]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">{block.label}</p>
              <div className="mt-1.5 flex flex-col gap-1">
                {CUE_FIELDS.map(({ key, label }) => {
                  const value = block[key];
                  if (!value || typeof value !== "string") return null;
                  return (
                    <p key={key} className="text-sm leading-relaxed text-navy/70">
                      <span className="font-medium text-navy/50">{label}: </span>
                      {value}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lifestyleCompatibilityNote && (
        <p className="mt-5 text-xs leading-relaxed text-navy/50">{lifestyleCompatibilityNote}</p>
      )}
    </div>
  );
}
