import type { Metadata } from "next";
import Image from "next/image";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { TRACKS } from "@/lib/tracks";
import { getIngredientEducationList } from "@/lib/ingredient-education";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import {
  FEATURED_INGREDIENTS_BY_TRACK,
  PUBLIC_SUMMARY_OVERRIDES,
} from "@/lib/featured-ingredients";

export const metadata: Metadata = {
  title: "The Ingredient Science",
  description:
    "A look at the key botanicals behind every Supplement :: LIFE Botanical Track, explained in plain language — before you ever reserve a spot.",
};

/**
 * Public, pre-payment ingredient credibility page — trust-audit item #4
 * (2026-07-13 audit): ingredient-level mechanism reasoning previously only
 * surfaced inside Sage's conversation, which only starts after the $249
 * deposit. This page reuses the same subscriber-safe content
 * (lib/ingredient-education.ts) and components (IngredientCard,
 * BotanicalIcon) already shown post-signup, so a skeptical visitor can
 * evaluate the brand's actual depth of ingredient knowledge before paying
 * anything — and so the pre- and post-signup experience stay visually and
 * editorially consistent rather than feeling like two different products.
 *
 * 2026-07-17: pulled back from showing every Track's complete ingredient
 * roster (that made the full formulation scrapeable/copyable — a real
 * proprietary-info concern) to a curated sampling of 1-2 "hero" ingredients
 * per Track, defined in lib/featured-ingredients.ts (shared with the
 * homepage Tracks teaser, so both public surfaces show the same
 * intentional sample rather than two different arbitrary cuts).
 * lib/tracks.ts's full `ingredients` arrays are untouched and still power
 * the private, post-payment/assessment surfaces (dashboard, LIFE Brief,
 * Sage's intake reasoning), which should keep showing a subscriber their
 * own complete formula.
 */
export default function Ingredients() {
  // Public-page-only: swap in a redacted summary for any entry whose
  // shared write-up (also used on the private dashboard/intake summary)
  // names a companion ingredient that isn't part of this public
  // sampling — see PUBLIC_SUMMARY_OVERRIDES's doc comment.
  const featuredIngredients = getIngredientEducationList(
    TRACKS.flatMap((t) => FEATURED_INGREDIENTS_BY_TRACK[t.id] ?? [])
  ).map((ingredient) => {
    const override = PUBLIC_SUMMARY_OVERRIDES[ingredient.name];
    return override ? { ...ingredient, summary: override } : ingredient;
  });

  return (
    <>
      <section className="border-b border-navy/10 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>The Ingredient Science</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            A look at what&apos;s inside.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            Every Supplement :: LIFE Botanical Track is built from named,
            traditional herbal and mineral ingredients — never a vague
            &ldquo;proprietary blend&rdquo; footnote hiding what&apos;s
            actually in the bottle. Below is a look at a few of the key
            botanicals behind each Track, explained in plain language. Your
            complete formula, and the full reasoning behind every ingredient
            in it, is revealed in your personal LIFE Brief after your
            assessment.
          </p>
        </Container>
        <Container className="mt-12 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-navy/10 shadow-sm">
            <Image
              src="/products/hero-botanicals.png"
              alt="Hero Botanicals — labeled photography of key ingredients used across Supplement :: LIFE Tracks, including Burdock, Sea Moss, Ashwagandha, Elderberry, Reishi, Bacopa monnieri, Dandelion Root, Vitex, Ginger, Damiana, Raspberry Leaf, Sarsaparilla, Kudzu Root Extract, Lion's Mane, Valerian Root, Cascara Sagrada, and Longjack"
              width={1672}
              height={941}
              priority
              className="h-auto w-full object-cover"
              sizes="(min-width: 1024px) 1024px, 100vw"
            />
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">
            A few of the botanicals behind each Track
          </h2>
          <p className="mt-3 max-w-3xl text-navy/70">
            This is a sample, not each Track&apos;s complete formulation —
            your full ingredient list and the reasoning behind it live in
            your personal LIFE Brief. Ingredients do recur across Tracks by
            design, though: a shared mineral or digestive-support base shows
            up in several formulas because it genuinely belongs there, not
            by accident.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => (
              <div
                key={track.id}
                className="group overflow-hidden rounded-2xl border border-navy/10 bg-white/50 transition-shadow duration-300 hover:shadow-xl hover:shadow-navy/10"
              >
                <div className="relative h-56 w-full overflow-hidden bg-cream">
                  <Image
                    src={track.image}
                    alt={`${track.name} Botanical Track packaging`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-copper">{track.name}</h3>
                  <p className="mt-1 text-sm text-navy/60">{track.consumerNeed}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(FEATURED_INGREDIENTS_BY_TRACK[track.id] ?? []).map((ingredient) => (
                      <span
                        key={ingredient}
                        className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy"
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">
            A closer look at featured ingredients
          </h2>
          <p className="mt-3 max-w-2xl text-navy/70">
            What each one is, why it&apos;s formulated in, and a place to read
            more if you want to go deeper. This is a sample of our ingredient
            library, not the complete list for any single Track.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {featuredIngredients.map((ingredient) => (
              <div
                key={ingredient.name}
                className="shrink-0 grow-0 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.667rem)]"
              >
                <IngredientCard ingredient={ingredient} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <p className="text-sm leading-relaxed text-navy/50">
            Supplement :: LIFE provides personalized wellness information, not
            medical advice, a diagnosis, or a treatment plan. Wikipedia links
            are provided as a general reference, not medical guidance. Some
            ingredients carry individual cautions (for example, ginger has a
            mild anticoagulant adjacency worth mentioning if you take
            blood-thinning medication) — always talk to your healthcare
            provider before starting any new supplement, especially if you
            have a medical condition, take prescription medication, or are
            pregnant or nursing.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Ready to see which tracks fit your life?
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/reserve" size="lg">
              Reserve Your Founding Subscription
            </LinkButton>
            <LinkButton href="/how-it-works" variant="secondary" size="lg">
              See How It Works
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
