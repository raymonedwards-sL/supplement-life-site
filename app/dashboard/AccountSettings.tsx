"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AvatarUpload from "@/components/AvatarUpload";

/**
 * Self-service account editing on the dashboard: profile photo (Supabase
 * Storage upload, see AvatarUpload.tsx), full name (a direct table
 * update), and email (routed through Supabase Auth's updateUser(), which
 * emails a confirmation link to the new address before the change takes
 * effect — the old email stays active until then).
 */
export default function AccountSettings({
  userId,
  initialFullName,
  initialEmail,
  initialAvatarUrl,
}: {
  userId: string;
  initialFullName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const [email, setEmail] = useState(initialEmail);
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "sent" | "error">(
    "idle"
  );
  const [emailError, setEmailError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameStatus("saving");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setNameStatus("error");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", user.id);

    setNameStatus(error ? "error" : "saved");
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("saving");
    setEmailError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      }
    );

    if (error) {
      setEmailStatus("error");
      setEmailError(error.message);
    } else {
      setEmailStatus("sent");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      setPasswordStatus("error");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      setPasswordStatus("error");
      return;
    }

    setPasswordStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordStatus("error");
      setPasswordError(error.message);
    } else {
      setPasswordStatus("saved");
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <AvatarUpload
        userId={userId}
        initialAvatarUrl={initialAvatarUrl}
        fullName={initialFullName}
        email={initialEmail}
      />

      <form onSubmit={saveName} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-navy" htmlFor="full-name">
          Full name
        </label>
        <input
          id="full-name"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameStatus("idle");
          }}
          placeholder="Jane Doe"
          className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
        />
        <button
          type="submit"
          disabled={nameStatus === "saving"}
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {nameStatus === "saving" ? "Saving…" : "Save name"}
        </button>
        {nameStatus === "saved" && <p className="text-sm text-sage">Saved.</p>}
        {nameStatus === "error" && (
          <p className="text-sm text-red-600">Couldn&apos;t save — try again.</p>
        )}
      </form>

      <form onSubmit={saveEmail} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-navy" htmlFor="account-email">
          Email
        </label>
        <input
          id="account-email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailStatus("idle");
          }}
          className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
        />
        <button
          type="submit"
          disabled={emailStatus === "saving" || email === initialEmail}
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {emailStatus === "saving" ? "Sending…" : "Update email"}
        </button>
        {emailStatus === "sent" && (
          <p className="text-sm text-navy/60">
            Check <strong>{email}</strong> for a confirmation link to finish the
            change. Your current email stays active until then.
          </p>
        )}
        {emailStatus === "error" && (
          <p className="text-sm text-red-600">{emailError}</p>
        )}
      </form>

      <form onSubmit={savePassword} className="flex flex-col gap-3 sm:col-span-2">
        <label className="text-sm font-medium text-navy" htmlFor="new-password">
          {"Password (leave blank to keep using email login links only)"}
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            id="new-password"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordStatus("idle");
            }}
            className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordStatus("idle");
            }}
            className="w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={passwordStatus === "saving" || !password}
          className="self-start rounded-full bg-navy px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {passwordStatus === "saving" ? "Saving…" : "Set password"}
        </button>
        {passwordStatus === "saved" && (
          <p className="text-sm text-sage">
            Password set — you can now log in with email + password too.
          </p>
        )}
        {passwordStatus === "error" && (
          <p className="text-sm text-red-600">{passwordError}</p>
        )}
      </form>
    </div>
  );
}
