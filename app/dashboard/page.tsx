import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LoginPrompt from "@/components/LoginPrompt";
import AccessRevoked from "@/components/AccessRevoked";
import AccountSettings from "./AccountSettings";
import BillingPortalButton from "./BillingPortalButton";
import { findTrack } from "@/lib/tracks";
import { Container, Eyebrow } from "@/components/ui/Container";
import { getIngredientEducationList } from "@/lib/ingredient-education";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import { getTrackAtmosphere } from "@/lib/tracks-atmosphere";
import { parseRationale } from "@/lib/rationale";

const BLOCKED_STATUSES = new Set(["refunded", "canceled"]);
const TRACK_ROLE_LABELS = ["Primary", "Secondary", "Tertiary"];

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <section className="py-20">
        <Container className="max-w-xl">
          <Eyebrow>Protocol Dashboard</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-4 text-navy/70">
            Log in to see your wellness profile, Botanical Track, and billing.
          </p>
          <LoginPrompt redirectPath="/dashboard" />
        </Container>
      </section>
    );
  }

  const [
    { data: profile },
    { data: trackAssignment },
    { data: subscription },
    { data: accountRow },
  ] = await Promise.all([
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
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (subscription?.status && BLOCKED_STATUSES.has(subscription.status)) {
    return (
      <section className="py-20">
        <Container className="max-w-xl">
          <Eyebrow>Protocol Dashboard</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-navy/70">{user.email}</p>
          <AccessRevoked />
        </Container>
      </section>
    );
  }

  const trackIds = (trackAssignment?.tracks ?? []) as string[];
  const tracks = trackIds
    .map((id: string) => findTrack(id))
    .filter((t: ReturnType<typeof findTrack>): t is NonNullable<typeof t> => Boolean(t));
  const ingredients = getIngredientEducationList(tracks.flatMap((t) => t.ingredients));
  const atmosphere = getTrackAtmosphere(tracks[0]?.id);
  const rationaleEntries = parseRationale(trackAssignment?.rationale);
  const reasonFor = (trackId: string) =>
    rationaleEntries.find((r) => r.track_id === trackId)?.reason;
  // Legacy rows (pre 2026-07-13) stored one shared paragraph with no
  // track_id — surface that as a general note instead of silently
  // dropping it, since it's still real content for existing subscribers.
  const legacyRationale = rationaleEntries.find((r) => !r.track_id)?.reason;

  const conversionDate = subscription?.conversion_date
    ? new Date(subscription.conversion_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const statusLabel = subscription?.status ?? "unknown";
  const statusStyles: Record<string, string> = {
    active: "bg-sage/10 text-sage",
    trialing: "bg-copper/10 text-copper",
    unknown: "bg-navy/5 text-navy/50",
  };

  return (
    <section className="bg-gradient-to-b from-copper/[0.06] via-transparent to-transparent py-16">
      <Container className="max-w-3xl">
        <div className="flex items-center justify-between gap-4 border-b border-copper/20 pb-6">
          <div>
            <Eyebrow>Protocol Dashboard</Eyebrow>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 text-navy/70">{user.email}</p>
          </div>
          <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-copper/30 bg-copper/10 text-lg font-semibold text-copper sm:flex">
            S∷L
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
            <p className="text-sm font-medium text-navy/50">
              Your Wellness Profile
            </p>
            {profile?.current_summary ? (
              <>
                <p className="mt-3 border-l-4 border-copper/30 pl-5 text-lg font-medium leading-relaxed text-navy">
                  {profile.current_summary}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <Link
                    href="/intake"
                    className="text-sm font-semibold text-copper underline underline-offset-2"
                  >
                    Retake your intake
                  </Link>
                  <a
                    href="/api/dashboard/insights-pdf"
                    className="text-sm font-semibold text-copper underline underline-offset-2"
                  >
                    Download My Wellness Insights (PDF)
                  </a>
                </div>
              </>
            ) : (
              <p className="mt-3 text-navy/60">
                You haven&apos;t completed your wellness intake yet.{" "}
                <Link
                  href="/intake"
                  className="font-semibold text-copper underline underline-offset-2"
                >
                  Start it now
                </Link>
                .
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
            <p className="text-sm font-medium text-navy/50">Your Botanical Tracks</p>
            {tracks.length > 0 ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {tracks.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex flex-col items-center rounded-xl border border-navy/10 bg-white/70 p-4 text-center"
                    >
                      <div className="relative h-36 w-20 overflow-hidden rounded-sm shadow-sm">
                        <Image
                          src={t.image}
                          alt={`${t.name} packaging`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <span className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-copper/70">
                        {TRACK_ROLE_LABELS[i] ?? "Additional"}
                      </span>
                      <span className="mt-0.5 text-base font-bold text-navy">
                        {t.name}
                      </span>
                      {reasonFor(t.id) && (
                        <p className="mt-3 border-t border-navy/10 pt-3 text-left text-sm leading-relaxed text-navy/75">
                          {reasonFor(t.id)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {legacyRationale && (
                  <p className="mt-5 text-base font-medium leading-relaxed text-navy/80">
                    {legacyRationale}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-navy/60">Not assigned yet.</p>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-navy/10 border-t-2 border-t-copper sm:col-span-2">
              {atmosphere && (
                <>
                  <Image src={atmosphere} alt="" fill sizes="100vw" className="object-cover" aria-hidden />
                  <div className="absolute inset-0 bg-white/90" />
                </>
              )}
              <div className="relative p-6">
                <p className="text-sm font-medium text-navy/50">Your Botanical Compounds</p>
                <p className="mt-1 text-sm text-navy/60">
                  Every ingredient across your current protocol — what it is, why
                  it&apos;s formulated in, and where to read more.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ingredients.map((ing) => (
                    <IngredientCard key={ing.name} ingredient={ing} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-navy/10 bg-white/40 p-6 sm:col-span-2">
            <p className="text-sm font-medium text-navy/50">
              {subscription?.status === "active"
                ? "Next Billing Date"
                : "Subscription Begins"}
            </p>
            <p className="mt-2 text-xl font-semibold text-copper">
              {conversionDate ?? "TBD"}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                statusStyles[statusLabel] ?? statusStyles.unknown
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-navy/10 bg-white/40 p-6">
          <p className="text-sm font-medium text-navy/50">Account Settings</p>
          <div className="mt-4">
            <AccountSettings
              initialFullName={accountRow?.full_name ?? ""}
              initialEmail={user.email ?? ""}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-navy/10 bg-white/40 p-6">
          <p className="mb-3 text-sm text-navy/60">
            Update your payment method, view invoices, or cancel your
            subscription any time.
          </p>
          <BillingPortalButton />
        </div>
      </Container>
    </section>
  );
}
