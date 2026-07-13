/**
 * Per-track "atmosphere" backdrop images — decorative, thematic
 * photography used behind the "Your Botanical Compounds" education
 * sections (app/intake/IntakeChat.tsx, app/dashboard/page.tsx), distinct
 * from the literal product-packaging photos in lib/tracks.ts's `image`
 * field.
 *
 * Source: user-supplied AI-generated lifestyle vignettes
 * (public/products/SKU-collection-2.jpg, SKU-collection-3.jpg), cropped
 * into public/tracks-atmosphere/<track-id>.jpg. The box-front copy visible
 * in these source photos is AI-generated gibberish, not real product
 * text — that's fine for THIS use since the image is shown as a
 * background with a color-wash overlay (see the `atmosphereClassName`
 * usage at each call site), not as a legible foreground packaging shot.
 * Do not use these images anywhere the box text would be readable at
 * full opacity/size.
 *
 * Mapping was a judgment call based on thematic fit (e.g. purple velvet +
 * lavender + amethyst -> PM Calm's calming positioning; icy/frost ->
 * Immunity's cold-and-flu-season framing) since the source images don't
 * carry the track identity in any reliable way — see the memory file for
 * the full reasoning per track.
 */
export const TRACK_ATMOSPHERE: Record<string, string> = {
  "daily-restore": "/tracks-atmosphere/daily-restore.jpg",
  "pm-calm": "/tracks-atmosphere/pm-calm.jpg",
  reset: "/tracks-atmosphere/reset.jpg",
  vitality: "/tracks-atmosphere/vitality.jpg",
  immunity: "/tracks-atmosphere/immunity.jpg",
  "morning-clarity": "/tracks-atmosphere/morning-clarity.jpg",
  "womens-rhythm": "/tracks-atmosphere/womens-rhythm.jpg",
  "mens-rhythm": "/tracks-atmosphere/mens-rhythm.jpg",
  "cognitive-focus": "/tracks-atmosphere/cognitive-focus.jpg",
};

export function getTrackAtmosphere(trackId: string | undefined): string | undefined {
  return trackId ? TRACK_ATMOSPHERE[trackId] : undefined;
}
