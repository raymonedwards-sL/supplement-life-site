import Link from "next/link";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/how-it-works", label: "How It Works" },
      { href: "/reserve", label: "Founding Subscriber Program" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/our-story", label: "Our Story" },
      { href: "/wellness-after-35", label: "Why Wellness Changes After 35" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/intake", label: "Wellness Intake" },
      { href: "/dashboard", label: "Protocol Dashboard" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-navy/10 bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-lg font-semibold text-navy">
              Your Life Protocol
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-navy/60">
              Supplement :: LIFE builds your Personalized LIFE Protocol
              through a short guided intake, matched to your biology — not
              the shelf.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-sm font-semibold text-navy">{col.heading}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy/60 transition-colors hover:text-copper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-navy/10 pt-6">
          <p className="text-xs leading-relaxed text-navy/50">
            These statements have not been evaluated by the Food and Drug
            Administration. Supplement :: LIFE products are not intended to
            diagnose, treat, cure, or prevent any disease. Individual results
            vary. This site does not provide medical advice — consult your
            healthcare provider before starting any new supplement,
            especially if pregnant, nursing, or taking medication.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-xs text-navy/40 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 LIFE Wellness Brands LLC. All rights reserved.</p>
            <a href="mailto:hello@yourlifeprotocol.com" className="hover:text-copper">
              hello@yourlifeprotocol.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
