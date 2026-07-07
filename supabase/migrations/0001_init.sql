-- Supplement :: LIFE — Wellness Intelligence Portal
-- Initial schema, matching the data model in the Wellness Intelligence
-- Portal PRD (Section 8) and Founding Reservation Program terms.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New
-- query → paste → Run). Safe to re-run: guarded with IF NOT EXISTS /
-- DROP POLICY IF EXISTS where practical.

-- ---------------------------------------------------------------------
-- 1. users
-- Extends Supabase's built-in auth.users with the portal-specific field
-- (reservation_id) called for in the PRD. 1:1 with auth.users.
-- ---------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  reservation_id text unique,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Portal user, linked 1:1 to a Founding Reservation record.';

-- Auto-create a public.users row whenever someone signs up via Supabase
-- Auth, so the app never has to remember to do it manually. reservation_id
-- can be passed in at signup via options.data.reservation_id, or backfilled
-- later by the Stripe webhook (service role bypasses RLS).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, reservation_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'reservation_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. intake_responses
-- One row per Q&A exchange during the conversational intake. Append-only
-- and versioned/timestamped — never overwritten — so profile changes over
-- time are preserved (PRD Section 8).
-- ---------------------------------------------------------------------
create table if not exists public.intake_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category text not null check (category in ('demographics', 'lifestyle', 'concerns', 'goals')),
  question text not null,
  answer text,
  structured_value jsonb,
  submitted_at timestamptz not null default now()
);

comment on table public.intake_responses is 'Versioned Q&A pairs from the conversational wellness intake.';
create index if not exists intake_responses_user_id_idx on public.intake_responses (user_id);

-- ---------------------------------------------------------------------
-- 3. profiles
-- Derived/rolled-up summary built from the latest intake_responses.
-- Shown on the dashboard; user can view/edit per FR-8.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  current_summary text,
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Latest rolled-up Wellness Profile Summary for a user.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. track_assignments
-- Track recommendation history. History is preserved (never overwritten)
-- to support Phase 2 re-scoring (PRD Section 8).
-- ---------------------------------------------------------------------
create table if not exists public.track_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  tracks text[] not null,
  rationale text,
  assigned_at timestamptz not null default now()
);

comment on table public.track_assignments is 'Recommended track(s) + rationale, one row per assignment event.';
create index if not exists track_assignments_user_id_idx on public.track_assignments (user_id);

-- ---------------------------------------------------------------------
-- 5. subscriptions
-- Mirrors the Stripe subscription object. conversion_date drives the
-- 14-day pre-conversion notice job (PRD Section 5.5, FR-6/FR-7).
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  stripe_customer_id text,
  status text not null default 'pending'
    check (status in ('pending', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  conversion_date timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.subscriptions is 'Mirrors Stripe subscription state; pending until the deposit converts.';

-- ---------------------------------------------------------------------
-- 6. notification_log
-- Compliance record for the 14-day pre-conversion notice and any other
-- automated notifications (PRD Section 9, FR-6).
-- ---------------------------------------------------------------------
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  sent_at timestamptz not null default now()
);

comment on table public.notification_log is 'Compliance record of automated notifications sent to a user.';
create index if not exists notification_log_user_id_idx on public.notification_log (user_id);

-- ---------------------------------------------------------------------
-- Row Level Security — every user can only see/write their own data.
-- Server-side jobs (Stripe webhook, 14-day notice cron) should use the
-- service role key, which bypasses RLS entirely — no policy needed for
-- those. Client-facing access stays scoped to auth.uid().
-- ---------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.intake_responses enable row level security;
alter table public.profiles enable row level security;
alter table public.track_assignments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_log enable row level security;

-- users: read/update own row only
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- intake_responses: read + insert own rows (append-only — no update/delete)
drop policy if exists "intake_responses_select_own" on public.intake_responses;
create policy "intake_responses_select_own" on public.intake_responses
  for select using (auth.uid() = user_id);

drop policy if exists "intake_responses_insert_own" on public.intake_responses;
create policy "intake_responses_insert_own" on public.intake_responses
  for insert with check (auth.uid() = user_id);

-- profiles: read + edit own (FR-8: user can view and edit profile answers)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- track_assignments: read + insert own (system-generated at intake
-- completion; history preserved, so no update/delete)
drop policy if exists "track_assignments_select_own" on public.track_assignments;
create policy "track_assignments_select_own" on public.track_assignments
  for select using (auth.uid() = user_id);

drop policy if exists "track_assignments_insert_own" on public.track_assignments;
create policy "track_assignments_insert_own" on public.track_assignments
  for insert with check (auth.uid() = user_id);

-- subscriptions: read-only for the client. Written by the Stripe webhook
-- via the service role key (added in Step 5), which bypasses RLS.
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- notification_log: read-only for the client. Written by the scheduled
-- 14-day-notice job via the service role key, which bypasses RLS.
drop policy if exists "notification_log_select_own" on public.notification_log;
create policy "notification_log_select_own" on public.notification_log
  for select using (auth.uid() = user_id);
