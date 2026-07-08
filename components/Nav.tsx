"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";

const links = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-navy text-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-serif text-lg font-semibold tracking-tight"
          onClick={() => setOpen(false)}
        >
          Your Life Protocol
        </Link>

        <nav className="hidden items-center gap-x-8 text-sm sm:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-copper ${
                  active ? "text-copper" : "text-cream/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <LinkButton href="/reserve" size="md" className="!px-5 !py-2">
            Reserve Yours
          </LinkButton>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 sm:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className={`absolute left-0 top-0 block h-px w-4 bg-cream transition-transform ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-px w-4 -translate-y-1/2 bg-cream transition-opacity ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 block h-px w-4 bg-cream transition-transform ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-cream/10 px-6 py-4 text-sm sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 transition-colors hover:bg-cream/5 hover:text-copper ${
                pathname === link.href ? "text-copper" : "text-cream/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/reserve"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-copper px-5 py-2.5 text-center font-semibold text-cream"
          >
            Reserve Yours
          </Link>
        </nav>
      )}
    </header>
  );
}
