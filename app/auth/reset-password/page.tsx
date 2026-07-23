"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Container, Eyebrow } from "@/components/ui/Container";

/**
 * Landing page for both "forgot password" and "set your first password"
 * links (they're the same Supabase resetPasswordForEmail() flow). Reached
 * via /auth/callback?next=/auth/reset-password, which by the time we get
 * here has already exchanged the code (or hash tokens) for a real session
 * — so this page just needs an active session, then calls
 * supabase.auth.updateUser({ password }) to finish the job.
 */
export default function ResetPassword() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(Boolean(session));
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <section className="py-20">
      <Container className="max-w-md">
        <Eyebrow>Account</Eyebrow>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Set your password
        </h1>

        {checking ? null : !hasSession ? (
          <p className="mt-4 text-navy/70">
            This link has expired or was already used. Head back to{" "}
            <Link href="/dashboard" className="text-copper underline">
              the login screen
            </Link>{" "}
            to request a new one.
          </p>
        ) : done ? (
          <p className="mt-4 text-navy/70">
            Password set — taking you to your dashboard…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
            />
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream shadow-[0_0_0_5px_var(--color-ivory)] transition-shadow hover:bg-copper/90 hover:shadow-[0_0_0_7px_var(--color-ivory)] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Set password"}
            </button>
          </form>
        )}
      </Container>
    </section>
  );
}
