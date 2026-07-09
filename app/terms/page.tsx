import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Supplement :: LIFE, operated by LIFE Wellness Brands LLC.",
};

export default function Terms() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-navy/50">
          Last updated: July 2026. Effective as of the date posted.
        </p>

        <div className="mt-6 rounded-xl border border-copper/30 bg-copper/5 p-4 text-sm leading-relaxed text-navy/70">
          <strong className="text-navy">Draft notice:</strong> This page is a
          working draft prepared for pre-launch and payment-processor review.
          It is not a substitute for advice from a licensed attorney and
          should receive full legal review before Supplement :: LIFE is
          generally available to the public.
        </div>

        <div className="mt-10 flex flex-col gap-8 text-navy/80">
          <div>
            <h2 className="text-xl font-semibold text-navy">
              1. Acceptance of these Terms
            </h2>
            <p className="mt-3 leading-relaxed">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access
              to and use of the Supplement :: LIFE website, wellness intake,
              Protocol Dashboard, and related services (together, the
              &ldquo;Service&rdquo;), operated by LIFE Wellness Brands LLC
              (&ldquo;LIFE Wellness Brands,&rdquo; &ldquo;we,&rdquo;
              &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By reserving a
              Founding Subscription, creating an account, or otherwise using
              the Service, you agree to be bound by these Terms. If you do
              not agree, do not use the Service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              2. Description of the Service
            </h2>
            <p className="mt-3 leading-relaxed">
              Supplement :: LIFE is a personalized supplement program. Users
              complete a guided wellness conversation (&ldquo;Your LIFE
              Guide&rdquo;) that produces a personalized wellness profile and
              a recommended Botanical Track or combination of Tracks — your
              Personalized LIFE Protocol. The Service is not a medical
              device, diagnostic tool, or telehealth service, and Your LIFE
              Guide does not provide medical advice. See Section 6 below.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              3. Eligibility &amp; Accounts
            </h2>
            <p className="mt-3 leading-relaxed">
              You must be at least 18 years old and legally able to enter
              into a binding contract to use the Service. You&apos;re
              responsible for maintaining the confidentiality of your
              account credentials and for all activity under your account.
              Accounts are created only after a completed Founding
              Subscription reservation and cannot be self-registered without
              one.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              4. Founding Subscriber Program &amp; Payment
            </h2>
            <p className="mt-3 leading-relaxed">
              The Founding Subscriber Program lets you reserve first access
              to Supplement :: LIFE with a $249 deposit (the &ldquo;Founding
              Subscription deposit&rdquo;), processed securely through
              Stripe. The deposit is fully credited toward your first
              Protocol Subscription payment when Supplement :: LIFE goes
              live, and is fully refundable any time before that conversion
              date — see our{" "}
              <a href="/refund-policy" className="text-copper underline">
                Refund Policy
              </a>{" "}
              for how to request a refund. The deposit is not an additional
              charge on top of your subscription.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              5. Protocol Subscription — Automatic Renewal &amp; Cancellation
            </h2>
            <p className="mt-3 leading-relaxed">
              Once your Founding Subscription deposit converts, your Protocol
              Subscription is a recurring, automatically renewing monthly
              charge that continues until you cancel. You can cancel at any
              time from your Protocol Dashboard&apos;s billing portal;
              cancellation takes effect at the end of your current billing
              period, and you will not be charged again after that date.
              Except as described in our{" "}
              <a href="/refund-policy" className="text-copper underline">
                Refund Policy
              </a>
              , payments already made for a current billing period are
              non-refundable.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              6. Health &amp; Safety Disclaimer
            </h2>
            <p className="mt-3 leading-relaxed">
              Supplement :: LIFE provides personalized wellness information,
              not medical advice, a diagnosis, or a treatment plan. These
              statements have not been evaluated by the Food and Drug
              Administration, and our products are not intended to diagnose,
              treat, cure, or prevent any disease. Always consult a
              healthcare provider before starting any new supplement,
              especially if you are pregnant, nursing, taking prescription
              medication, or managing a medical condition.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              7. Intellectual Property
            </h2>
            <p className="mt-3 leading-relaxed">
              The Service, including its content, Botanical Track
              formulations, branding, and software, is owned by LIFE
              Wellness Brands LLC or its licensors and is protected by
              intellectual property laws. You may not copy, reproduce, or
              create derivative works from the Service without our written
              permission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              8. Disclaimers &amp; Limitation of Liability
            </h2>
            <p className="mt-3 leading-relaxed">
              The Service is provided &ldquo;as is&rdquo; without warranties
              of any kind, express or implied. To the fullest extent
              permitted by law, LIFE Wellness Brands LLC will not be liable
              for any indirect, incidental, special, or consequential
              damages arising from your use of the Service, and our total
              liability for any claim will not exceed the amount you paid us
              in the twelve months before the claim arose.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              9. Indemnification
            </h2>
            <p className="mt-3 leading-relaxed">
              You agree to indemnify and hold harmless LIFE Wellness Brands
              LLC, its officers, employees, and agents from any claims,
              damages, or expenses arising from your misuse of the Service
              or violation of these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              10. Binding Arbitration &amp; Class Action Waiver
            </h2>
            <p className="mt-3 leading-relaxed">
              You and LIFE Wellness Brands LLC agree that any dispute
              arising out of or relating to these Terms or the Service will
              be resolved through binding arbitration on an individual
              basis, rather than in court, except that either party may
              bring an individual claim in small claims court. You and LIFE
              Wellness Brands LLC each waive the right to a jury trial and
              to participate in a class action or class arbitration.
              Arbitration will be administered by a recognized arbitration
              organization under its rules then in effect, and will take
              place in, or be governed by the law of, the state identified
              in Section 11.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              11. Governing Law
            </h2>
            <p className="mt-3 leading-relaxed">
              These Terms are governed by the laws of the State of Nevada,
              without regard to its conflict-of-laws principles, except
              where preempted by federal law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              12. Changes to These Terms
            </h2>
            <p className="mt-3 leading-relaxed">
              We may update these Terms from time to time. If we make
              material changes, we&apos;ll update the &ldquo;Last
              updated&rdquo; date above and, where appropriate, notify you
              directly. Continued use of the Service after changes take
              effect means you accept the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              13. Contact Us
            </h2>
            <p className="mt-3 leading-relaxed">
              LIFE Wellness Brands LLC
              <br />
              11700 W. Charleston Blvd #170
              <br />
              Las Vegas, NV 89135
              <br />
              <a
                href="mailto:hello@yourlifeprotocol.com"
                className="text-copper underline"
              >
                hello@yourlifeprotocol.com
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
