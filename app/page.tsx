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

const steps = [
  {
    number: "01",
    title: "Tell us about you",
    body: "A short guided conversation — energy, sleep, stress, goals — takes about eight minutes, on your own time.",
  },
  {
    number: "02",
    title: "Get matched to a Track",
    body: "Your answers are matched against our Track library of time-tested herbal formulations, with a plain-language rationale for why.",
  },
  {
    number: "03",
    title: "Your protocol ships and adapts",
    body: "Your first shipment goes out, and your dashboard keeps a running profile you can revisit and refine as things change.",
  },
];

const trust = [
  "$249 deposit, fully credited to your first month",
  "Refundable per Founding Reservation terms",
  "Matched in one guided conversation",
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
          className="pointer-events-none absolute -right-24 -top-24 hidden h-[620px] w-[900px] sm:block lg:h-[720px] lg:w-[1040px]"
          style={{
            maskImage:
              "radial-gradient(ellipse 50% 50% at 50% 50%, black 10%, transparent 60%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 50% 50% at 50% 50%, black 10%, transparent 60%)",
          }}
        >
          <Image
            src="/products/morning-clarity-box.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-20"
            sizes="(min-width: 1024px) 720px, 620px"
          />
        </div>

        <Container className="relative flex flex-col items-center gap-6 py-24 text-center sm:py-32">
          <Eyebrow>Founding Reservation — Now Open</Eyebrow>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-navy sm:text-6xl">
            Your biology isn&apos;t generic. Your supplements shouldn&apos;t be
            either.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-navy/70">
            Supplement :: LIFE pairs a short guided intake with time-tested
            herbal formulations — sea moss, ashwagandha, elderberry, and more
            — matched to what you tell us about your body. Not a
            shelf-standard multivitamin. Not a guess.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/reserve" size="lg">
              Reserve Yours — $249
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

      {/* How it works preview */}
      <section className="py-24">
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Three steps. No shelf-guessing.
            </h2>
            <p className="mt-4 text-navy/70">
              From first conversation to a protocol built around you.
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
      <section className="border-y border-navy/10 bg-white/40 py-24">
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Nine Tracks. Matched, not marketed.
            </h2>
            <p className="mt-4 text-navy/70">
              Every Track is built around a real need, using traditional
              herbal and mineral ingredients. Your intake determines which
              one — or combination — fits you.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {previewTracks.map((track) => (
              <div
                key={track.id}
                className="rounded-2xl border border-navy/10 bg-cream p-6"
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

      {/* Founding Reservation */}
      <section className="py-24">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Founding Membership</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Reserve now, decide nothing yet.
            </h2>
            <p className="mt-4 text-navy/70">
              A $249 deposit holds your spot as a Founding Member. It&apos;s
              fully credited toward your first month when we go live — and
              fully refundable per the Founding Reservation terms if it&apos;s
              not for you.
            </p>
            <LinkButton href="/reserve" size="lg" className="mt-8">
              Reserve Yours — $249
            </LinkButton>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              "Founding pricing locked in before public launch",
              "Deposit fully credited to your first month's subscription",
              "Fully refundable per the Founding Reservation terms",
              "First in line to complete intake and receive your protocol",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-xl border border-navy/10 bg-white/50 p-4"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <p className="text-sm text-navy/70">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="border-t border-navy/10 bg-navy py-20 text-cream">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to find your protocol?
          </h2>
          <p className="max-w-xl text-cream/70">
            Reserve your Founding spot, then take an eight-minute intake
            whenever you&apos;re ready. No pressure, no shelf-standard
            multivitamin.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/reserve" size="lg">
              Reserve Yours — $249
            </LinkButton>
            <LinkButton href="/faq" variant="secondary" size="lg" className="!border-cream/20 !text-cream hover:!bg-cream/5">
              Read the FAQ
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
