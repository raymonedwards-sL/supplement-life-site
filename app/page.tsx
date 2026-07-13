import Link from "next/link";
import Image from "next/image";
import { TRACKS } from "@/lib/tracks";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

const PREVIEW_TRACK_IDS = [
  "daily-restore",
  "pm-calm",
  "immunity",
  "cognitive-focus",
  "womens-rhythm",
  "mens-rhythm",
];

const failureFactors = [
  "age",
  "stress",
  "recovery",
  "sleep",
  "hormones",
  "lifestyle",
  "nutrition",
  "environmental exposure",
  "changing goals",
];

const positioningPoints = [
  "Powered by conversation.",
  "Guided by deterministic wellness modeling.",
  "Grounded in traditional botanical knowledge.",
  "Continuously personalized.",
];

const steps = [
  {
    number: "01",
    title: "Understand Your Biology",
    body: "A guided conversation exploring how you actually live — sleep, stress, movement, recovery, focus, nutrition, energy, priorities. No lab work required.",
  },
  {
    number: "02",
    title: "Build Your Protocol",
    body: "Your responses are weighed against our Botanical Track library to identify what's most aligned with your lifestyle — with a plain-language rationale for every recommendation.",
  },
  {
    number: "03",
    title: "Improve Over Time",
    body: "Great wellness isn't static. As your life changes, your protocol evolves with it — revisit your profile any time from your dashboard.",
  },
];

const signals = [
  "Low energy",
  "Poor sleep & recovery",
  "Brain fog",
  "Hormonal shifts",
  "Inflammation",
  "Slower immune response",
  "Digestive discomfort",
  "Reduced resilience",
];

const reservationBenefits = [
  "$249/month for your first 6 months — half the $499/month public price starting October 2026",
  "Early access to every Botanical Track",
  "Priority onboarding",
  "Ongoing protocol refinement",
  "Exclusive future releases",
];

const trust = [
  "$249/month for 6 months — half the $499/month public price starting October 2026",
  "Refundable per Founding Subscriber Program terms",
  "An ongoing relationship with Sage, Your LIFE Guide, not a one-time match",
];

