"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";

/**
 * Free "Join the LIFE Tribe" opt-in.
 *
 * 2026-07-20: built as the site's lowest-friction page — no payment, no
 * account — after auditing the live funnel and finding the only path onto
 * the beehiiv list was a paid checkout.
 *
 * 2026-07-20, same day, extended twice more:
 *  (a) added the one-question qualifier (CHALLENGES/step flow below)
 *      after the user shared a reference funnel (video + a single
 *      conversational question ahead of a lead form).
 *  (b) added the sections below the form (WHAT_YOU_GET, FIT/NOT_FIT,
 *      TESTIMONIALS, sticky CTA bar) after the user shared a second
 *      reference — ebrahimturner.com's downsell page, shown to leads who
 *      don't qualify for his 1:1 program: an honest reframe, a value
 *      list, a fit/not-fit self-qualifier, raw social proof, and a
 *      persistent CTA. That structure maps directly onto this page
 *      (the free tribe IS this brand's version of "not ready for the
 *      full $99 Assessment yet") — deliberately did NOT copy two things
 *      from the reference: dollar-value-stacking ("$18,000 value" per
 *      item) and a video. Both Maya/Marcus portraits list overpromising
 *      and generic-funnel tactics as instant trust-breakers for this
 *      ICP, and this project has a standing no-founder-on-camera pattern.
 *
 * TESTIMONIALS is deliberately an empty array — per this project's Trust
 * Journey Audit, never fabricate testimonials. The section only renders
 * once real quotes are added here; nothing fake ships in the meantime.
 */

const CHALLENGES = [
  "Energy that crashes by mid-afternoon",
  "Sleep that doesn't actually restore you",
  "Recovery that takes longer than it used to",
  "A hormonal or metabolic shift your labs don't explain",
  "Managing too many separate products with no real system",
];

const WHAT_YOU_GET = [
  "Sage's plain-language wellness insights, sent regularly — the same thinking behind the paid LIFE Brief, not personalized to you yet",
  "First access when new Botanical Tracks launch",
  "A heads-up before Founding Subscriber pricing changes",
  "Zero obligation to ever pay anything",
];

const GOOD_FIT = [
  "You recognize yourself in the 2:30pm energy crash, the 2-4am wake-ups, or a stack of separate products that doesn't feel like a system",
  "You want to understand the actual reasoning before you spend anything",
  "You'd rather get the thinking first and decide later than be sold on the spot",
];

const NOT_A_FIT = [
  "You're looking for a miracle claim or an overnight fix — Sage works from mechanism and biology, not promises",
  "You want a proprietary blend you can't see inside — every ingredient and its reasoning is shown, always",
  "You're already fully committed to something that's working — no reason to switch",
];

/**
 * Real, attributed quotes only (first name + track/context, with
 * permission) — see the 2026-07-20 memory entry on why this starts
 * empty. Shape: { quote, attribution }.
 */
const TESTIMONIALS: { quote: string; attribution: string }[] = [];

type Step = "question" | "email" | "success";

