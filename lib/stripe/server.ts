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
