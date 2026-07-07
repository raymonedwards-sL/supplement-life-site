"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

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
      <section className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          You&apos;re in.
        </h1>
        <p className="mt-4 text-navy/70">
          Your $249 Founding Reservation deposit is confirmed. Check your
          email for a link to set up your account and start your wellness
          intake.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Reserve Yours
      </h1>
      <p className="mt-4 text-navy/70">
        Placeholder text about pre-ordering &mdash; pricing, launch timing, and
        what reserving now includes will go here.
      </p>

      {checkoutStatus === "cancelled" && (
        <p className="mt-6 rounded-lg bg-copper/10 px-4 py-3 text-sm text-navy">
          Checkout was cancelled &mdash; no charge was made. You can try again
          below whenever you&apos;re ready.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
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
          {loading ? "Redirecting to checkout…" : "Reserve Now — $249"}
        </button>
        <p className="text-xs text-navy/40">
          Your $249 deposit is applied as your first month&apos;s subscription
          payment when Supplement :: LIFE goes live. Fully refundable per the
          Founding Reservation terms.
        </p>
      </form>
    </section>
  );
}
