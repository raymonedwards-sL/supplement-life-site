"use client";

import { useState } from "react";
import type { WeeklyCheckInSpec } from "@/lib/life-brief/types";

export type CheckInHistoryRow = {
  question: string;
  answer: string;
  priority_marker: boolean;
  created_at: string;
};

const SCALE = [1, 2, 3, 4, 5];

/**
 * P3-7's weekly check-in, made real (docs/SAGE_Weekly_CheckIn_Loop_Gap2.md)
 * — replaces the static, read-only question list Roadmap.tsx used to
 * render. `weeklyCheckIn.questions`' last entry ("How's your top priority
 * area trending?") is a generic duplicate of the dynamic
 * `priorityMarkerQuestion` shown alongside it, so only the personalized
 * version is asked here, not both. The final static question ("Any side
 * effects to flag?") is free text, not a 1-5 scale — side effects need
 * real detail, not a number, and is optional since not everyone has one.
 *
 * `initiallyBlocked`/`nextAvailableAtIso` are resolved server-side by
 * Roadmap.tsx (a Server Component) rather than computed here against
 * Date.now() — this component never reads wall-clock time itself, which
 * would otherwise be both a render-purity issue and an SSR/hydration
 * mismatch risk. A fresh submission overrides the blocked state locally
 * via `acknowledgment`, which is checked first below.
 */
export function WeeklyCheckInForm({
  weeklyCheckIn,
  initiallyBlocked,
  nextAvailableAtIso,
  history,
}: {
  weeklyCheckIn: WeeklyCheckInSpec;
  initiallyBlocked: boolean;
  nextAvailableAtIso: string | null;
  history: CheckInHistoryRow[];
}) {
  const genericQuestions = weeklyCheckIn.questions.slice(0, 6);
  const sideEffectsQuestion = weeklyCheckIn.questions[7] ?? "Any side effects to flag?";
  const scaleQuestions = [...genericQuestions, weeklyCheckIn.priorityMarkerQuestion];

  const [scaleAnswers, setScaleAnswers] = useState<Record<string, number>>({});
  const [sideEffects, setSideEffects] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgment, setAcknowledgment] = useState<string | null>(null);

  const blocked = initiallyBlocked && !acknowledgment;
  const allAnswered = scaleQuestions.every((q) => scaleAnswers[q] != null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const answers = [
        ...genericQuestions.map((q) => ({ question: q, answer: String(scaleAnswers[q]) })),
        {
          question: weeklyCheckIn.priorityMarkerQuestion,
          answer: String(scaleAnswers[weeklyCheckIn.priorityMarkerQuestion]),
          priorityMarker: true,
        },
        ...(sideEffects.trim() ? [{ question: sideEffectsQuestion, answer: sideEffects.trim() }] : []),
      ];

      const res = await fetch("/api/dashboard/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

      setAcknowledgment(data.acknowledgment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (acknowledgment) {
    return (
      <div className="mt-3 rounded-xl border border-copper/20 bg-copper/5 p-4">
        <p className="text-sm font-semibold text-navy">Check-in received.</p>
        <p className="mt-1 text-sm leading-relaxed text-navy/80">{acknowledgment}</p>
        {history.length > 0 && <CheckInHistory rows={history} />}
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="mt-3">
        <p className="text-sm text-navy/60">
          You&apos;ve already checked in this week.
          {nextAvailableAtIso && (
            <>
              {" "}
              Next check-in available{" "}
              {new Date(nextAvailableAtIso).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.
            </>
          )}
        </p>
        {history.length > 0 && <CheckInHistory rows={history} />}
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {scaleQuestions.map((q) => (
          <div key={q}>
            <p className="text-sm font-medium text-navy/85">{q}</p>
            <div className="mt-1.5 flex gap-1.5">
              {SCALE.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScaleAnswers((prev) => ({ ...prev, [q]: n }))}
                  className={`h-8 w-8 rounded-full border text-sm font-semibold transition-colors ${
                    scaleAnswers[q] === n
                      ? "border-copper bg-copper text-cream"
                      : "border-navy/20 text-navy/70 hover:border-copper/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-navy/85" htmlFor="check-in-side-effects">
          {sideEffectsQuestion} <span className="font-normal text-navy/40">(optional)</span>
        </label>
        <textarea
          id="check-in-side-effects"
          value={sideEffects}
          onChange={(e) => setSideEffects(e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          placeholder="Nothing to flag, or describe briefly…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="self-start rounded-full bg-copper px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Check-In"}
      </button>

      {history.length > 0 && <CheckInHistory rows={history} />}
    </div>
  );
}

/** Grouped by calendar day, not an exact submission id — check-ins are
 * weekly (7-day server-enforced cadence in app/api/dashboard/check-in/
 * route.ts), so two real submissions landing on the same day isn't a
 * case this lightweight history view needs to handle precisely. */
function CheckInHistory({ rows }: { rows: CheckInHistoryRow[] }) {
  const groups = new Map<string, CheckInHistoryRow[]>();
  for (const row of rows) {
    const key = new Date(row.created_at).toDateString();
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }
  const sortedKeys = Array.from(groups.keys()).slice(0, 5);

  return (
    <div className="mt-4 border-t border-navy/10 pt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-navy/50">Check-In History</p>
      <div className="mt-2 flex flex-col gap-2">
        {sortedKeys.map((key) => (
          <details key={key} className="rounded-lg bg-navy/5 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-navy/80">
              {new Date(key).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {(groups.get(key) ?? []).map((row, i) => (
                <li key={i} className="text-xs leading-relaxed text-navy/60">
                  <span className="font-medium text-navy/70">{row.question}</span> {row.answer}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
