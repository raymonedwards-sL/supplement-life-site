"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Shown on any auth-gated page when there's no logged-in session — e.g. a
 * returning visitor whose session expired. Sends a magic link rather than
 * requiring a password (PRD 5.1 allows either; magic link is the simpler
 * build). `redirectPath` sends them back to whichever page asked for login.
 */
export default function LoginPrompt({ redirectPath }: { redirectPath: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectPath
        )}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <p className="mt-4 text-navy/70">
        Check your email for a login link — it&apos;ll bring you right back
        here.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
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
