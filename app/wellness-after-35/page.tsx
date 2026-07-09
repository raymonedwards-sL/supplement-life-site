import type { Metadata } from "next";
import Image from "next/image";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Why Wellness Changes After 35",
  description:
    "Beginning in our mid-thirties, recovery slows, stress lingers, and sleep gets lighter. Here's why — and what a personalized botanical protocol can do about it.",
};

const shifts = [
  {
    title: "Recovery slows",
    body: "The bounce-back from a hard workout, a bad night, or a stressful week takes longer than it used to.",
  },
  {
    title: "Stress lasts longer",
    body: "The same pressures that used to roll off now seem to linger into the next day, or the next week.",
  },
  {
    title: "Sleep becomes lighter",
    body: "Falling asleep, staying asleep, or waking up rested can all get harder — even without anything obvious changing.",
  },
  {
    title: "Focus fluctuates",
    body: "Mental clarity can feel less consistent — sharp some days, foggy on others, for no clear reason.",
  },
  {
    title: "Metabolism changes",
    body: "The way your body handles food, energy, and weight shifts gradually, often without a single obvious trigger.",
  },
  {
    title: "Resilience feels different",
    body: "Bouncing back from setbacks — physical or otherwise — can take more out of you than it once did.",
  },
];

export default function WellnessAfter35() {
  return (
    <>
      <section className="border-b border-navy/10 py-20">
        <Container className="max-w-3xl">
          <Eyebrow>Why 35?</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            Why wellness changes after 35.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            Beginning in our mid-thirties, many people notice subtle shifts.
            None of it means you&apos;re &ldquo;old.&rdquo; It means your
            biology has entered a different chapter — and your wellness
            approach should evolve with it.
          </p>
        </Container>
      </section>

      <section className="relative h-[360px] w-full overflow-hidden sm:h-[480px] lg:h-[560px]">
        <Image
          src="/lifestyle/sunrise-practice.jpg"
          alt="A man in his 40s in a quiet morning stretch, overlooking a misty mountain valley at sunrise"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </section>

      <section className="py-20">
        <Container className="max-w-3xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {shifts.map((shift) => (
              <div
                key={shift.title}
                className="rounded-2xl border border-navy/10 bg-white/40 p-6"
              >
                <h2 className="text-lg font-semibold text-navy">
                  {shift.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-navy/70">
                  {shift.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-3xl">
          <p className="font-serif text-2xl leading-relaxed text-navy">
            None of this means you&apos;re &ldquo;old.&rdquo; It means your
            biology has entered a different chapter. Your wellness should
            evolve with it.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-navy/50">
            This page describes common, non-medical wellness shifts many
            adults notice over time — it isn&apos;t a diagnosis or a
            substitute for medical advice. If something feels persistent or
            concerning, talk to your healthcare provider.
          </p>
        </Container>
      </section>

      <section className="py-20">
        <Container className="flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            A protocol built for this chapter, not the last one.
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
