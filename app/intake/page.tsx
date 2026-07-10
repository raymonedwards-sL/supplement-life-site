import { createClient } from "@/lib/supabase/server";
import IntakeChat from "./IntakeChat";
import LoginPrompt from "@/components/LoginPrompt";
import AccessRevoked from "@/components/AccessRevoked";
import { Container, Eyebrow } from "@/components/ui/Container";

const BLOCKED_STATUSES = new Set(["refunded", "canceled"]);

export default async function Intake() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isBlocked = false;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();
    isBlocked = Boolean(subscription?.status && BLOCKED_STATUSES.has(subscription.status));
  }

  return (
    <section className="py-16">
      <Container className="max-w-2xl">
        <Eyebrow>Wellness Intake</Eyebrow>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Let&apos;s find your Botanical Track.
        </h1>
        <p className="mt-3 text-navy/70">
          A guided conversation to build your personalized Botanical Track
          recommendation — at your own pace, with no time limit.
        </p>

        {/* FR-5: persistent, non-dismissible disclaimer on every intake/results screen. */}
        <p className="mt-6 rounded-lg border border-navy/10 bg-navy/5 px-4 py-3 text-xs leading-relaxed text-navy/60">
          This intake shares personalized wellness information based on what
          you tell us — it is not medical advice, a diagnosis, or a treatment
          recommendation. For any medical concern, please consult a
          healthcare provider.
        </p>

        <div className="mt-8">
          {!user ? (
            <LoginPrompt redirectPath="/intake" />
          ) : isBlocked ? (
            <AccessRevoked />
          ) : (
            <IntakeChat />
          )}
        </div>
      </Container>
    </section>
  );
}
