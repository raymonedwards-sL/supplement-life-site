import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Why we built Supplement :: LIFE — a personalized botanical wellness protocol built around one person: you.",
};

export default function OurStory() {
  return (
    <>
      <section className="border-b border-navy/10 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Our Story</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            Why we built Supplement :: LIFE.
          </h1>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-6 text-lg leading-relaxed text-navy/80">
            <p>
              The wellness industry became louder. More products. More
              influencers. More promises. Yet people were still left asking
              the same question:
            </p>
            <p className="font-serif text-2xl text-navy">
              &ldquo;What should I actually take?&rdquo;
            </p>
            <p>We believed there had to be a better answer.</p>
            <p className="font-serif text-2xl text-navy">
              One conversation. One protocol. Built around one person. You.
            </p>
            <p>
              So we built Supplement :: LIFE around a simple idea: wellness
              after 35 isn&apos;t generic, and it shouldn&apos;t be treated
              that way. Instead of another shelf of one-size-fits-all
              bottles, we built a guided conversation that gets to know how
              you actually live, and matches you to Botanical Tracks —
              formulations built from time-tested herbal and mineral
              ingredients — designed around real, specific wellness needs.
            </p>
            <p>
              We&apos;re starting with a personalized botanical protocol. Over
              time, we intend for Supplement :: LIFE to grow into a broader
              wellness companion for the decades ahead — one that keeps
              learning how you live and keeps your protocol current as your
              life changes, rather than a one-time quiz result that sits on
              a shelf.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-navy/50">
            Supplement :: LIFE provides personalized wellness information,
            not medical advice, a diagnosis, or a treatment plan. Always
            consult your healthcare provider before starting any new
            supplement.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Join us from the beginning.
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
