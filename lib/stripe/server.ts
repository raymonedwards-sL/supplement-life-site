import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

/**
 * Server-only Stripe client. Never import this from a Client Component —
 * the secret key must stay on the server.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

/** The one-time Founding Reservation deposit amount, in cents. */
export const FOUNDING_RESERVATION_DEPOSIT_CENTS = 24900;

/**
 * The one-time LIFE Assessment price, in cents — a separate, cheaper
 * product from the Founding Reservation deposit above. Paying this
 * unlocks Sage's guided intake and generates the subscriber's LIFE
 * Brief; it is NOT credited toward the $249 Founding Subscription,
 * which remains a distinct upsell offered after the Brief is delivered.
 *
 * 2026-07-21: repriced from $99 to $797 per the finalized pricing
 * strategy (expanded scope — fitness, nutrition, fasting, water intake,
 * and personalized supplement kit — and repositioned ICP).
 */
export const LIFE_ASSESSMENT_PRICE_CENTS = 79700;

/**
 * The one-time LIFE Concierge price, in cents — a premium, human-guided
 * add-on (2026-07-21). Includes 3 private 30-minute sessions with a
 * dedicated wellness practitioner plus Sage's own guided intake and
 * ongoing reformulation. Deliberately does NOT include any Botanical
 * Track kits — product only ships as part of the ongoing $249/mo
 * Founding Subscription, so a Concierge-only customer still needs to
 * reserve separately (or already have) a Founding Subscription to
 * actually receive product. Not credited toward that subscription.
 */
export const LIFE_CONCIERGE_PRICE_CENTS = 199500;

/** Number of 1:1 practitioner sessions included in LIFE Concierge. */
export const LIFE_CONCIERGE_PRACTITIONER_SESSIONS = 3;
