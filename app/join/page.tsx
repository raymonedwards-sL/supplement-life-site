"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";
import {
  PAIN_POINT_CATEGORY_LABELS,
  getPainPointsByCategory,
  type PainPointCategory,
} from "@/lib/pain-points";

/**
 * Free "Join the LIFE Tribe" opt-in.
 *
 * 2026-07-20: built as the site's lowest-friction page — no payment, no
 * account — after auditing the live funnel and finding the only path onto
 * the beehiiv list was a paid checkout.
 *
 * 2026-07-20, same day, extended three more times:
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
 *  (c) made the "7 Signs Your Body Is Asking for a Reset After 35" PDF
 *      (public/Supplement-LIFE-7-Signs-Reset-After-35.pdf) the named,
 *      concrete lead magnet — swapped the generic "wellness insights"
 *      framing for the actual guide, added a direct download link on
 *      the success screen (instant access, no email-client round trip
 *      required to see it), and send it as an attachment via
 *      lib/email/send-tribe-guide.ts as the durable backup. This is
 *      also the intended landing page for cold paid traffic per the
 *      user's ad question that day — a named, specific asset converts
 *      cold clicks better than "join our newsletter" ever does.
 *
 * TESTIMONIALS is deliberately an empty array — per this project's Trust
 * Journey Audit, never fabricate testimonials. The section only renders
 * once real quotes are added here; nothing fake ships in the meantime.
 */

const GUIDE_PDF_PATH = "/Supplement-LIFE-7-Signs-Reset-After-35.pdf";

const CHALLENGE_CATEGORIES: PainPointCategory[] = ["physical_signal", "buying_frustration"];

const WHAT_YOU_GET = [
  "Instant access to “7 Signs Your Body Is Asking for a Reset After 35” — the free guide, no strings attached",
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
  const [challenges, setChallenges] = useState<string[]>([]);
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

  function toggleChallenge(label: string) {
    setChallenges((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/join-tribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenges }),
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
            Your guide is on its way to your inbox now. Want it this second
            instead?
          </p>
          <a
            href={GUIDE_PDF_PATH}
            download
            className="mt-6 inline-block rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90"
          >
            Download &ldquo;7 Signs Your Body Is Asking for a Reset After 35&rdquo; &rarr;
          </a>
          <p className="mt-8 text-navy/70">
            From here you&apos;ll also start hearing from Sage with
            plain-language wellness insights, first access to new Botanical
            Tracks, and a heads-up before Founding pricing changes.
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
                Get the free guide:{" "}
                <span className="text-copper">
                  7 Signs Your Body Is Asking for a Reset After 35
                </span>
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-navy/70">
                First, tell us which of this applies to you — select as many
                as fit. It&apos;s how we make sure what Sage sends you
                actually matters.
              </p>

              <div className="mx-auto mt-8 flex max-w-md flex-col gap-6">
                {CHALLENGE_CATEGORIES.map((category) => (
                  <div key={category}>
                    <p className="mb-3 text-left text-xs font-semibold uppercase tracking-wide text-navy/40">
                      {PAIN_POINT_CATEGORY_LABELS[category]}
                    </p>
                    <div className="flex flex-col gap-3">
                      {getPainPointsByCategory(category).map((option) => {
                        const selected = challenges.includes(option.label);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleChallenge(option.label)}
                            className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors ${
                              selected
                                ? "border-copper bg-copper/10 text-navy"
                                : "border-navy/15 bg-white/70 text-navy hover:border-copper hover:bg-copper/5"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                selected ? "border-copper bg-copper text-cream" : "border-navy/30"
                              }`}
                            >
                              {selected && (
                                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                                  <path
                                    d="M2 6.2 4.8 9 10 3"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("email")}
                disabled={challenges.length === 0}
                className="mt-8 w-full max-w-md rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue{challenges.length > 0 ? ` (${challenges.length} selected)` : ""}
              </button>

              <button
                type="button"
                onClick={() => setStep("email")}
                className="mt-4 text-sm text-navy/40 underline underline-offset-2 hover:text-copper"
              >
                Skip — just join the list
              </button>
            </>
          )}

          {step === "email" && (
            <>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
                Where should we send your guide?
              </h1>
              {challenges.length > 0 && (
                <div className="mt-4 text-navy/70">
                  <p>
                    {challenges.length === 1
                      ? "Got it — thanks for sharing that."
                      : "Got it — that's a lot to be carrying at once. Thanks for sharing all of it."}{" "}
                    We&apos;ll keep this in mind for what we send you:
                  </p>
                  <ul className="mx-auto mt-3 flex max-w-sm flex-col gap-1.5 text-left">
                    {challenges.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-copper" />
                        <span className="font-semibold text-copper">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
