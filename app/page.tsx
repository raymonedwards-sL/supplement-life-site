export default function Home() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full bg-copper/10 px-4 py-1 text-sm font-medium text-copper">
        Coming Soon
      </span>
      <h1 className="text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
        Your Life Protocol
      </h1>
      <p className="max-w-xl text-lg text-navy/70">
        Placeholder headline copy goes here. This is where we&apos;ll introduce
        the product and the promise &mdash; personalized supplement protocols
        built around your biology.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <a
          href="/reserve"
          className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90"
        >
          Reserve Yours
        </a>
        <a
          href="/how-it-works"
          className="rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
        >
          How It Works
        </a>
      </div>
      <p className="pt-8 text-sm text-navy/40">
        Placeholder text &mdash; real copy coming soon.
      </p>
    </section>
  );
}
