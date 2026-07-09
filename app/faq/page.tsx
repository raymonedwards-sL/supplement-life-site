import { Container, Eyebrow } from "@/components/ui/Container";
import FaqAccordion from "@/components/FaqAccordion";

const faqs = [
  {
    q: "What is Supplement :: LIFE?",
    a: "Supplement :: LIFE is a personalized supplement program from Your Life Protocol. Instead of picking products off a shelf, you complete a short guided intake and get matched to a Botanical Track — the foundation of your Personalized LIFE Protocol, built around a specific wellness need using time-tested herbal and mineral ingredients.",
  },
  {
    q: "Is the intake conversation medical advice?",
    a: "No. The intake is a conversational way to share what's going on with your energy, sleep, stress, and goals, and it produces personalized wellness information — not medical advice, a diagnosis, or a treatment plan. It's not a substitute for talking to a doctor, and it isn't reviewed by one in real time.",
  },
  {
    q: "What does the $249 Founding Subscription deposit cover?",
    a: "The $249 deposit reserves your spot for first access and creates your account. It's fully credited toward your first Protocol Subscription payment once Supplement :: LIFE goes live — it isn't an extra charge on top of your subscription.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes. Your Founding Subscription deposit is fully refundable per the Founding Subscriber Program terms. If you change your mind before conversion, reach out and we'll process it.",
  },
  {
    q: "When will I get my first shipment?",
    a: "We're finalizing production timelines. Founding Subscribers get priority — you'll get an email as soon as your personalized protocol is ready to ship, and you can complete your intake any time before then.",
  },
  {
    q: "Can I change my Botanical Track later?",
    a: "Yes. Your dashboard keeps a running wellness profile, and you can revisit your intake as your needs change. A Botanical Track match isn't a one-time quiz result — it's meant to move with you.",
  },
  {
    q: "Is it safe to take with my current medication?",
    a: "It depends on the ingredient and the medication. Some Botanical Track ingredients carry specific cautions — for example, callaloo is high in Vitamin K and isn't recommended alongside blood-thinning medication — and the intake is built to flag combinations like that. Even so, always check with your healthcare provider before starting a new supplement, especially if you're on prescription medication, pregnant, or nursing.",
  },
  {
    q: "What's actually in a Botanical Track?",
    a: "Traditional herbal and mineral ingredients, chosen for a specific role — things like sea moss, ashwagandha, elderberry, chamomile, or bacopa monnieri. Every ingredient in your protocol is listed in plain language, with the reason it's there, not hidden behind a proprietary blend.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Once your subscription is active, you can manage or cancel it any time from your dashboard's billing portal — no phone calls required.",
  },
  {
    q: "How do I reach support?",
    a: "Email hello@yourlifeprotocol.com and we'll get back to you. If you've already reserved, log in on the Protocol Dashboard for the fastest way to manage your account.",
  },
];

export default function FAQ() {
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-navy/70">
          Everything about the intake, billing, and what&apos;s actually in
          your protocol.
        </p>

        <div className="mt-10">
          <FaqAccordion faqs={faqs} />
        </div>

        <p className="mt-10 text-sm text-navy/50">
          Still have a question?{" "}
          <a
            href="mailto:hello@yourlifeprotocol.com"
            className="font-semibold text-copper hover:text-copper/80"
          >
            Email us
          </a>
          .
        </p>
      </Container>
    </section>
  );
}
