export default function Reserve() {
  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Reserve Yours
      </h1>
      <p className="mt-4 text-navy/70">
        Placeholder text about pre-ordering &mdash; pricing, launch timing, and
        what reserving now includes will go here.
      </p>
      <form className="mt-10 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-navy" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Jane Doe"
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="jane@example.com"
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90"
        >
          Reserve Now
        </button>
        <p className="text-xs text-navy/40">
          Placeholder disclaimer text &mdash; this form is not yet connected.
        </p>
      </form>
    </section>
  );
}