export default function JoinTheTribe() {
  const [step, setStep] = useState<Step>("question");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setShowStickyCta(window.scrollY > 480);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/join-tribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenge }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <section className="py-24">
        <Container className="max-w-xl text-center">
          <Eyebrow>You&apos;re In</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Welcome to the LIFE Tribe.
          </h1>
          <p className="mt-4 text-navy/70">
            Keep an eye on your inbox — you&apos;ll start hearing from Sage
            with plain-language wellness insights, first access to new
            Botanical Tracks, and a heads-up before Founding pricing
            changes.
          </p>
          <p className="mt-6 text-navy/70">
            Curious what Sage would say about you specifically?{" "}
            <Link
              href="/assessment"
              className="font-semibold text-copper hover:text-copper/80"
            >
              Take the LIFE Assessment &rarr;
            </Link>
          </p>
        </Container>
      </section>
    );
  }

  return (
    <>
      <section className="py-20 sm:py-28" ref={formRef}>
        <Container className="max-w-xl text-center">
          <Eyebrow>Join the LIFE Tribe</Eyebrow>

          {step === "question" && (
            <>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
                Not quite ready for the full Assessment?{" "}
                <span className="text-copper">Start here instead.</span>
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-navy/70">
                One tap, then you&apos;re on the list. Free, no commitment —
                where do you feel it most right now?
              </p>

              <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
                {CHALLENGES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setChallenge(option);
                      setStep("email");
                    }}
                    className="rounded-xl border border-navy/15 bg-white/70 px-5 py-4 text-left text-navy transition-colors hover:border-copper hover:bg-copper/5"
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-6 text-sm text-navy/40 underline underline-offset-2 hover:text-copper"
              >
                Skip — just join the list
              </button>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
                Where should Sage send it?
              </h1>
              {challenge && (
                <p className="mt-4 text-navy/70">
                  Got it —{" "}
                  <span className="font-semibold text-copper">
                    {challenge.toLowerCase()}
                  </span>
                  . We&apos;ll keep that in mind for what we send you.
                </p>
              )}

              <form
                onSubmit={submit}
                className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full flex-1 rounded-full border border-navy/20 bg-white px-5 py-3 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
                >
                  {loading ? "Joining…" : "Join Free"}
                </button>
              </form>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button
                type="button"
                onClick={() => setStep("question")}
                className="mt-4 text-sm text-navy/40 underline underline-offset-2 hover:text-copper"
              >
                &larr; Back
              </button>

              <p className="mt-6 text-xs leading-relaxed text-navy/40">
                By joining, you agree to receive email from Supplement ::
                LIFE. Unsubscribe anytime. Read our{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-copper">
                  Privacy Policy
                </Link>
                .
              </p>
            </>
          )}

          <p className="mt-10 text-sm text-navy/50">
            Ready to see what Sage would say about you specifically?{" "}
            <Link href="/assessment" className="font-semibold text-copper hover:text-copper/80">
              Take the LIFE Assessment — $99 &rarr;
            </Link>
          </p>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container className="max-w-2xl">
          <Eyebrow>What You Get, Free</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            No payment, no account, nothing to cancel later.
          </h2>
          <div className="mt-8 flex flex-col gap-4">
            {WHAT_YOU_GET.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <p className="text-navy/70">{item}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-2xl">
          <Eyebrow>Honest About the Fit</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            This isn&apos;t for everyone, and we&apos;d rather say so now.
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-navy/10 bg-white/60 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                You&apos;re a fit if
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {GOOD_FIT.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 text-copper">&rarr;</span>
                    <p className="text-sm leading-relaxed text-navy/70">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-navy/10 bg-white/60 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-navy/50">
                You&apos;re not a fit if
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {NOT_A_FIT.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-1 text-navy/30">&times;</span>
                    <p className="text-sm leading-relaxed text-navy/70">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {TESTIMONIALS.length > 0 && (
        <section className="border-y border-navy/10 bg-white/40 py-20">
          <Container className="max-w-2xl">
            <Eyebrow>From Early Subscribers</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              What people are actually saying.
            </h2>
            <div className="mt-8 flex flex-col gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.attribution} className="rounded-2xl border border-navy/10 bg-white/60 p-6">
                  <p className="text-navy/80">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-3 text-sm font-semibold text-copper">{t.attribution}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {showStickyCta && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-cream/95 py-3 backdrop-blur">
          <Container className="flex items-center justify-between gap-4">
            <p className="hidden text-sm text-navy/70 sm:block">
              Free, no commitment — join the LIFE Tribe.
            </p>
            <button
              type="button"
              onClick={() => {
                formRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 sm:w-auto"
            >
              Join Free
            </button>
          </Container>
        </div>
      )}
    </>
  );
}
