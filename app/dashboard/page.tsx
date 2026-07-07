const cards = [
  { label: "Current Protocol", value: "Placeholder" },
  { label: "Days Active", value: "0" },
  { label: "Next Shipment", value: "Placeholder" },
];

export default function Dashboard() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Dashboard
      </h1>
      <p className="mt-4 text-navy/70">
        Placeholder text &mdash; this is where signed-in users will track their
        protocol, orders, and progress.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-navy/10 bg-white/40 p-6"
          >
            <p className="text-sm font-medium text-navy/50">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-copper">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
