import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Refund & Shipping Policy",
  description:
    "Refund, cancellation, and shipping policy for Supplement :: LIFE, operated by LIFE Wellness Brands LLC.",
};

/**
 * 2026-07-17: the customer-visible "Draft notice" banner was removed ahead
 * of press/podcast outreach, and the bracketed shipping placeholders
 * ([CARRIER — TBD], etc.) were replaced with conservative, non-fabricated
 * generic language so the page doesn't show raw brackets to a visiting
 * journalist. THIS IS STILL NOT FINAL: the shipping timelines below
 * (processing time, transit time, damage-report window) are placeholder-
 * safe estimates, not confirmed fulfillment SLAs — swap them for real
 * numbers once a logistics/carrier partner is finalized. The shipping
 * regions line (US/CA/MX) IS accurate — it matches the geo-eligibility
 * already enforced sitewide (lib/geo/allowed-countries.ts), not a guess.
 * This page also still has not had a real legal review — get actual
 * attorney sign-off before relying on this copy as final.
 */
export default function RefundPolicy() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Eyebrow>Legal</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Refund &amp; Shipping Policy
        </h1>
        <p className="mt-3 text-sm text-navy/50">
          Last updated: July 2026. Effective as of the date posted.
        </p>

        <div className="mt-10 flex flex-col gap-8 text-navy/80">
          <div>
            <h2 className="text-xl font-semibold text-navy">
              1. Founding Subscription Deposit Refunds
            </h2>
            <p className="mt-3 leading-relaxed">
              Your $249 Founding Subscription deposit is fully refundable at
              any time before it converts to your Protocol Subscription at
              go-live (billed at $249/month for your first six months —
              half the $499/month price we&apos;ll offer the public
              starting October 2026 — then $499/month thereafter). To
              request a refund, email{" "}
              <a
                href="mailto:hello@yourlifeprotocol.com"
                className="text-copper underline"
              >
                hello@yourlifeprotocol.com
              </a>{" "}
              from the address you reserved with. Approved refunds are
              typically returned to your original payment method within 5–10
              business days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              2. Protocol Subscription Cancellation
            </h2>
            <p className="mt-3 leading-relaxed">
              You can cancel your recurring Protocol Subscription at any
              time from your Protocol Dashboard&apos;s billing portal.
              Cancellation takes effect at the end of your current billing
              period — you&apos;ll keep access through that date and won&apos;t
              be charged again afterward. Payments already made for a
              current billing period are non-refundable, except where
              required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              3. Shipping Policy
            </h2>
            <p className="mt-3 leading-relaxed">
              Once your Protocol Subscription is active, your personalized
              shipment ships via a trusted carrier and typically arrives
              within 5–7 business days of processing. Processing typically
              takes 1–2 business days before a shipment leaves our
              fulfillment center. You&apos;ll receive an email with tracking
              information as soon as your order ships.
            </p>
            <p className="mt-3 leading-relaxed">
              We currently ship within the United States, Canada, and
              Mexico. If your address falls outside that range, we&apos;ll
              contact you directly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              4. Order Cancellation
            </h2>
            <p className="mt-3 leading-relaxed">
              If you need to cancel or change an individual shipment, email{" "}
              <a
                href="mailto:hello@yourlifeprotocol.com"
                className="text-copper underline"
              >
                hello@yourlifeprotocol.com
              </a>{" "}
              as soon as possible. We can make changes any time before an
              order has been prepared for shipment; once an order has
              shipped, we&apos;re unable to cancel or redirect it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              5. Damaged or Incorrect Items
            </h2>
            <p className="mt-3 leading-relaxed">
              If your order arrives damaged or incorrect, email{" "}
              <a
                href="mailto:hello@yourlifeprotocol.com"
                className="text-copper underline"
              >
                hello@yourlifeprotocol.com
              </a>{" "}
              within 7 days of delivery with a photo of the issue, and
              we&apos;ll arrange a replacement or credit.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-navy">
              6. Contact Us
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
