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
