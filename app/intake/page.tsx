import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IntakeChat from "./IntakeChat";
import LoginPrompt from "@/components/LoginPrompt";
import AccessRevoked from "@/components/AccessRevoked";
import IntakeAccessLocked from "@/components/IntakeAccessLocked";
import { Container, Eyebrow } from "@/components/ui/Container";
import { resolveIntakeAccess, type IntakeAccessResult } from "@/lib/access/intake-access";

export default async function Intake() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let access: IntakeAccessResult | null = null;
  if (user) {
    const [{ data: subscription }, { data: lifeAssessmentPurchase }] = await Promise.all([
      supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("life_assessment_purchases")
        .select("purchased_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    access = resolveIntakeAccess({
      subscriptionStatus: subscription?.status ?? null,
      lifeAssessmentPurchasedAt: lifeAssessmentPurchase?.purchased_at ?? null,
    });
  }

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Eyebrow>Wellness Intake</Eyebrow>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Let&apos;s find your Botanical Track.
        </h1>
        <p className="mt-3 text-navy/70">
          A guided conversation with Sage, Your LIFE Guide, to build your
          personalized Botanical Track recommendation — at your own pace,
          with no time limit.
        </p>

        {/* FR-5: persistent, non-dismissible disclaimer on every intake/results screen. */}
        <p className="mt-6 rounded-lg border border-navy/10 bg-navy/5 px-4 py-3 text-xs leading-relaxed text-navy/60">
          This intake shares personalized wellness information based on what
          you tell us — it is not medical advice, a diagnosis, or a treatment
          recommendation. For any medical concern, please consult a
          healthcare provider.
        </p>

        <div className="mt-3 flex items-start gap-3 rounded-lg border border-navy/10 bg-white/50 px-4 py-3 text-xs leading-relaxed text-navy/60">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0 text-copper"
            aria-hidden
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <p>
            Your answers stay confidential. We never sell your information
            or share it for advertising — what you tell Sage is used only
            to build your personal wellness profile and Botanical Track
            recommendation, and is protected with the same security
            safeguards as your account and payment information. See our{" "}
            <Link href="/privacy" className="font-semibold text-copper underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-8">
          {!user ? (
            <LoginPrompt redirectPath="/intake" />
          ) : access && !access.allowed && access.reason === "refunded_or_canceled" ? (
            <AccessRevoked />
          ) : access && !access.allowed ? (
            <IntakeAccessLocked />
          ) : (
            <IntakeChat />
          )}
        </div>
      </Container>
    </section>
  );
}
