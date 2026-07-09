"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "link" | "password";

/**
 * Top-right account dropdown. Signed out: an inline login form, magic link
 * or email+password (mirrors components/LoginPrompt.tsx — shouldCreateUser:
 * false / signInWithPassword() both refuse to create new accounts, since
 * accounts are only ever created via a successful Stripe checkout, never
 * self-registration here). Signed in: quick links + log out. Deliberately
 * a dropdown rather than a page navigation, so it's reachable from
 * anywhere on the site without leaving the page.
 */
export default function AccountMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("link");

  const [inputEmail, setInputEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user.email ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset the inline form each time the menu is closed, so reopening it
  // doesn't show a stale "check your email" state from a prior visit.
  function close() {
    setOpen(false);
    setSent(false);
    setResetSent(false);
    setNoAccount(false);
    setError(null);
    setMode("link");
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setNoAccount(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: inputEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    setSending(false);
    if (error) {
      const noExistingAccount = /not allowed|signup|not found|does not exist/i.test(
        error.message
      );
      if (noExistingAccount) setNoAccount(true);
      else setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setNoAccount(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: inputEmail,
      password,
    });

    setSending(false);
    if (error) {
      setError(
        /invalid login credentials/i.test(error.message)
          ? "Incorrect email or password."
          : error.message
      );
      return;
    }

    // onAuthStateChange updates this dropdown's own state automatically,
    // but the underlying page (e.g. a server-rendered dashboard) won't
    // re-fetch on its own — refresh so it picks up the new session cookie.
    setOpen(false);
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!inputEmail) {
      setError('Enter your email above first, then click "Forgot password."');
      return;
    }
    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(inputEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/auth/reset-password"
      )}`,
    });

    setSending(false);
    if (error) setError(error.message);
    else setResetSent(true);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    close();
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={email ? "Account menu" : "Log in"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-cream transition-colors hover:border-copper hover:text-copper"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="8" r="5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-navy/10 bg-cream p-4 text-navy shadow-xl">
          {loading ? null : email ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="truncate px-1 pb-2 text-navy/50">{email}</p>
              <Link
                href="/dashboard"
                onClick={close}
                className="rounded-lg px-3 py-2 text-left transition-colors hover:bg-navy/5"
              >
                Dashboard
              </Link>
              <Link
                href="/intake"
                onClick={close}
                className="rounded-lg px-3 py-2 text-left transition-colors hover:bg-navy/5"
              >
                Wellness Intake
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 rounded-lg px-3 py-2 text-left text-red-600 transition-colors hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          ) : sent ? (
            <p className="p-1 text-sm text-navy/70">
              Check your email for a login link — it&apos;ll bring you right
              back here.
            </p>
          ) : resetSent ? (
            <p className="p-1 text-sm text-navy/70">
              Check your email for a link to set your password.
            </p>
          ) : (
            <>
              <div className="mb-3 flex gap-4 px-1 text-xs">
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
                    mode === "password"
                      ? "text-copper"
                      : "text-navy/40 hover:text-navy/60"
                  }`}
                >
                  Email &amp; password
                </button>
              </div>

              <form
                onSubmit={mode === "link" ? handleMagicLink : handlePasswordLogin}
                className="flex flex-col gap-3"
              >
                <label
                  htmlFor="account-menu-email"
                  className="px-1 text-sm font-medium text-navy"
                >
                  {mode === "link"
                    ? "Log in to your Protocol Dashboard"
                    : "Email and password"}
                </label>
                <input
                  id="account-menu-email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
                />

                {mode === "password" && (
                  <>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-navy/20 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
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
                  <p className="px-1 text-xs leading-relaxed text-navy/60">
                    No account found for that email.{" "}
                    <Link
                      href="/reserve"
                      onClick={close}
                      className="font-semibold text-copper underline"
                    >
                      Reserve your spot
                    </Link>
                    .
                  </p>
                )}
                {error && <p className="px-1 text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-full bg-copper px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
                >
                  {sending
                    ? mode === "link"
                      ? "Sending…"
                      : "Logging in…"
                    : mode === "link"
                    ? "Send login link"
                    : "Log in"}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
