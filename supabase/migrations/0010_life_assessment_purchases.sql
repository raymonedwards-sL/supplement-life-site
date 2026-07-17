-- LIFE Assessment Funnel (2026-07-17): tracks the new $89 one-time
-- "LIFE Assessment" purchase, which is a DIFFERENT product from the
-- $249 Founding Subscription deposit tracked in `subscriptions`.
--
-- Deliberately a separate table rather than a new status/column on
-- `subscriptions` — that table's meaning ("committed to the $249/mo
-- Founding track, pending go-live conversion") stays untouched. A
-- customer can have a life_assessment_purchases row with no
-- subscriptions row at all (assessment-only), or both (they upgraded
-- to Founding Subscriber after seeing their LIFE Brief).
--
-- No customer-balance credit applies here (unlike the $249 deposit) —
-- the $89 is a standalone diagnostic product, not credited toward the
-- future subscription unless a later product decision says otherwise.
create table if not exists public.life_assessment_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  amount_paid_cents integer not null,
  purchased_at timestamptz not null default now()
);

create index if not exists life_assessment_purchases_user_id_idx
  on public.life_assessment_purchases (user_id);

alter table public.life_assessment_purchases enable row level security;

-- Subscribers can read their own purchase record (e.g. to show "you
-- already took the LIFE Assessment" state). Only the service role
-- (webhook) ever inserts — no public insert/update policy.
create policy "Users can view their own LIFE Assessment purchase"
  on public.life_assessment_purchases
  for select
  using (auth.uid() = user_id);
