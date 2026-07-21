-- LIFE Concierge (2026-07-21): tracks the new $1,995 one-time "LIFE
-- Concierge" purchase — a premium, human-guided add-on (3 private
-- 30-minute practitioner sessions + Sage's own intake/reformulation),
-- which is a DIFFERENT product from both the $249 Founding Subscription
-- deposit (`subscriptions`) and the $797 LIFE Assessment
-- (`life_assessment_purchases`).
--
-- Deliberately a separate table, mirroring 0010_life_assessment_purchases
-- exactly — a customer can have any combination of a subscriptions row, a
-- life_assessment_purchases row, and a life_concierge_purchases row. No
-- customer-balance credit applies here — LIFE Concierge does NOT include
-- any Botanical Track kits (those only ship as part of the ongoing
-- Founding Subscription), so there is nothing to credit toward it.
create table if not exists public.life_concierge_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_checkout_session_id text,
  amount_paid_cents integer not null,
  purchased_at timestamptz not null default now()
);

create index if not exists life_concierge_purchases_user_id_idx
  on public.life_concierge_purchases (user_id);

alter table public.life_concierge_purchases enable row level security;

-- Subscribers can read their own purchase record (e.g. to show "you
-- already enrolled in LIFE Concierge" state). Only the service role
-- (webhook) ever inserts — no public insert/update policy.
--
-- drop-if-exists first since `create policy` has no `if not exists`
-- guard (unlike the table/index above) — makes this file safe to
-- re-run, e.g. if it's ever applied twice by mistake.
drop policy if exists "Users can view their own LIFE Concierge purchase"
  on public.life_concierge_purchases;

create policy "Users can view their own LIFE Concierge purchase"
  on public.life_concierge_purchases
  for select
  using (auth.uid() = user_id);
