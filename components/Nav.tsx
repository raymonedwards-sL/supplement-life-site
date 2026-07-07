import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/reserve", label: "Reserve" },
  { href: "/intake", label: "Intake" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  return (
    <header className="bg-navy text-cream">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Your Life Protocol
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cream/80 transition-colors hover:text-copper"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
