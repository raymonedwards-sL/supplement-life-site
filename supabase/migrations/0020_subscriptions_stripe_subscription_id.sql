-- Supplement :: LIFE — track the real Stripe Subscription id
-- (stripe-go-live-runbook.md, 2026-07-24 audit — Blocker 2: the live
-- webhook only listened to checkout.session.completed/charge.refunded,
-- so a failed/changed renewal never reached this app at all).
--
-- public.subscriptions rows are created at deposit time
-- (checkout.session.completed, "founding_reservation_deposit") with only
-- a stripe_customer_id — there is no real Stripe Subscription object yet
-- at that point, since the go-live conversion job that creates one
-- doesn't exist yet (see the TODO in app/api/webhooks/stripe/route.ts).
-- Once that job runs, or once any customer.subscription.* event arrives
-- for another reason, this column lets the webhook handler match the
-- exact subscription rather than assuming a customer has at most one —
-- true today, but stripe_customer_id alone is the wrong key for
-- subscription-specific events going forward.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.subscriptions
  add column if not exists stripe_subscription_id text;

comment on column public.subscriptions.stripe_subscription_id is
  'The real Stripe Subscription id, set once customer.subscription.created fires for this row. Null until the go-live conversion job (not yet built) or an equivalent event creates one.';

create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);
