import type { Metadata } from "next";
import Image from "next/image";
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
          </div>
        </Container>
      </section>

      {/* Founder */}
      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Founder</Eyebrow>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-copper/30">
              <Image
                src="/Ray-founder.png"
                alt="Ray Edwards, Founder of Supplement :: LIFE"
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-navy">Ray Edwards</p>
              <p className="text-sm text-navy/50">Founder, Supplement :: LIFE</p>
              <div className="mt-4 flex flex-col gap-5 leading-relaxed text-navy/80">
                <p>
                  My own supplement journey after 35 is what started this. I
                  kept running into the same wall: formulas built for whoever
                  I was in my twenties, that never adjusted as my body
                  actually changed, and that never fit the way I actually
                  live. Off-the-shelf wellness wasn&apos;t built to evolve
                  with anyone — it&apos;s built to sit on a shelf.
                </p>
                <p>
                  That frustration is what led me to build Supplement ::
                  LIFE as an adaptive botanical program — one designed
                  around the piece of adult wellness I think matters most
                  and gets talked about least: cellular rejuvenation.
                </p>
                <p>
                  Professionally, my background is in environmental risk
                  intelligence — building systems at pūrtec that model risk
                  and adapt as conditions change in real time. That same
                  discipline shaped how Supplement :: LIFE works: a protocol
                  built from real data about how you actually live, not a
                  static formula, designed to keep adapting as your biology
                  changes — the same way any good risk model has to.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <p className="text-lg leading-relaxed text-navy/80">
            We&apos;re starting with a personalized botanical protocol. Over
            time, we intend for Supplement :: LIFE to grow into a broader
            wellness companion for the decades ahead — one that keeps
            learning how you live and keeps your protocol current as your
            life changes, rather than a one-time quiz result that sits on a
            shelf.
          </p>
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
