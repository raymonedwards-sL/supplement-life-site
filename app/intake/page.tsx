export default function Intake() {
  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Intake
      </h1>
      <p className="mt-4 text-navy/70">
        Placeholder text introducing the intake questionnaire used to build a
        personalized protocol.
      </p>
      <form className="mt-10 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-navy" htmlFor="goal">
            Placeholder question: primary goal
          </label>
          <input
            id="goal"
            type="text"
            placeholder="e.g. more energy"
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy" htmlFor="age">
            Placeholder question: age
          </label>
          <input
            id="age"
            type="number"
            placeholder="35"
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-navy" htmlFor="notes">
            Placeholder question: anything else?
          </label>
          <textarea
            id="notes"
            rows={4}
            placeholder="Placeholder text"
            className="mt-1 w-full rounded-lg border border-navy/20 bg-white px-4 py-2 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90"
        >
          Submit
        </button>
      </form>
    </section>
  );
}
