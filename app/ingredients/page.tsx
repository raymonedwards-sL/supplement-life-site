import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { TRACKS } from "@/lib/tracks";
import { getIngredientEducationList } from "@/lib/ingredient-education";
import { IngredientCard } from "@/components/ingredients/IngredientCard";

export const metadata: Metadata = {
  title: "Every Ingredient, Named",
  description:
    "Every ingredient in every Supplement :: LIFE Botanical Track, named and explained in plain language — before you ever reserve a spot.",
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
 */
export default function Ingredients() {
  const allIngredients = getIngredientEducationList(
    TRACKS.flatMap((t) => t.ingredients)
  );

  return (
    <>
      <section className="border-b border-navy/10 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>The Ingredient Science</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            Every ingredient, named.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            No proprietary blends. No &ldquo;other ingredients&rdquo; footnote
            hiding what&apos;s actually in the bottle. Every Botanical Track is
            built from named, traditional herbal and mineral ingredients, and
            every one of them is explained here in plain language — not locked
            behind an intake conversation or a deposit. See the reasoning for
            yourself before you decide anything.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">
            Which tracks use which ingredients
          </h2>
          <p className="mt-3 text-navy/70">
            Ingredients recur across tracks by design — a shared mineral or
            digestive-support base shows up in several formulas because it
            genuinely belongs there, not by accident.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TRACKS.map((track) => (
              <div
                key={track.id}
                className="rounded-2xl border border-navy/10 bg-white/50 p-6"
              >
                <h3 className="text-lg font-semibold text-copper">{track.name}</h3>
                <p className="mt-1 text-sm text-navy/60">{track.consumerNeed}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {track.ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">
            The full ingredient glossary
          </h2>
          <p className="mt-3 max-w-2xl text-navy/70">
            What each one is, why it&apos;s formulated in, and a place to read
            more if you want to go deeper.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allIngredients.map((ingredient) => (
              <IngredientCard key={ingredient.name} ingredient={ingredient} />
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
            ingredients carry individual cautions (for example, callaloo is
            high in Vitamin K and isn&apos;t recommended alongside
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
