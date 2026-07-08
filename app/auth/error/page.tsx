import { LinkButton } from "@/components/ui/Button";

export default function AuthError() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Link expired
      </h1>
      <p className="text-navy/70">
        That login link is no longer valid — it may have already been used
        or expired. Head to the dashboard to request a fresh one, or reach
        out if you need help.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <LinkButton href="/dashboard">Try logging in again</LinkButton>
        <LinkButton href="/faq" variant="secondary">
          Get help
        </LinkButton>
      </div>
    </section>
  );
}
