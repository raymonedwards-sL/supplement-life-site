"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container, Eyebrow } from "@/components/ui/Container";
import { PricingComparisonTable } from "@/components/PricingComparisonTable";

export default function Assessment() {
  return (
    <Suspense fallback={null}>
      <AssessmentForm />
    </Suspense>
  );
}

function AssessmentForm() {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");
  const regionBlocked = searchParams.get("region") === "unsupported";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [residencyConfirmed, setResidencyConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, residencyConfirmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (regionBlocked) {
    return (
      <section className="py-24">
        <Container className="max-w-xl text-center">
          <Eyebrow>Not Yet Available In Your Region</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            We&apos;re not able to offer the LIFE Assessment in your location.
          </h1>
          <p className="mt-4 text-navy/70">
            Supplement :: LIFE is currently only available to residents of
            the United States, Canada, and Mexico. If you believe
            you&apos;re seeing this message in error and you are located in
            one of those countries, please reach out to{" "}
            <a
              href="mailto:hello@yourlifeprotocol.com"
              className="font-semibold text-copper underline underline-offset-2"
            >
              hello@yourlifeprotocol.com
            </a>
            .
          </p>
        </Container>
      </section>
    );
  }

  if (checkoutStatus === "success") {
    return (
      <section className="py-24">
        <Container className="max-w-xl text-center">
          <Eyebrow>Confirmed</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            You&apos;re in — let&apos;s begin.
          </h1>
          <p className="mt-4 text-navy/70">
            Your LIFE Assessment is confirmed. Check your email for a link
            to set up your account, then head to your dashboard to start
            your guided conversation with Sage whenever you&apos;re ready.
          </p>
        </Container>
      </section>
    );
  }

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <Eyebrow>Take the LIFE Assessment</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
              Understand what your body is actually asking for.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-navy/70">
              A guided conversation with Sage — not a generic wellness quiz
              — covering your fitness, nutrition, fasting patterns,
              hydration, and daily biology in real depth. Sage learns from
              how you respond over time, not just what you report on day
              one, and continually adjusts your protocol to what you
              actually need now.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-navy/70">
              At the end, you receive your personal LIFE Brief — a complete
              picture of how you eat, move, sleep, fast, hydrate, and
              recover, paired with a bespoke botanical formulation built
              around the specific gaps showing up in your biology right
              now. It&apos;s not a one-time result. It&apos;s the start of
              an ongoing relationship with Sage, who keeps refining both
              the guidance and the formula as your first 90 days unfold —
              yours immediately, on-screen and by email.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {[
                "A guided, in-depth conversation with Sage, Your LIFE Guide — fitness, nutrition, fasting, hydration, and biology",
                "Your personalized LIFE Brief, delivered immediately on-screen and by email",
                "Your Botanical Track match, with a plain-language rationale for every ingredient",
                "No ongoing commitment — decide separately if you'd like to become a Founding Subscriber",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                  <p className="text-sm text-navy/70">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-navy/10 bg-white/60 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-navy/50">
              LIFE Assessment
            </p>
            <p className="mt-1 font-serif text-3xl text-navy">$797</p>
            <p className="mt-1 text-sm text-navy/50">One-time — not a subscription</p>

            {checkoutStatus === "cancelled" && (
              <p className="mt-4 rounded-lg bg-copper/10 px-4 py-3 text-sm text-navy">
                Checkout was cancelled &mdash; no charge was made. You can
                try again below whenever you&apos;re ready.
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-navy" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
                />
              </div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={residencyConfirmed}
                  onChange={(e) => setResidencyConfirmed(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 shrink-0 rounded border-navy/30 text-copper focus:ring-copper"
                />
                <span className="text-sm leading-relaxed text-navy/70">
                  I confirm that I am located in the United States, Canada,
                  or Mexico.
                </span>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-xs leading-relaxed text-navy/50">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-copper">
                  Terms of Service
                </Link>
                ,{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-copper">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link
                  href="/refund-policy"
                  className="underline underline-offset-2 hover:text-copper"
                >
                  Refund &amp; Shipping Policy
                </Link>
                .
              </p>
              <button
                type="submit"
                disabled={loading || !residencyConfirmed}
                className="mt-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
              >
                {loading ? "Redirecting to checkout…" : "Take the LIFE Assessment — $797"}
              </button>
              <p className="text-xs text-navy/40">
                One-time charge for your guided assessment and LIFE Brief.
                Separate from the $249/month Founding Subscription, which
                is offered as its own choice after your Brief is ready.
                Secure checkout via Stripe.
              </p>
            </form>
          </div>
        </Container>
      </section>

      <section className="py-4 sm:py-8">
        <Container className="max-w-3xl">
          <Eyebrow>The Work Behind the Recommendation</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            Sage&apos;s reasoning isn&apos;t generated from nowhere.
          </h2>
          <p className="mt-4 text-navy/70">
            From the garden to the greenhouse to hands-on formulation — every
            recommendation Sage makes is grounded in real botanical practice,
            not a generic quiz result.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-navy/10">
            <Image
              src="/lifestyle/Sage-recommends.jpeg"
              alt="The botanical research and formulation practice behind Sage's recommendations"
              width={1376}
              height={768}
              className="h-full w-full object-cover"
              sizes="(min-width: 1024px) 768px, 100vw"
            />
          </div>
        </Container>
      </section>

      <section className="border-y border-navy/10 bg-white/40 py-20">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow>Why register early</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
              What each step actually gets you.
            </h2>
            <p className="mt-4 text-navy/70">
              The LIFE Assessment and the Founding Subscriber Program are
              two separate decisions. Here&apos;s the full picture, side by
              side.
            </p>
          </div>
          <div className="mt-10">
            <PricingComparisonTable />
          </div>
          <p className="mt-6 text-sm text-navy/50">
            Ready to lock in the Founding rate now instead?{" "}
            <Link href="/reserve" className="font-semibold text-copper hover:text-copper/80">
              Reserve your Founding Subscription &rarr;
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
