import Link from "next/link";

/**
 * Shown when a logged-in, non-refunded account doesn't currently qualify
 * for intake access — either their LIFE Assessment's 90-day retake window
 * has closed (lib/access/intake-access.ts), or (defensively) they have no
 * purchase on file at all. Deliberately distinct from AccessRevoked, which
 * is specifically for refunded/canceled accounts and carries different,
 * refund-specific copy — conflating the two would misdescribe why access
 * is unavailable.
 */
export default function IntakeAccessLocked() {
  return (
    <div className="mt-4 rounded-2xl border border-navy/10 bg-white/50 p-6">
      <p className="text-navy/80">
        Your LIFE Assessment included 90 days of access to revisit your
        intake with Sage — that window has closed on this account.
      </p>
      <p className="mt-3 text-sm text-navy/60">
        Reserve a Founding Subscription to continue an ongoing relationship
        with Sage, with your protocol refined as your life changes.{" "}
        <Link
          href="/reserve"
          className="font-semibold text-copper underline underline-offset-2"
        >
          Reserve Your Founding Subscription
        </Link>
        .
      </p>
    </div>
  );
}
