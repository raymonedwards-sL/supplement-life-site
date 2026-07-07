import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LoginPrompt from "@/components/LoginPrompt";
import BillingPortalButton from "./BillingPortalButton";
import { findTrack } from "@/lib/tracks";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="mx-auto max-w-xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-4 text-navy/70">
          Log in to see your profile, track, and billing.
        </p>
        <LoginPrompt redirectPath="/dashboard" />
      </section>
    );
  }

  const [{ data: profile }, { data: trackAssignment }, { data: subscription }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("current_summary, updated_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("track_assignments")
        .select("tracks, rationale, assigned_at")
        .eq("user_id", user.id)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, conversion_date")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const trackIds = (trackAssignment?.tracks ?? []) as string[];
  const tracks = trackIds
    .map((id: string) => findTrack(id))
    .filter((t: ReturnType<typeof findTrack>): t is NonNullable<typeof t> => Boolean(t));

  const conversionDate = subscription?.conversion_date
    ? new Date(subscription.conversion_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Dashboard
      </h1>
      <p className="mt-3 text-navy/70">Welcome back, {user.email}.</p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-navy/10 bg-white/40 p-6 sm:col-span-2">
          <p className="text-sm font-medium text-navy/50">Your Wellness Profile</p>
          {profile?.current_summary ? (
            <p className="mt-2 text-navy/80">{profile.current_summary}</p>
          ) : (
            <p className="mt-2 text-navy/60">
              You haven&apos;t completed your wellness intake yet.{" "}
              <Link href="/intake" className="text-copper underline">
                Start it now
              </Link>
              .
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white/40 p-6">
          <p className="text-sm font-medium text-navy/50">Current Track</p>
          {tracks.length > 0 ? (
            <>
              <p className="mt-2 text-xl font-semibold text-copper">
                {tracks.map((t) => t.name).join(" + ")}
              </p>
              {trackAssignment?.rationale && (
                <p className="mt-2 text-sm text-navy/60">{trackAssignment.rationale}</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-navy/60">Not assigned yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-navy/10 bg-white/40 p-6">
          <p className="text-sm font-medium text-navy/50">
            {subscription?.status === "active" ? "Next Billing Date" : "Subscription Begins"}
          </p>
          <p className="mt-2 text-xl font-semibold text-copper">
            {conversionDate ?? "TBD"}
          </p>
          <p className="mt-2 text-sm capitalize text-navy/60">
            Status: {subscription?.status ?? "unknown"}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <p className="mb-3 text-sm text-navy/60">
          Update your payment method, view invoices, or cancel your
          subscription any time.
        </p>
        <BillingPortalButton />
      </div>
    </section>
  );
}
