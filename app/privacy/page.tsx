import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Supplement :: LIFE, operated by LIFE Wellness Brands LLC.",
};

/**
 * 2026-07-17: the customer-visible "Draft notice" banner was removed ahead
 * of press/podcast outreach — a visible "not reviewed by a licensed
 * attorney" disclaimer is a real due-diligence liability once the site is
 * getting outside visibility, not just organic pre-launch traffic. This
 * comment is now the only reminder: THIS PAGE STILL HAS NOT HAD A REAL
 * LEGAL REVIEW, including for state-specific privacy laws (e.g. CCPA) and,
 * if applicable, international regulations (e.g. GDPR). Removing the
 * visible banner doesn't change that — get actual attorney sign-off before
 * relying on this copy as final.
 */
export default function Privacy() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-navy/50">
          Last updated: July 2026. Effective as of the date posted.
        </p>

        <div className="mt-10 flex flex-col gap-8 text-navy/80">
          <div>
            <h2 className="text-xl font-semibold text-navy">
              1. Introduction
            </h2>
            <p className="mt-3 leading-relaxed">
              This Privacy Policy explains how LIFE Wellness Brands LLC
              (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              collects, uses, and shares information when you use the
              Supplement :: LIFE website, wellness intake, and Protocol
              Dashboard (together, the &ldquo;Service&rdquo;).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              2. Information We Collect
            </h2>
            <p className="mt-3 leading-relaxed">We collect:</p>
            <ul className="mt-3 flex flex-col gap-2 pl-5 text-navy/80">
              <li className="list-disc">
                <strong>Account information</strong> — name and email address
                when you reserve a Founding Subscription or log in.
              </li>
              <li className="list-disc">
                <strong>Wellness intake information</strong> — what you share
                during your conversation with Sage, Your LIFE Guide (e.g. sleep,
                stress, energy, goals), and the resulting wellness profile
                and Botanical Track recommendations.
              </li>
              <li className="list-disc">
                <strong>Payment information</strong> — your $249 Founding
                Subscription deposit and any later Protocol Subscription
                payments are processed by Stripe. We do not store your full
                card number on our servers.
              </li>
              <li className="list-disc">
                <strong>Usage information</strong> — standard technical
                information like IP address, browser type, and pages
                visited, collected automatically when you use the Service.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              3. How We Use Information
            </h2>
            <p className="mt-3 leading-relaxed">
              We use your information to: create and manage your account;
              generate your personalized wellness profile and Botanical
              Track recommendation; process payments and manage your
              Protocol Subscription; send transactional communications (like
              account, billing, and shipping emails); provide customer
              support; and maintain the security and integrity of the
              Service. We do not use your wellness intake information for
              advertising.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              4. Third-Party Service Providers
            </h2>
            <p className="mt-3 leading-relaxed">
              We share information with the following service providers
              solely to operate the Service, under their own privacy and
              security terms:
            </p>
            <ul className="mt-3 flex flex-col gap-2 pl-5 text-navy/80">
              <li className="list-disc">
                <strong>Stripe</strong> — payment processing and billing.
              </li>
              <li className="list-disc">
                <strong>Supabase</strong> — account authentication and
                secure data storage.
              </li>
              <li className="list-disc">
                <strong>Resend</strong> — transactional email delivery.
              </li>
              <li className="list-disc">
                <strong>Anthropic</strong> — powers the conversational
                wellness intake (Sage, Your LIFE Guide); your intake responses are
                processed to generate your wellness profile and Botanical
                Track recommendation.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed">
              We do not sell your personal information, and we do not
              currently use third-party advertising or analytics trackers on
              the Service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              5. Cookies
            </h2>
            <p className="mt-3 leading-relaxed">
              We use essential cookies to keep you securely logged in and to
              maintain your session. We do not currently use non-essential
              tracking or advertising cookies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              6. Data Retention
            </h2>
            <p className="mt-3 leading-relaxed">
              We retain your account and wellness profile information for as
              long as your account is active, and for a reasonable period
              afterward to comply with legal, tax, and accounting
              obligations, or to resolve disputes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              7. Your Rights &amp; Choices
            </h2>
            <p className="mt-3 leading-relaxed">
              Depending on where you live, you may have the right to access,
              correct, delete, or receive a copy of the personal information
              we hold about you. To make a request, email{" "}
              <a
                href="mailto:hello@yourlifeprotocol.com"
                className="text-copper underline"
              >
                hello@yourlifeprotocol.com
              </a>
              . We will respond within a reasonable timeframe.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              8. Children&apos;s Privacy
            </h2>
            <p className="mt-3 leading-relaxed">
              The Service is intended for adults 18 and older and is not
              directed to children. We do not knowingly collect personal
              information from anyone under 18.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">9. Security</h2>
            <p className="mt-3 leading-relaxed">
              We use reasonable administrative, technical, and physical
              safeguards to protect your information. No method of
              transmission or storage is completely secure, and we cannot
              guarantee absolute security.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              10. Changes to This Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              We may update this Privacy Policy from time to time. If we
              make material changes, we&apos;ll update the &ldquo;Last
              updated&rdquo; date above and, where appropriate, notify you
              directly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              11. Contact Us
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
