import Link from "next/link";

/**
 * Shown in place of intake/dashboard content when a logged-in user's
 * subscription is "refunded" or "canceled" — i.e. they still have an
 * account, but their Founding Reservation deposit no longer entitles them
 * to portal access. Their prior intake/profile/track data is retained in
 * the database, just not surfaced here.
 */
export default function AccessRevoked() {
  return (
    <div className="mt-4 rounded-2xl border border-navy/10 bg-white/50 p-6">
      <p className="text-navy/80">
        Your Founding Reservation deposit was refunded, so this area is no
        longer available on this account.
      </p>
      <p className="mt-3 text-sm text-navy/60">
        Changed your mind?{" "}
        <Link
          href="/reserve"
          className="font-semibold text-copper underline underline-offset-2"
        >
          Reserve your spot again
        </Link>
        .
      </p>
    </div>
  );
}
