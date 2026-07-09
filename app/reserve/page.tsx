"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ name, email }),
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

  if (checkoutStatus === "success") {
    return (
      <section className="py-24">
        <Container className="max-w-xl text-center">
          <Eyebrow>Confirmed</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            You&apos;re in.
          </h1>
          <p className="mt-4 text-navy/70">
            Your $249 Founding Subscription deposit is confirmed. Check your
            email for a link to set up your account and start your wellness
            intake whenever you&apos;re ready.
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
            we&apos;re open to the public. It&apos;s fully credited to your
            first Protocol Subscription payment at launch, and fully
            refundable per the Founding Subscriber Program terms.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {[
              "Founding pricing locked in before public launch",
              "Deposit fully credited to your first Protocol Subscription payment — never an extra charge",
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
            >
              {loading
                ? "Redirecting to checkout…"
                : "Reserve Your Founding Subscription — $249"}
            </button>
            <p className="text-xs text-navy/40">
              Your $249 deposit is applied as your first Protocol
              Subscription payment when Supplement :: LIFE goes live. Fully
              refundable per the Founding Subscriber Program terms. Secure
              checkout via Stripe.
            </p>
          </form>
        </div>
      </Container>
    </section>
  );
}
