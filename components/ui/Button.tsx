import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

// The primary CTA (hunter-green pill) is dark enough to nearly disappear
// against the dark navy nav bar, so it gets a light "ivory" ring — same
// shape as the pill, sitting just behind it — to keep it eye-catching on
// both dark and light backgrounds. Ring color is the existing --color-ivory
// brand token, not a new ad hoc hex.
const variants: Record<Variant, string> = {
  primary:
    "bg-copper text-cream shadow-[0_0_0_5px_var(--color-ivory)] transition-shadow hover:bg-copper/90 hover:shadow-[0_0_0_7px_var(--color-ivory)]",
  secondary: "border border-navy/20 text-navy hover:bg-navy/5",
  ghost: "text-copper hover:text-copper/80",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: CommonProps & { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
