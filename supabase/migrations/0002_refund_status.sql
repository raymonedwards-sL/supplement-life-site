-- Adds a "refunded" status so the Stripe webhook can flag a subscription
-- when a Founding Reservation deposit is refunded. Portal access is then
-- blocked at the application layer for any subscription in this state
-- (see app/intake/page.tsx, app/dashboard/page.tsx,
-- app/api/intake/chat/route.ts) — the underlying intake/profile/track data
-- is intentionally left in place, not deleted.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New
-- query → paste → Run).

alter table public.subscriptions drop constraint if exists subscriptions_status_check;

alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('pending', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'refunded'));
