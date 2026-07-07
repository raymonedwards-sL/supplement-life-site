const faqs = [
  {
    q: "Placeholder question one?",
    a: "Placeholder answer text goes here.",
  },
  {
    q: "Placeholder question two?",
    a: "Placeholder answer text goes here.",
  },
  {
    q: "Placeholder question three?",
    a: "Placeholder answer text goes here.",
  },
];

export default function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Frequently Asked Questions
      </h1>
      <div className="mt-10 flex flex-col divide-y divide-navy/10">
        {faqs.map((item) => (
          <div key={item.q} className="py-6">
            <h2 className="text-lg font-semibold text-navy">{item.q}</h2>
            <p className="mt-2 text-navy/70">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
