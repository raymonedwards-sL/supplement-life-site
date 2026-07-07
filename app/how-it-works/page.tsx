const steps = [
  {
    title: "Step 1: Tell us about you",
    body: "Placeholder text describing the intake process and what information we collect.",
  },
  {
    title: "Step 2: Get your protocol",
    body: "Placeholder text describing how we turn intake answers into a personalized protocol.",
  },
  {
    title: "Step 3: Track your progress",
    body: "Placeholder text describing the dashboard and ongoing adjustments.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        How It Works
      </h1>
      <p className="mt-4 text-navy/70">
        Placeholder intro copy explaining the overall process.
      </p>
      <div className="mt-10 flex flex-col gap-8">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-navy/10 bg-white/40 p-6">
            <h2 className="text-xl font-semibold text-copper">{step.title}</h2>
            <p className="mt-2 text-navy/70">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
