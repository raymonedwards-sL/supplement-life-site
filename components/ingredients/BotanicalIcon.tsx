import type { IngredientFamily } from "@/lib/ingredient-education";

/**
 * Stylized line-art badge icon system for ingredient education cards.
 *
 * There is no photorealistic AI image-generation tool available in this
 * build environment, so rather than attempt (and likely botch) realistic
 * per-species botanical illustration by hand-coding SVG paths, this takes
 * a deliberately different approach: one clean, on-brand icon per
 * ingredient "family" (root / leaf / flower / berry / bark / mushroom /
 * algae / mineral), reused across every ingredient in that family. It's a
 * consistent visual system, not a photo substitute — think of it as a
 * badge/mark, similar to how the site's own "S∷L" mark works.
 */
export function BotanicalIcon({
  family,
  className = "h-10 w-10",
}: {
  family: IngredientFamily;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="24" cy="24" r="23" fill="var(--color-cream, #FBF7F1)" stroke="currentColor" strokeOpacity="0.15" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {FAMILY_PATHS[family]}
      </g>
    </svg>
  );
}

const FAMILY_PATHS: Record<IngredientFamily, React.ReactNode> = {
  root: (
    <>
      <path d="M24 12v10" />
      <path d="M24 22c-3 2-4 6-3.5 11M24 22c3 2 4 6 3.5 11M24 22c-1.5 3-1.5 8-1 13M24 22c1.5 3 1.5 8 1 13" />
      <path d="M18 14c2-2 4-2.5 6-2s4 0 6 2" />
    </>
  ),
  leaf: (
    <>
      <path d="M24 13c7 3 10 9 8 17-8 2-14-1-17-8-2-5 1-9 9-9Z" />
      <path d="M24 13c-1 6-1 12 1 22" />
    </>
  ),
  flower: (
    <>
      <circle cx="24" cy="24" r="2.6" />
      <ellipse cx="24" cy="17" rx="3.2" ry="5.4" />
      <ellipse cx="24" cy="31" rx="3.2" ry="5.4" />
      <ellipse cx="17" cy="24" rx="5.4" ry="3.2" />
      <ellipse cx="31" cy="24" rx="5.4" ry="3.2" />
      <path d="M24 34v3" />
    </>
  ),
  berry: (
    <>
      <circle cx="20" cy="27" r="4.4" />
      <circle cx="27" cy="30" r="4.4" />
      <circle cx="25" cy="21" r="4.4" />
      <path d="M24 14c1 2 1.5 3.5 1 5.5" />
      <path d="M21 14.5c.6 1.6.9 2.8.6 4.2" />
    </>
  ),
  bark: (
    <>
      <path d="M15 12v24" />
      <path d="M22 12v24" />
      <path d="M29 12v24" />
      <path d="M15 17c3 1.5 4-1.5 7 0s4-1.5 7 0" />
      <path d="M15 25c3 1.5 4-1.5 7 0s4-1.5 7 0" />
      <path d="M15 33c3 1.5 4-1.5 7 0s4-1.5 7 0" />
    </>
  ),
  mushroom: (
    <>
      <path d="M14 22c0-6 4.5-10 10-10s10 4 10 10c-6 2-14 2-20 0Z" />
      <path d="M20 22v12a4 4 0 0 0 8 0V22" />
    </>
  ),
  algae: (
    <>
      <path d="M16 34c-2-6 1-9-1-15" />
      <path d="M22 34c-2-8 2-11-1-19" />
      <path d="M28 34c-2-6 2-8 0-14" />
      <path d="M32 34c-1.5-5 1.5-7 .5-12" />
    </>
  ),
  mineral: (
    <>
      <path d="M24 11 33 24 24 37 15 24Z" />
      <path d="M24 11v26M15 24h18" />
    </>
  ),
};
