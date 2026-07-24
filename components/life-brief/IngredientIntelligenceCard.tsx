import type { IngredientIntelligenceProps } from "@/lib/life-brief/types";

const EVIDENCE_LABELS: Record<IngredientIntelligenceProps["evidenceClassification"], string> = {
  confirmed: "Confirmed",
  "partial-pending-review": "Partial — Pending Review",
  "not-yet-validated": "Not Yet Validated",
  blocked: "Pending Evidence Review",
};

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
  evidenceClassification,
  complementaryIngredients,
  safetyAndInteractionNotes,
  sourcingNote,
}: IngredientIntelligenceProps) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-navy">{ingredientName}</p>
          {botanicalName && <p className="text-xs italic text-navy/50">{botanicalName}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-navy/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy/50">
          {EVIDENCE_LABELS[evidenceClassification]}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-navy/70">{traditionalUseContext}</p>

      <p className="mt-2 text-sm leading-relaxed text-navy/70">
        <span className="font-semibold text-navy">Role in your formula: </span>
        {formulationRole}
      </p>

      <p className="mt-2 text-xs text-navy/50">{formAndAmount}</p>

      {complementaryIngredients.length > 0 && (
        <p className="mt-3 text-xs text-navy/50">
          <span className="font-semibold">Works alongside: </span>
          {complementaryIngredients.join(", ")}
        </p>
      )}

      {safetyAndInteractionNotes.length > 0 && (
        <p className="mt-2 text-xs leading-relaxed text-navy/50">
          <span className="font-semibold">Safety notes: </span>
          {safetyAndInteractionNotes.join(" ")}
        </p>
      )}

      {sourcingNote && <p className="mt-2 text-xs text-navy/40">{sourcingNote}</p>}
    </div>
  );
}
