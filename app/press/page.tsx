import type { Metadata } from "next";
import Image from "next/image";
import { Container, Eyebrow } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Press & Media",
  description:
    "Press and media resources for Supplement :: LIFE — the story, the founder, and how to reach us for interviews.",
};

/**
 * Press/media landing page — built 2026-07-17 specifically as a link
 * destination for podcast/blog outreach, separate from the commercial
 * homepage. The homepage leads with pricing and checkout CTAs (by design,
 * for direct/paid acquisition traffic); this page deliberately has neither
 * — a host or producer clicking an outreach link should land on the story,
 * not a sales page, which is the single biggest driver of "this feels like
 * a pitch" resistance from media contacts. No pricing, no Reserve/Checkout
 * buttons anywhere on this page — keep it that way.
 */
export default function Press() {
  return (
    <>
      <section className="border-b border-navy/10 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Press &amp; Media</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            The story behind Supplement :: LIFE.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            Resources for journalists, podcast hosts, and wellness writers —
            the short version of what we&apos;re building, who&apos;s behind
            it, and how to reach us.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-3xl">
          <Eyebrow>At a Glance</Eyebrow>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Company", value: "LIFE Wellness Brands LLC" },
              { label: "Product", value: "Supplement :: LIFE" },
              { label: "Founder", value: "Ray Edwards" },
              { label: "Headquarters", value: "Las Vegas, Nevada" },
              {
                label: "What it is",
                value:
                  "A personalized botanical wellness protocol, matched through a guided conversation with Sage, Your LIFE Guide.",
              },
              {
                label: "Stage",
                value:
                  "Pre-launch — currently open to Founding Subscribers ahead of general availability.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-navy/10 bg-white/50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-navy">{item.value}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>The Story</Eyebrow>
          <div className="mt-6 flex flex-col gap-6 text-lg leading-relaxed text-navy/80">
            <p>
              The wellness industry became louder — more products, more
              influencers, more promises — and people were still left asking
              the same question: &ldquo;What should I actually take?&rdquo;
            </p>
            <p>
              Supplement :: LIFE starts from a different premise: that a
              wellness protocol should be built around one person&apos;s
              actual biology and lifestyle, not a shelf formula built for
              everyone in general and no one in particular. Every subscriber
              goes through a guided conversation with Sage, Your LIFE Guide
              — not a quiz, and not a chatbot reciting supplement facts —
              and is matched to one of nine Botanical Tracks built from
              named, traditional herbal and mineral ingredients. As a
              subscriber&apos;s life changes, Sage&apos;s recommendations
              are designed to change with it, rather than locking someone
              into a one-time result.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20">
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
                  kept running into the same wall: formulas built for
                  whoever I was in my twenties, that never adjusted as my
                  body actually changed. That frustration led me to build
                  Supplement :: LIFE as an adaptive botanical program, built
                  around the piece of adult wellness I think matters most
                  and gets talked about least: cellular rejuvenation.
                </p>
                <p>
                  Professionally, my background is in environmental risk
                  intelligence — building systems that model risk and adapt
                  as conditions change in real time. That same discipline
                  shaped how Supplement :: LIFE works: a protocol built from
                  real data about how someone actually lives, designed to
                  keep adapting as their biology changes.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Assets</Eyebrow>
          <p className="mt-4 leading-relaxed text-navy/70">
            Logo, founder photo, and product imagery are available on
            request — reach out below and we&apos;ll send over a full media
            kit sized however you need it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-8">
            <Image
              src="/branding/logo-dark-transparent.png"
              alt="Supplement :: LIFE logo"
              width={240}
              height={64}
              className="h-10 w-auto"
            />
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
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
            Interview requests &amp; press inquiries.
          </h2>
          <p className="max-w-xl text-navy/70">
            For interviews, guest appearances, or media assets, email us
            directly and we&apos;ll get back to you personally.
          </p>
          <a
            href="mailto:hello@yourlifeprotocol.com?subject=Press%20inquiry"
            className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream shadow-[0_0_0_5px_var(--color-ivory)] transition-shadow hover:bg-copper/90 hover:shadow-[0_0_0_7px_var(--color-ivory)]"
          >
            hello@yourlifeprotocol.com
          </a>
        </Container>
      </section>
    </>
  );
}
