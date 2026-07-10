import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Refund & Shipping Policy",
  description:
    "Refund, cancellation, and shipping policy for Supplement :: LIFE, operated by LIFE Wellness Brands LLC.",
};

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

        <div className="mt-6 rounded-xl border border-copper/30 bg-copper/5 p-4 text-sm leading-relaxed text-navy/70">
          <strong className="text-navy">Draft notice:</strong> This page is a
          working draft prepared for pre-launch and payment-processor
          review. Shipping specifics below are placeholders (marked in
          brackets) pending finalized fulfillment logistics, and this
          content should receive full legal review before Supplement ::
          LIFE is generally available to the public.
        </div>

        <div className="mt-10 flex flex-col gap-8 text-navy/80">
          <div>
            <h2 className="text-xl font-semibold text-navy">
              1. Founding Subscription Deposit Refunds
            </h2>
            <p className="mt-3 leading-relaxed">
              Your $249 Founding Subscription deposit is fully refundable at
              any time before it converts to your Protocol Subscription at
              go-live (billed at $249/month for your first six months, then
              $499/month thereafter). To request a refund, email{" "}
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
              shipment ships via [CARRIER — TBD] and typically arrives
              within [X–Y business days] of processing. Processing
              typically takes [X business days] before a shipment leaves our
              fulfillment center. You&apos;ll receive an email with tracking
              information as soon as your order ships.
            </p>
            <p className="mt-3 leading-relaxed">
              We currently ship within [SHIPPING REGIONS — TBD]. If your
              address falls outside that range, we&apos;ll contact you
              directly.
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
              within [X days] of delivery with a photo of the issue, and
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
