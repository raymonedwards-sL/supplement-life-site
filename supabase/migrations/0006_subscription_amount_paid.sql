-- ---------------------------------------------------------------------
-- 0006_subscription_amount_paid
-- Records what was actually charged on the Founding Reservation Deposit
-- checkout, so comped/promo-code reservations (e.g. $0 via a 100%-off
-- Stripe Promotion Code, used to give personal contacts free access in
-- exchange for feedback) are distinguishable from real $249 depositors
-- without having to cross-reference Stripe's dashboard by hand.
--
-- Nullable because existing rows predate this column and were all real
-- $249 deposits — NULL there just means "not recorded," not "unknown
-- whether comped." New rows (see app/api/webhooks/stripe/route.ts) always
-- populate this from the Checkout Session's actual amount_total.
-- ---------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists amount_paid_cents integer;

comment on column public.subscriptions.amount_paid_cents is
  'Actual amount charged on the Founding Reservation Deposit checkout, in cents. 0 means a 100%-off promotion code (e.g. a comped feedback-tester reservation) was used. NULL on rows created before this column existed.';
