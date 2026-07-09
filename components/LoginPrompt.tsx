"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Shown on any auth-gated page when there's no logged-in session — e.g. a
 * returning visitor whose session expired. Sends a magic link rather than
 * requiring a password (PRD 5.1 allows either; magic link is the simpler
 * build). `redirectPath` sends them back to whichever page asked for login.
 *
 * shouldCreateUser: false is deliberate — accounts are only ever created by
 * the Stripe webhook after a real $249 Founding Reservation deposit. This
 * form must never be able to self-register a new account; it can only
 * re-send a login link to an email that already has one.
 */
export default function LoginPrompt({ redirectPath }: { redirectPath: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNoAccount(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectPath
        )}`,
      },
    });

    setLoading(false);
    if (error) {
      // Supabase's wording for "no account with this email" varies by
      // version — match loosely rather than on one exact string.
      const noExistingAccount = /not allowed|signup|not found|does not exist/i.test(
        error.message
      );
      if (noExistingAccount) {
        setNoAccount(true);
      } else {
        setError(error.message);
      }
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-2xl border border-navy/10 bg-white/40 p-6">
        <p className="text-navy/70">
          Check your email for a login link — it&apos;ll bring you right back
          here.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-navy/10 bg-white/40 p-6"
    >
      <label className="text-sm font-medium text-navy" htmlFor="login-email">
        Enter the email you reserved with, and we&apos;ll send you a login
        link.
      </label>
      <input
        id="login-email"
        type="email"
        required
        placeholder="jane@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
      />
      {noAccount && (
        <p className="text-sm text-navy/70">
          We couldn&apos;t find an account for that email. You&apos;ll need to
          reserve your Founding Subscription first —{" "}
          <Link href="/reserve" className="font-semibold text-copper underline underline-offset-2">
            reserve your spot here
          </Link>
          .
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send login link"}
      </button>
    </form>
  );
}
