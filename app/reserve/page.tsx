"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";

export default function Reserve() {
  return (
    <Suspense fallback={null}>
      <ReserveForm />
    </Suspense>
  );
}

function ReserveForm() {
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
      const res = await fetch("/api/checkout", {
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
            We&apos;re not able to accept reservations from your location.
          </h1>
          <p className="mt-4 text-navy/70">
            The Founding Subscriber Program is currently only available to
            residents of the United States, Canada, and Mexico. If you
            believe you&apos;re seeing this message in error and you are
            located in one of those countries, please reach out to{" "}
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
            You&apos;re in.
          </h1>
          <p className="mt-4 text-navy/70">
            Your $249 Founding Subscription deposit is confirmed — it locks
            in $249/month for your first six months once your subscription
            begins, half the $499/month we&apos;ll charge the public
            starting October 2026. Check your email for a link to set up
            your account and start your wellness intake whenever
            you&apos;re ready.
          </p>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <Eyebrow>Founding Subscriber Program</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            Reserve Your Founding Subscription
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            A $249 deposit reserves your spot for first access — before
            we&apos;re open to the public. It&apos;s fully credited toward
            your first six months of your Protocol Subscription at the
            Founding rate of $249/month — half the $499/month regular
            subscription price we&apos;ll offer the public starting
            October 2026 — and fully refundable per the Founding
            Subscriber Program terms.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-navy/10">
            <Image
              src="/lifestyle/reset-kit.jpg"
              alt="The Reset Botanical Track kit, unboxed on a marble counter"
              width={1376}
              height={768}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-8 flex flex-col gap-4">
            {[
              "$249/month for your first 6 months — half the $499/month public price starting October 2026",
              "Deposit fully credited toward your subscription — never an extra charge",
              "Fully refundable per the Founding Subscriber Program terms",
              "Complete your wellness intake and get matched as soon as you're ready",
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
            Founding Subscription Deposit
          </p>
          <p className="mt-1 font-serif text-3xl text-navy">$249</p>
          <p className="mt-1 text-sm text-navy/50">
            $249/mo for 6 months — half the $499/mo public price starting
            October 2026
          </p>

          {checkoutStatus === "cancelled" && (
            <p className="mt-4 rounded-lg bg-copper/10 px-4 py-3 text-sm text-navy">
              Checkout was cancelled &mdash; no charge was made. You can try
              again below whenever you&apos;re ready.
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
                I confirm that I am located in the United States, Canada, or
                Mexico. The Founding Subscriber Program is currently only
                available to residents of these countries.
              </span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-xs leading-relaxed text-navy/50">
              By reserving, you agree to our{" "}
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
              {loading
                ? "Redirecting to checkout…"
                : "Reserve Your Founding Subscription — $249"}
            </button>
            <p className="text-xs text-navy/40">
              Your $249 deposit is credited toward your Protocol
              Subscription when Supplement :: LIFE goes live — $249/month
              for your first six months, half the $499/month we&apos;ll
              charge the public starting October 2026. Fully refundable
              per the Founding Subscriber Program terms. Secure checkout
              via Stripe.
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}
