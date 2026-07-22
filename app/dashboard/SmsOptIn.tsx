"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Sage's daily SMS nudge — dashboard opt-in (2026-07-22). Deliberately
 * post-signup/dashboard-only, not part of any checkout form (Reserve/
 * Assessment/Concierge): lowest lift, and the subscriber is already
 * authenticated so we can attribute consent to a real account.
 *
 * Same direct-Supabase-update pattern as AccountSettings.tsx (RLS's
 * existing update-own-row policy on profiles already covers the new
 * phone_number/sms_opt_in/sms_consent_at columns — no new API route
 * needed). The actual sending happens in
 * netlify/functions/send-daily-sms.mts; this component only writes the
 * opt-in state + phone number.
 */
export default function SmsOptIn({
  initialPhoneNumber,
  initialOptIn,
}: {
  initialPhoneNumber: string;
  initialOptIn: boolean;
}) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [optIn, setOptIn] = useState(initialOptIn);
  const [consented, setConsented] = useState(initialOptIn);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function normalizePhone(raw: string): string | null {
    const digits = raw.replace(/[^0-9+]/g, "");
    const digitsOnly = digits.replace(/\+/g, "");
    if (digitsOnly.length === 10) return `+1${digitsOnly}`;
    if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) return `+${digitsOnly}`;
    if (digits.startsWith("+") && digitsOnly.length >= 10) return digits;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (optIn) {
      if (!consented) {
        setError("Please confirm you'd like to receive texts from Sage.");
        setStatus("error");
        return;
      }
      const normalized = normalizePhone(phoneNumber);
      if (!normalized) {
        setError("That doesn't look like a valid phone number.");
        setStatus("error");
        return;
      }
      setPhoneNumber(normalized);
      await save(normalized, true);
    } else {
      await save(phoneNumber, false);
    }
  }

  async function save(phone: string, nextOptIn: boolean) {
    setStatus("saving");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setError("You need to be signed in.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone_number: phone,
        sms_opt_in: nextOptIn,
        sms_consent_at: nextOptIn ? new Date().toISOString() : null,
      })
      .eq("user_id", user.id);

    if (updateError) {
      setStatus("error");
      setError("Couldn't save — try again.");
    } else {
      setOptIn(nextOptIn);
      setStatus("saved");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-navy">Sage&apos;s daily SMS nudge</p>
          <p className="mt-1 text-sm text-navy/60">
            One short text a day — hydration one day, your fasting window the
            next — pulled straight from your Daily Practices above. Reply
            STOP any time to opt out.
          </p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => {
              setOptIn(e.target.checked);
              setStatus("idle");
              setError(null);
            }}
            className="peer sr-only"
          />
          <span className="h-6 w-11 rounded-full bg-navy/15 transition-colors peer-checked:bg-copper" />
          <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {optIn && (
        <div className="flex flex-col gap-3 border-t border-navy/10 pt-4">
          <div>
            <label className="text-sm font-medium text-navy" htmlFor="sms-phone">
              Mobile number
            </label>
            <input
              id="sms-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setStatus("idle");
              }}
              required
              className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
            />
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => {
                setConsented(e.target.checked);
                setStatus("idle");
              }}
              required
              className="mt-1 h-4 w-4 shrink-0 rounded border-navy/30 text-copper focus:ring-copper"
            />
            <span className="text-xs leading-relaxed text-navy/60">
              I agree to receive automated wellness text messages from
              Supplement :: LIFE at the number above. Message and data rates
              may apply. Message frequency: about 1/day. Reply STOP to
              cancel, HELP for help.
            </span>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="self-start rounded-full bg-navy px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-navy/90 disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : optIn ? "Save & turn on texts" : "Save"}
      </button>
      {status === "saved" && (
        <p className="text-sm text-sage">
          {optIn ? "You're set — Sage will start texting daily." : "Saved. Texts are off."}
        </p>
      )}
      {status === "error" && error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
