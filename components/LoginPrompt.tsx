"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "link" | "password";

/**
 * Shown on any auth-gated page when there's no logged-in session — e.g. a
 * returning visitor whose session expired. Two ways in: a magic link (no
 * password needed) or email + password for anyone who's set a password
 * from their dashboard (Account Settings). `redirectPath` sends them back
 * to whichever page asked for login.
 *
 * Both paths can only log in to an EXISTING account — shouldCreateUser:
 * false and signInWithPassword() both refuse to create new accounts.
 * Accounts are only ever created by the Stripe webhook after a real $249
 * Founding Reservation deposit; this form must never self-register one.
 */
export default function LoginPrompt({ redirectPath }: { redirectPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("link");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
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

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNoAccount(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(
        /invalid login credentials/i.test(error.message)
          ? "Incorrect email or password."
          : error.message
      );
      return;
    }

    // Client-side sign-in doesn't re-render this server-rendered page by
    // itself — navigate + refresh so it picks up the new session cookie.
    router.push(redirectPath);
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email above first, then click "Forgot password."');
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/auth/reset-password"
      )}`,
    });

    setLoading(false);
    if (error) setError(error.message);
    else setResetSent(true);
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

  if (resetSent) {
    return (
      <div className="mt-6 rounded-2xl border border-navy/10 bg-white/40 p-6">
        <p className="text-navy/70">
          Check your email for a link to set your password.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-white/40 p-6">
      <div className="mb-4 flex gap-5 text-sm">
        <button
          type="button"
          onClick={() => {
            setMode("link");
            setError(null);
          }}
          className={`font-semibold transition-colors ${
            mode === "link" ? "text-copper" : "text-navy/40 hover:text-navy/60"
          }`}
        >
          Email link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setError(null);
          }}
          className={`font-semibold transition-colors ${
            mode === "password" ? "text-copper" : "text-navy/40 hover:text-navy/60"
          }`}
        >
          Email &amp; password
        </button>
      </div>

      <form
        onSubmit={mode === "link" ? handleMagicLink : handlePasswordLogin}
        className="flex flex-col gap-3"
      >
        <label className="text-sm font-medium text-navy" htmlFor="login-email">
          {mode === "link"
            ? "Enter the email you reserved with, and we'll send you a login link."
            : "Enter your email and password."}
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

        {mode === "password" && (
          <>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
            />
            <button
              type="button"
              onClick={handleForgotPassword}
              className="self-start text-xs font-medium text-navy/50 underline underline-offset-2 hover:text-copper"
            >
              Forgot / set your password
            </button>
          </>
        )}

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
          {loading
            ? mode === "link"
              ? "Sending…"
              : "Logging in…"
            : mode === "link"
            ? "Send login link"
            : "Log in"}
        </button>
      </form>
    </div>
  );
}
