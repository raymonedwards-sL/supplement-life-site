import type { IngredientIntelligenceProps } from "@/lib/life-brief/types";

// Note: evidenceClassification is still passed in from the adapter/mock data
// (it's part of IngredientIntelligenceProps) but is deliberately NOT
// rendered — same reasoning as TrackCard.tsx: it's an internal tracking
// field for the still-blocked Claims/Evidence Library (P1-3), not something
// a paying subscriber should see as a "Pending Evidence Review" badge.

/**
 * P3-5, Page 6 — deeper per-ingredient education for the LIFE Brief
 * report. Named IngredientIntelligenceCard (not "IngredientCard") to
 * avoid confusion with the existing, unrelated
 * components/ingredients/IngredientCard.tsx used on the dashboard and
 * post-intake summary — see lib/life-brief/types.ts for the full note.
 */
export function IngredientIntelligenceCard({
  ingredientName,
  botanicalName,
  traditionalUseContext,
  formulationRole,
  formAndAmount,
  citations,
  complementaryIngredients,
  safetyAndInteractionNotes,
  sourcingNote,
}: IngredientIntelligenceProps) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
      <div>
        <p className="text-base font-bold text-navy">{ingredientName}</p>
        {botanicalName && <p className="text-xs italic text-navy/50">{botanicalName}</p>}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-navy/85">{traditionalUseContext}</p>

      <p className="mt-2 text-sm leading-relaxed text-navy/85">
        <span className="font-bold text-navy">Role in your formula: </span>
        {formulationRole}
      </p>

      <p className="mt-2 text-xs text-navy/60">{formAndAmount}</p>

      {complementaryIngredients.length > 0 && (
        <p className="mt-3 text-xs text-navy/60">
          <span className="font-semibold">Works alongside: </span>
          {complementaryIngredients.join(", ")}
        </p>
      )}

      {safetyAndInteractionNotes.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-navy/60">
          <span className="font-semibold">Safety notes: </span>
          {safetyAndInteractionNotes.join(" ")}
        </p>
      )}

      {sourcingNote && <p className="mt-2 text-xs text-navy/40">{sourcingNote}</p>}

      {citations.length > 0 && (
        <div className="mt-3 border-t border-navy/10 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/40">Sources</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {citations.map((citation, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-navy/40">
                {citation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