export default function Home() {
  const previewTracks = PREVIEW_TRACK_IDS.map((id) =>
    TRACKS.find((t) => t.id === id)
  ).filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-navy/10">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-[280px] w-[280px] sm:h-[620px] sm:w-[620px] lg:h-[720px] lg:w-[720px]"
          style={{
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 75%)",
          }}
        >
          <Image
            src="/products/morning-clarity-box.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-70"
            sizes="(min-width: 1024px) 720px, (min-width: 640px) 620px, 280px"
          />
        </div>

        <Container className="relative flex flex-col items-center gap-6 py-24 text-center sm:py-32">
          <Eyebrow>Founding Subscriber Program — Now Open</Eyebrow>
          <div className="relative px-2 py-2 sm:px-4 sm:py-3">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 58% 65% at 50% 50%, #F5EFE6 60%, transparent 82%)",
              }}
            />
            <h1 className="relative max-w-3xl text-4xl font-semibold tracking-tight text-navy sm:text-6xl">
              The second half of your life deserves a better protocol.
            </h1>
            <p className="relative mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy/70">
              The fatigue that lingers no matter how much you sleep. The
              recovery that used to take a day and now takes a week. The
              mental fog that shows up right when you need to be sharpest.
              These aren&apos;t things to just accept — they&apos;re signals.{" "}
              <strong className="font-semibold text-navy">Supplement :: LIFE</strong> builds a
              bespoke <strong className="font-semibold text-navy">botanical protocol</strong>{" "}
              around your actual biology and lifestyle, engineered for the demands
              of a full, high-performing life after 35.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/reserve" size="lg">
              Reserve Your Founding Subscription
            </LinkButton>
            <LinkButton href="/how-it-works" variant="secondary" size="lg">
              See How It Works
            </LinkButton>
          </div>
          <ul className="mt-6 flex flex-col flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-navy/50 sm:flex-row">
            {trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-copper" />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Why most supplements fail */}
      <section className="py-24">
        <Container className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Why most supplements fail.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            Most supplements were designed for everyone. So they end up being
            perfect for almost no one. Generic multivitamins assume every
            body has the same needs. They don&apos;t account for:
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {failureFactors.map((factor) => (
              <span
                key={factor}
                className="rounded-full bg-navy/5 px-4 py-1.5 text-sm capitalize text-navy/70"
              >
                {factor}
              </span>
            ))}
          </div>
          <p className="mt-6 font-serif text-2xl text-navy">
            Your protocol should.
          </p>
          <p className="mt-6 leading-relaxed text-navy/70">
            This isn&apos;t another discount multivitamin subscription
            competing for shelf space, and taking more of them rarely means
            better results. Supplement :: LIFE is a single, precisely built
            protocol for people who&apos;ve decided their long-term vitality
            deserves the same level of investment as everything else they
            take seriously.
          </p>
        </Container>
      </section>

      {/* Your body speaks */}
      <section className="border-y border-navy/10 bg-white/40 py-24">
        <Container className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Your body speaks.
          </h2>
          <p className="mt-2 text-lg text-navy/70">
            Most people simply aren&apos;t listening.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {signals.map((signal) => (
              <div
                key={signal}
                className="rounded-xl border border-navy/10 bg-cream px-4 py-3 text-center text-sm font-medium text-navy/70"
              >
                {signal}
              </div>
            ))}
          </div>
          <p className="mt-8 leading-relaxed text-navy/70">
            These aren&apos;t random. They&apos;re signals. Our intake helps
            organize those signals into a personalized wellness profile so
            your botanical recommendations are based on your life — not
            marketing trends.
          </p>
        </Container>
      </section>

      {/* Meet Your LIFE Guide */}
      <section className="py-24">
        <Container className="max-w-3xl">
          <Eyebrow>Your LIFE Guide</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Meet Sage, Your LIFE Guide.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            Not another chatbot. Not another quiz. Sage is an intelligent
            wellness agent that learns how you live — not just how old you
            are. It builds a comprehensive personal wellness
            profile and recommends the Botanical Tracks that best align
            with your lifestyle today. This isn&apos;t a one-time quiz
            result: as you share more about how your protocol is working
            for you, your profile deepens and your recommendations evolve
            — a bespoke system built to keep pace with your actual life,
            not a static formula you&apos;re locked into.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {positioningPoints.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-navy/10 bg-white/50 p-4 text-sm font-medium text-navy/70"
              >
                {point}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Three-Step Journey */}
      <section className="border-y border-navy/10 bg-white/40 py-24">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Your LIFE Journey</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Understand. Build. Improve.
            </h2>
            <p className="mt-4 text-navy/70">
              From first conversation to a protocol built around you — and
              rebuilt as you change.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <p className="font-serif text-3xl text-copper/50">
                  {step.number}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/60">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/how-it-works"
            className="mt-10 inline-block text-sm font-semibold text-copper hover:text-copper/80"
          >
            Read the full process &rarr;
          </Link>
        </Container>
      </section>

      {/* Tracks grid */}
      <section className="relative overflow-hidden py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-[200px] sm:w-[460px] lg:w-[640px]"
          style={{
            maskImage: "linear-gradient(to left, black 45%, transparent 92%)",
            WebkitMaskImage:
              "linear-gradient(to left, black 45%, transparent 92%)",
          }}
        >
          <Image
            src="/lifestyle/product-line.jpg"
            alt=""
            fill
            className="object-cover opacity-60"
            sizes="(min-width: 1024px) 640px, (min-width: 640px) 460px, 200px"
          />
        </div>

        <Container className="relative">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Nine Botanical Tracks. Thousands of combinations.
            </h2>
            <p className="mt-4 text-navy/70">
              Most people don&apos;t need everything. They need the right
              things. Each Botanical Track was designed around a specific
              wellness objective using thoughtfully selected botanical
              ingredients traditionally used to support everyday wellbeing.
              Your protocol may include one — or several — working together.
            </p>
          </div>
          <div className="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {previewTracks.map((track) => (
              <div
                key={track.id}
                className="rounded-2xl border border-navy/10 bg-white/50 p-6"
              >
                <h3 className="text-lg font-semibold text-copper">
                  {track.name}
                </h3>
                <p className="mt-2 text-sm text-navy/60">
                  {track.consumerNeed}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {track.ingredients.slice(0, 3).map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full bg-navy/5 px-3 py-1 text-xs text-navy/60"
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

      {/* Why 35 teaser */}
      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Why 35?</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Why wellness changes after 35.
          </h2>
          <p className="mt-4 leading-relaxed text-navy/70">
            Beginning in our mid-thirties, many people notice subtle shifts —
            recovery slows, stress lasts longer, sleep becomes lighter. None
            of this means you&apos;re &ldquo;old.&rdquo; It means your
            biology has entered a different chapter.
          </p>
          <Link
            href="/wellness-after-35"
            className="mt-4 inline-block text-sm font-semibold text-copper hover:text-copper/80"
          >
            Read why &rarr;
          </Link>
        </Container>
      </section>

      {/* Founder philosophy teaser */}
      <section className="py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Our Story</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Why we built Supplement :: LIFE.
          </h2>
          <p className="mt-4 font-serif text-xl leading-relaxed text-navy/80">
            The wellness industry became louder. More products. More
            influencers. More promises. Yet people were still left asking
            the same question: &ldquo;What should I actually take?&rdquo;
          </p>
          <Link
            href="/our-story"
            className="mt-4 inline-block text-sm font-semibold text-copper hover:text-copper/80"
          >
            Read our story &rarr;
          </Link>
        </Container>
      </section>

      {/* Founding Subscriber Program benefits */}
      <section className="border-y border-navy/10 bg-white/40 py-24">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Founding Subscriber Program</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Reserve first access to your Personalized LIFE Protocol.
            </h2>
            <p className="mt-4 text-navy/70">
              Your $249 deposit reserves your spot for first access to
              Supplement :: LIFE. It&apos;s fully credited toward your first
              six months of your Protocol Subscription at the Founding rate
              of $249/month — half the $499/month regular subscription
              price we&apos;ll offer the public starting October 2026 — and
              fully refundable per the Founding Subscriber Program terms.
            </p>
            <LinkButton href="/reserve" size="lg" className="mt-8">
              Reserve Your Founding Subscription
            </LinkButton>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {reservationBenefits.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-navy/10 bg-cream p-4"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <p className="text-sm text-navy/70">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="bg-navy py-20 text-cream">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next decade starts with the decisions you make today.
          </h2>
          <p className="max-w-xl text-cream/70">
            Don&apos;t settle for another generic supplement. Build a
            protocol designed around the person you&apos;re becoming.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/reserve" size="lg">
              Reserve Your Founding Subscription
            </LinkButton>
            <LinkButton
              href="/faq"
              variant="secondary"
              size="lg"
              className="!border-cream/20 !text-cream hover:!bg-cream/5"
            >
              Read the FAQ
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
