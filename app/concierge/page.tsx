"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";

export default function Concierge() {
  return (
    <Suspense fallback={null}>
      <ConciergeForm />
    </Suspense>
  );
}

function ConciergeForm() {
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
      const res = await fetch("/api/checkout-concierge", {
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
            We&apos;re not able to offer LIFE Concierge in your location.
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
            You&apos;re enrolled in LIFE Concierge.
          </h1>
          <p className="mt-4 text-navy/70">
            Check your email for a link to set up your account. We&apos;ll
            follow up separately to schedule your first practitioner
            session — or reach out any time at{" "}
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

  return (
    <section className="py-16 sm:py-20">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div>
          <Eyebrow>LIFE Concierge</Eyebrow>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
            The most personal way to start.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            LIFE Concierge pairs Sage&apos;s guided intake with real, 1:1
            human attention — three private sessions with a dedicated
            wellness practitioner, walking through your biology, your
            LIFE Brief, and how to make the most of your first months.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-navy/70">
            LIFE Concierge is a one-time enrollment, not a subscription —
            and it doesn&apos;t include any Botanical Track kits. Product
            only ships as part of the ongoing Founding Subscription, so
            most members reserve that separately (or already have it)
            alongside their Concierge enrollment.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {[
              "3 private 30-minute sessions with a dedicated wellness practitioner",
              "Sage's own guided intake, LIFE Brief, and ongoing reformulation",
              "Priority processing and support throughout your enrollment",
              "Does not include Botanical Track kits — those ship via the Founding Subscription",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                <p className="text-sm text-navy/70">{item}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-navy/50">
            Not sure this is the right starting point?{" "}
            <Link href="/assessment" className="font-semibold text-copper hover:text-copper/80">
              Take the LIFE Assessment ($797)
            </Link>{" "}
            instead, or{" "}
            <Link href="/reserve" className="font-semibold text-copper hover:text-copper/80">
              Reserve your Founding Subscription
            </Link>
            .
          </p>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white/60 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-navy/50">
            LIFE Concierge
          </p>
          <p className="mt-1 font-serif text-3xl text-navy">$1,995</p>
          <p className="mt-1 text-sm text-navy/50">
            One-time enrollment — not a subscription, and does not include
            product.
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
              {loading ? "Redirecting to checkout…" : "Enroll in LIFE Concierge — $1,995"}
            </button>
            <p className="text-xs text-navy/40">
              One-time charge for 3 practitioner sessions and Sage&apos;s
              guidance. Does not include Botanical Track kits or a
              subscription. Secure checkout via Stripe.
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}
