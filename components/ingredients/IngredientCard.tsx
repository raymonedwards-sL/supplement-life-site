import { BotanicalIcon } from "./BotanicalIcon";
import { boldBotanicals } from "@/components/BoldBotanicals";
import type { IngredientEducation } from "@/lib/ingredient-education";

/**
 * Shared per-ingredient education card — used on both the post-intake
 * Wellness Profile Summary (app/intake/IntakeChat.tsx) and the dashboard's
 * "Your Botanical Compounds" section (app/dashboard/page.tsx), so the two
 * surfaces stay visually and editorially consistent.
 */
export function IngredientCard({ ingredient }: { ingredient: IngredientEducation }) {
  return (
    <div className="flex gap-4 rounded-xl border border-navy/10 bg-white/70 p-5">
      <div className="shrink-0 text-copper">
        <BotanicalIcon family={ingredient.family} className="h-11 w-11" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold text-navy">{ingredient.name}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy/70">{boldBotanicals(ingredient.summary)}</p>
        <a
          href={ingredient.wikipediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-copper underline underline-offset-2"
        >
          {ingredient.wikipediaLabel ?? ingredient.name} on Wikipedia
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden
          >
            <path d="M7 17 17 7M8 7h9v9" />
          </svg>
        </a>
      </div>
    </div>
  );
}
