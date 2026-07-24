import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LoginPrompt from "@/components/LoginPrompt";
import AccessRevoked from "@/components/AccessRevoked";
import AccountSettings from "./AccountSettings";
import BillingPortalButton from "./BillingPortalButton";
import SmsOptIn from "./SmsOptIn";
import { findTrack } from "@/lib/tracks";
import { Container, Eyebrow } from "@/components/ui/Container";
import {
  groupIngredientEducationByCategory,
  getDominantBenefitCategory,
} from "@/lib/ingredient-education";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import { getTrackAtmosphere } from "@/lib/tracks-atmosphere";
import { parseRationale } from "@/lib/rationale";
import { fetchTrustedArticlesByCategory } from "@/lib/third-party-articles";
import { resolveIntakeAccess } from "@/lib/access/intake-access";

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
    { data: lifeAssessmentPurchase },
    { data: lifeConciergePurchase },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "current_summary, updated_at, water_intake_recommendation, fasting_recommendation, phone_number, sms_opt_in"
      )
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
    supabase.from("users").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
    // LIFE Assessment funnel (2026-07-17): a subscriber who paid $797 for
    // the assessment but never reserved a Founding Subscription has no
    // `subscriptions` row at all — used below to surface the "Become a
    // Founding Subscriber" upsell instead of assuming everyone here
    // arrived via the $249 reservation flow.
    supabase
      .from("life_assessment_purchases")
      .select("id, purchased_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    // LIFE Concierge (2026-07-21): same idea as the assessment purchase
    // above, but for the $1,995 practitioner add-on — also has no
    // `subscriptions` row on its own, since it doesn't include Botanical
    // Track kits either.
    supabase
      .from("life_concierge_purchases")
      .select("id, purchased_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const hasAssessment = Boolean(lifeAssessmentPurchase);
  const hasConcierge = Boolean(lifeConciergePurchase);
  // Surfaces the "Become a Founding Subscriber" upsell for anyone who's
  // paid for guidance (Assessment and/or Concierge) but has no
  // subscription row — i.e. no path to actually receiving Botanical Track
  // kits yet, since only the Founding Subscription ships product.
  const showFoundingSubscriberUpsell = !subscription && (hasAssessment || hasConcierge);
  // Gates the "Retake your intake" link below — a LIFE Assessment-only or
  // LIFE Concierge-only account only gets retakes for its own window
  // (lib/access/intake-access.ts); this is a read of the same rule
  // /api/intake/chat enforces server-side, not a second source of truth.
  const intakeAccess = resolveIntakeAccess({
    subscriptionStatus: subscription?.status ?? null,
    lifeAssessmentPurchasedAt: lifeAssessmentPurchase?.purchased_at ?? null,
    lifeConciergePurchasedAt: lifeConciergePurchase?.purchased_at ?? null,
  });

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
  const allIngredientNames = tracks.flatMap((t) => t.ingredients);
  const ingredientGroups = groupIngredientEducationByCategory(allIngredientNames);
  // Legend for the copper category tags shown on each track's image below —
  // only the categories actually in use for this subscriber's own tracks,
  // deduped, in first-seen order.
  const categoryLegend = Array.from(
    new Map(
      tracks
        .map((t) => getDominantBenefitCategory(t.ingredients))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .map((c) => [c.key, c])
    ).values()
  );
  const atmosphere = getTrackAtmosphere(tracks[0]?.id);
  // Live third-party credible-source articles, one query per benefit
  // category present in this subscriber's protocol (lib/third-party-
  // articles.ts) — resolves to [] until GOOGLE_CSE_API_KEY/GOOGLE_CSE_CX
  // are configured, so this never blocks the rest of the dashboard.
  const trustedArticleGroups = await fetchTrustedArticlesByCategory(
    ingredientGroups.map((g) => ({ key: g.key, label: g.label }))
  );
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
          {showFoundingSubscriberUpsell && (
            <div className="rounded-2xl border border-copper/30 bg-navy p-6 text-cream sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-copper">
                Become a Founding Subscriber
              </p>
              <h2 className="mt-2 text-xl font-semibold text-cream">
                Lock in $249/month before public launch.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">
                {hasAssessment
                  ? "Your LIFE Assessment and Brief are a one-time diagnostic — the Founding Subscription is the ongoing relationship: monthly Botanical Track shipments, and Sage refining your formula as your life changes."
                  : "Your LIFE Concierge enrollment gives you 1:1 practitioner sessions and Sage's ongoing guidance — the Founding Subscription is what adds monthly Botanical Track shipments to your protocol."}{" "}
                Reserve now and your rate is locked at $249/month for your
                first six months, half the $499/month we&apos;ll charge the
                public starting October 2026.
              </p>
              <Link
                href="/reserve"
                className="mt-4 inline-block rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream shadow-[0_0_0_5px_var(--color-ivory)] transition-shadow hover:bg-copper/90 hover:shadow-[0_0_0_7px_var(--color-ivory)]"
              >
                Reserve Your Founding Subscription
              </Link>
            </div>
          )}

          {hasConcierge && (
            <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
              <p className="text-sm font-medium text-navy/50">Your LIFE Concierge</p>
              <p className="mt-2 text-navy/70">
                Your enrollment includes 3 private 30-minute sessions with a
                dedicated wellness practitioner. To schedule (or reschedule)
                a session, email{" "}
                <a
                  href="mailto:hello@yourlifeprotocol.com"
                  className="font-semibold text-copper underline underline-offset-2"
                >
                  hello@yourlifeprotocol.com
                </a>
                .
              </p>
            </div>
          )}

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
                  {intakeAccess.allowed && (
                    <Link
                      href="/intake"
                      className="text-sm font-semibold text-copper underline underline-offset-2"
                    >
                      Retake your intake
                    </Link>
                  )}
                  <a
                    href="/api/dashboard/insights-pdf"
                    className="text-sm font-semibold text-copper underline underline-offset-2"
                  >
                    Download Your LIFE Brief (PDF)
                  </a>
                  {tracks.length > 0 && (
                    <Link
                      href="/dashboard/brief"
                      className="text-sm font-semibold text-copper underline underline-offset-2"
                    >
                      View Your Full LIFE Brief →
                    </Link>
                  )}
                </div>
                {!intakeAccess.allowed &&
                  (intakeAccess.reason === "assessment_window_expired" ||
                    intakeAccess.reason === "concierge_window_expired") && (
                  <p className="mt-2 text-xs leading-relaxed text-navy/50">
                    {intakeAccess.reason === "concierge_window_expired"
                      ? "Your LIFE Concierge access window has closed."
                      : "Your LIFE Assessment's 90-day retake window has closed."}{" "}
                    <Link href="/reserve" className="font-semibold text-copper underline underline-offset-2">
                      Reserve a Founding Subscription
                    </Link>{" "}
                    to keep an ongoing relationship with Sage.
                  </p>
                )}
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

          {(profile?.water_intake_recommendation || profile?.fasting_recommendation) && (
            <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
              <p className="text-sm font-medium text-navy/50">Your Daily Practices</p>
              <p className="mt-1 text-sm text-navy/60">
                Sage&apos;s hydration and fasting guidance, personalized to how
                you actually live — revisit your intake any time to refine it.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {profile?.water_intake_recommendation && (
                  <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
                    <div className="flex items-center gap-2 text-copper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
                      </svg>
                      <p className="text-sm font-bold uppercase tracking-wide">
                        Hydration
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-navy/75">
                      {profile.water_intake_recommendation}
                    </p>
                  </div>
                )}
                {profile?.fasting_recommendation && (
                  <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
                    <div className="flex items-center gap-2 text-copper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                      <p className="text-sm font-bold uppercase tracking-wide">
                        Fasting Window
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-navy/75">
                      {profile.fasting_recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(profile?.water_intake_recommendation || profile?.fasting_recommendation) && (
            <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
              <SmsOptIn
                initialPhoneNumber={profile?.phone_number ?? ""}
                initialOptIn={profile?.sms_opt_in ?? false}
              />
            </div>
          )}

          <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
            <p className="text-sm font-medium text-navy/50">Your Botanical Tracks</p>
            {tracks.length > 0 ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {tracks.map((t, i) => {
                    const dominantCategory = getDominantBenefitCategory(t.ingredients);
                    return (
                      <div
                        key={t.id}
                        className="flex flex-col items-center rounded-xl border border-navy/10 bg-white/70 p-4 text-center"
                      >
                        <div className="relative h-72 w-44 overflow-hidden rounded-lg shadow-md">
                          <Image
                            src={t.image}
                            alt={`${t.name} packaging`}
                            fill
                            quality={90}
                            sizes="(min-width: 640px) 176px, 60vw"
                            className="object-cover"
                          />
                        </div>
                        <span className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-copper/70">
                          {TRACK_ROLE_LABELS[i] ?? "Additional"}
                        </span>
                        <span className="mt-0.5 text-base font-bold text-navy">
                          {t.name}
                        </span>
                        {dominantCategory && (
                          <span className="mt-1.5 rounded-full bg-copper/10 px-2.5 py-0.5 text-[11px] font-bold text-copper">
                            {dominantCategory.label}
                          </span>
                        )}
                        {reasonFor(t.id) && (
                          <p className="mt-3 border-t border-navy/10 pt-3 text-left text-sm leading-relaxed text-navy/75">
                            {reasonFor(t.id)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {categoryLegend.length > 0 && (
                  <div className="mt-5 flex flex-col gap-2 border-t border-navy/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                      What the copper tags mean
                    </p>
                    {categoryLegend.map((cat) => (
                      <p key={cat.key} className="text-sm leading-relaxed text-navy/70">
                        <span className="mr-2 inline-block rounded-full bg-copper/10 px-2.5 py-0.5 text-[11px] font-bold text-copper">
                          {cat.label}
                        </span>
                        {cat.description}
                      </p>
                    ))}
                  </div>
                )}
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

          {ingredientGroups.length > 0 && (
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
                  Grouped by what each one actually helps with — the copper tag
                  above each Botanical Track image above tells you which group
                  it draws from most.
                </p>
                <div className="mt-6 flex flex-col gap-8">
                  {ingredientGroups.map((group) => (
                    <div key={group.key}>
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                        <h3 className="text-base font-bold text-navy">{group.label}</h3>
                        <span className="text-sm font-medium text-navy/70">{group.description}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {group.ingredients.map((ing) => (
                          <IngredientCard key={ing.name} ingredient={ing} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {trustedArticleGroups.length > 0 && (
            <div className="rounded-2xl border border-navy/10 border-t-2 border-t-copper bg-white/40 p-6 sm:col-span-2">
              <p className="text-sm font-medium text-navy/50">From Trusted Sources</p>
              <p className="mt-1 text-sm text-navy/60">
                Independent, credible writing on your protocol&apos;s benefit
                areas — so you can verify the wellness thinking here without
                leaving your dashboard. Updates as your protocol evolves.
              </p>
              <div className="mt-4 flex flex-col gap-6">
                {trustedArticleGroups.map((group) => (
                  <div key={group.categoryKey}>
                    <h3 className="text-sm font-bold text-navy">{group.categoryLabel}</h3>
                    <div className="mt-2 flex flex-col gap-2">
                      {group.articles.map((article) => (
                        <a
                          key={article.url}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-navy/10 bg-white/70 p-4 transition-colors hover:border-copper/40"
                        >
                          <p className="text-sm font-semibold text-navy">{article.title}</p>
                          {article.snippet && (
                            <p className="mt-1 text-xs leading-relaxed text-navy/60">
                              {article.snippet}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs font-medium text-copper">
                            {article.source}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
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
              userId={user.id}
              initialFullName={accountRow?.full_name ?? ""}
              initialEmail={user.email ?? ""}
              initialAvatarUrl={accountRow?.avatar_url ?? null}
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
