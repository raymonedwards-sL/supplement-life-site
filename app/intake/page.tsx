import { createClient } from "@/lib/supabase/server";
import IntakeChat from "./IntakeChat";
import LoginPrompt from "@/components/LoginPrompt";

export default async function Intake() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Your Wellness Intake
      </h1>
      <p className="mt-3 text-navy/70">
        A short conversation to get you a personalized track recommendation.
      </p>

      {/* FR-5: persistent, non-dismissible disclaimer on every intake/results screen. */}
      <p className="mt-6 rounded-lg border border-navy/10 bg-navy/5 px-4 py-3 text-xs leading-relaxed text-navy/60">
        This intake shares personalized wellness information based on what
        you tell us — it is not medical advice, a diagnosis, or a treatment
        recommendation. For any medical concern, please consult a healthcare
        provider.
      </p>

      <div className="mt-8">
        {user ? <IntakeChat /> : <LoginPrompt redirectPath="/intake" />}
      </div>
    </section>
  );
}
