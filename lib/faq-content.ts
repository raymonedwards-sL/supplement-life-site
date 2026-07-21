/**
 * Shared FAQ content — single source of truth for both the public /faq
 * page (components/FaqAccordion) and the support bot's knowledge base
 * (lib/claude/support.ts). Extracted 2026-07-17 so the two never drift:
 * the support bot should never contradict what the FAQ page itself says.
 *
 * Add a new question here first if it's the kind of thing a subscriber
 * would ask either place — both surfaces pick it up automatically.
 */
export const FAQS = [
  {
    q: "What is Supplement :: LIFE?",
    a: "Supplement :: LIFE is a personalized supplement program from Your Life Protocol. Instead of picking products off a shelf, you complete a short guided intake and get matched to a Botanical Track — the foundation of your Personalized LIFE Protocol, built around a specific wellness need using time-tested herbal and mineral ingredients.",
  },
  {
    q: "Is the intake conversation medical advice?",
    a: "No. The intake is a conversational way to share what's going on with your energy, sleep, stress, and goals, and it produces personalized wellness information — not medical advice, a diagnosis, or a treatment plan. It's not a substitute for talking to a doctor, and it isn't reviewed by one in real time.",
  },
  {
    q: "What is the LIFE Assessment and what does the $797 cover?",
    a: "The LIFE Assessment is a one-time, $797 guided conversation with Sage, Your LIFE Guide, that produces your personal LIFE Brief — your Botanical Track match, the reasoning behind every ingredient, and what your first 90 days is designed to do. It's a separate, standalone product from the Founding Subscription deposit below — it doesn't include ongoing product shipments on its own, and the $797 isn't credited toward the Founding Subscription. You can revisit and retake your intake with Sage any time within 90 days of your LIFE Assessment purchase; continuing to refine your protocol with Sage beyond that window is part of the Founding Subscription.",
  },
  {
    q: "What does the $249 Founding Subscription deposit cover?",
    a: "The $249 deposit reserves your spot for first access and creates your account. It's fully credited toward your Protocol Subscription once Supplement :: LIFE goes live — it isn't an extra charge on top of your subscription.",
  },
  {
    q: "What does the Protocol Subscription cost after I reserve?",
    a: "Supplement :: LIFE will be offered to the public at $499/month starting October 2026. Founding Subscribers who reserve today lock in $249/month for their first six months once billing begins — half the public price — then continue at the standard $499/month rate. All of your Botanical Track supplement kits are included in that price — there's no separate per-track charge.",
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
    a: "Traditional herbal and mineral ingredients, chosen for a specific role — things like sea moss, ashwagandha, elderberry, chamomile, or bacopa monnieri. Every ingredient in your protocol is listed in plain language, with the reason it's there, not hidden behind a proprietary blend. A sample is public on The Ingredient Science page; your own complete formula is in your LIFE Brief.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Once your subscription is active, you can manage or cancel it any time from your dashboard's billing portal — no phone calls required.",
  },
  {
    q: "How do I reach support?",
    a: "Email hello@yourlifeprotocol.com and we'll get back to you. If you've already reserved, log in on the Protocol Dashboard for the fastest way to manage your account.",
  },
] satisfies { q: string; a: string }[];
