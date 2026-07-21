import { Fragment } from "react";

type Tier = {
  eyebrow: string;
  name: string;
  price: string;
  priceDetail: string;
  cta?: string;
  highlighted?: boolean;
};

const TIERS: Tier[] = [
  {
    eyebrow: "Step one",
    name: "LIFE Assessment",
    price: "$797",
    priceDetail: "One-time",
  },
  {
    eyebrow: "Best value",
    name: "Founding Subscriber",
    price: "$249",
    priceDetail: "/mo for your first 6 months",
    highlighted: true,
  },
  {
    eyebrow: "Starting Oct 2026",
    name: "Public Rate",
    price: "$499",
    priceDetail: "/mo",
  },
];

type FeatureRow = {
  label: string;
  values: [boolean | string, boolean | string, boolean | string];
};

type Row = FeatureRow | { divider: string };

function isDivider(row: Row): row is { divider: string } {
  return "divider" in row;
}

// Grouped into two sections on purpose — Sage's guidance (assessment,
// LIFE Brief, Track match, ongoing dashboard) is genuinely included at
// every tier, always has been (reserving the Founding Subscription has
// redirected straight into the same /intake conversation since before
// LIFE Assessment existed as its own product). The real differentiator
// is product + terms, not access to Sage — the divider rows make that
// explicit instead of leaving three all-true rows looking like a mistake.
const FEATURES: Row[] = [
  {
    label: "Commitment",
    values: [
      "One-time — no further obligation, ever",
      "Auto-converts to a recurring monthly charge at go-live (cancel anytime before then)",
      "Recurring monthly subscription",
    ],
  },
  { divider: "Included at every tier" },
  { label: "Guided LIFE Assessment with Sage", values: [true, true, true] },
  { label: "Personalized LIFE Brief (PDF + email)", values: [true, true, true] },
  { label: "Botanical Track match, with full rationale", values: [true, true, true] },
  { label: "Ongoing dashboard + evolving Sage relationship", values: [true, true, true] },
  { divider: "Founding Subscriber exclusives" },
  { label: "Monthly Botanical Track shipments", values: [false, true, true] },
  { label: "Rate locked in before public launch", values: [false, true, false] },
  { label: "Priority onboarding at go-live", values: [false, true, false] },
  {
    label: "Price per month",
    values: ["—", "$249 for 6 months, then $499", "$499"],
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-copper/15 text-copper">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  if (value === false) {
    return <span className="text-navy/25">—</span>;
  }
  return <span className="text-sm text-navy/70">{value}</span>;
}

/**
 * The LIFE Assessment funnel's value-stack table — LIFE Assessment ($797
 * one-time) vs. Founding Subscriber ($249/mo x6, then $499/mo) vs. the
 * standard Public Rate starting October 2026. Built 2026-07-17 so the
 * funnel makes explicit, side by side, why registering as a Founding
 * Subscriber before go-live is a materially better deal than waiting.
 * Used on both the homepage's Founding Subscriber Program section and
 * the new /assessment entry page.
 */
export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[1.4fr_1fr_1fr_1fr] gap-px overflow-hidden rounded-2xl border border-navy/10 bg-navy/10">
        {/* Header row */}
        <div className="bg-cream p-5" />
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`p-5 text-center ${
              tier.highlighted ? "bg-navy text-cream" : "bg-cream text-navy"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                tier.highlighted ? "text-copper" : "text-navy/50"
              }`}
            >
              {tier.eyebrow}
            </p>
            <p className="mt-2 text-lg font-semibold">{tier.name}</p>
            <p className="mt-2 font-serif text-3xl">{tier.price}</p>
            <p className={`mt-1 text-xs ${tier.highlighted ? "text-cream/60" : "text-navy/50"}`}>
              {tier.priceDetail}
            </p>
          </div>
        ))}

        {/* Feature rows */}
        {FEATURES.map((row, i) =>
          isDivider(row) ? (
            <div
              key={row.divider}
              className="col-span-4 bg-navy/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy/50"
            >
              {row.divider}
            </div>
          ) : (
            <Fragment key={row.label}>
              <div
                className={`flex items-center p-4 text-sm text-navy ${
                  i % 2 === 0 ? "bg-cream/60" : "bg-cream"
                }`}
              >
                {row.label}
              </div>
              {row.values.map((value, colIndex) => (
                <div
                  key={`${row.label}-${colIndex}`}
                  className={`flex items-center justify-center p-4 ${
                    i % 2 === 0 ? "bg-cream/60" : "bg-cream"
                  } ${TIERS[colIndex].highlighted ? "bg-navy/[0.03]" : ""}`}
                >
                  <Cell value={value} />
                </div>
              ))}
            </Fragment>
          )
        )}
      </div>
    </div>
  );
}
