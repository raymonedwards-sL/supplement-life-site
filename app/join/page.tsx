"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Eyebrow } from "@/components/ui/Container";

/**
 * Free "Join the LIFE Tribe" opt-in (2026-07-20 launch-push build).
 * Deliberately the lowest-friction page on the site: one field, no
 * payment, no account. Built specifically as the external-link
 * destination for social posts, practitioner shares, and press —
 * someone who isn't ready for the $99 LIFE Assessment or the $249
 * Founding Subscription should still have somewhere to land that isn't
 * a paywall. See app/api/join-tribe/route.ts for the reasoning.
 *
 * Not geo-gated like /assessment or /reserve — joining a free email list
 * carries none of the shipping/checkout constraints that drove that
 * gating elsewhere on the site.
 */
export default function JoinTheTribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/join-tribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
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
    <section className="py-20 sm:py-28">
      <Container className="max-w-xl text-center">
        <Eyebrow>Join the LIFE Tribe</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Not ready for the full Assessment yet? Start here.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-navy/70">
          Get Sage&apos;s wellness insights in your inbox, first word on new
          Botanical Tracks, and early notice before Founding Subscriber
          pricing changes. Free, no commitment — one email address, nothing
          else.
        </p>

        <form
          onSubmit={handleSubmit}
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
            className="w-full flex-1 rounded-full border border-navy/20 bg-white px-5 py-3 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
          >
            {status === "loading" ? "Joining…" : "Join Free"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <p className="mt-6 text-xs leading-relaxed text-navy/40">
          By joining, you agree to receive email from Supplement :: LIFE.
          Unsubscribe anytime. Read our{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-copper">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="mt-10 text-sm text-navy/50">
          Ready to see what Sage would say about you specifically?{" "}
          <Link href="/assessment" className="font-semibold text-copper hover:text-copper/80">
            Take the LIFE Assessment — $99 &rarr;
          </Link>
        </p>
      </Container>
    </section>
  );
}
