import Image from "next/image";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

const steps = [
  {
    title: "Reserve your spot",
    body: "A $249 Founding Subscription deposit holds your place and creates your account. It's fully credited toward your first six months of your Protocol Subscription at the Founding rate of $249/month — half the $499/month regular subscription price we'll offer the public starting October 2026 — and fully refundable per the Founding Subscriber Program terms.",
  },
  {
    title: "Meet Sage, Your LIFE Guide",
    body: "Log in and have a guided, in-depth conversation with Sage about how you actually live — sleep, stress, movement, recovery, focus, nutrition, energy, priorities. Take your time; there's no clock. It's a real conversation, not a quiz, and it's never a substitute for medical advice.",
  },
  {
    title: "Get matched to a Botanical Track",
    body: "Your responses are weighed against our Botanical Track library — formulations built around real needs like recovery, sleep onset, seasonal defense, or cycle comfort — using traditional herbal and mineral ingredients. You'll get a plain-language rationale for the match, not a black box.",
  },
  {
    title: "Your protocol ships",
    body: "Once we go live, everyone who's reserved is first in line to receive their personalized protocol. You'll get an email as soon as your shipment is on its way.",
  },
  {
    title: "Improve over time",
    body: "Great wellness isn't static. Your dashboard keeps a running wellness profile, and as your life changes, you can revisit your intake and adjust your Botanical Track — this isn't a one-and-done quiz result.",
  },
];

const positioningPoints = [
  "Powered by conversation.",
  "Guided by deterministic wellness modeling.",
  "Grounded in traditional botanical knowledge.",
  "Continuously personalized.",
];

export default function HowItWorks() {
  return (
    <>
      <section className="border-b border-navy/10 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>How It Works</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            From conversation to protocol.
          </h1>
          <p className="mt-4 text-lg text-navy/70">
            No lab panels, no 40-question quiz. Just a short conversation
            that gets you matched to a Botanical Track built around real
            ingredients and a real need.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {positioningPoints.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-navy/10 bg-white/50 p-3 text-center text-sm font-medium text-navy/70"
              >
                {point}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="flex gap-6 rounded-2xl border border-navy/10 bg-white/40 p-6 sm:p-8"
              >
                <div className="shrink-0 font-serif text-2xl text-copper/50">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-navy">
                    {step.title}
                  </h2>
                  <p className="mt-2 leading-relaxed text-navy/70">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl border border-navy/10">
            <Image
              src="/lifestyle/botanical-infusion.jpg"
              alt="A botanical infusion bottle beside dried marigold, lavender, rose hips, and chamomile"
              width={1376}
              height={768}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy">
              Formulated, not guessed
            </h2>
            <p className="mt-4 leading-relaxed text-navy/70">
              Every Botanical Track draws on time-tested herbal and mineral
              ingredients — things like sea moss, ashwagandha, elderberry,
              and bacopa — each included for a specific, plain-language role
              rather than a proprietary blend you can&apos;t read. Some
              ingredients carry individual cautions (for example, callaloo
              is high in Vitamin K and isn&apos;t recommended alongside
              blood-thinning medication), and your intake is built to flag
              those before a Botanical Track is recommended.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-navy/50">
              Supplement :: LIFE provides personalized wellness information,
              not medical advice, a diagnosis, or a treatment plan. If you
              have a medical condition, take prescription medication, or
              are pregnant or nursing, talk to your healthcare provider
              before starting any new supplement.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Ready to get started?
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LinkButton href="/reserve" size="lg">
              Reserve Your Founding Subscription
            </LinkButton>
            <LinkButton href="/faq" variant="secondary" size="lg">
              Read the FAQ
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
