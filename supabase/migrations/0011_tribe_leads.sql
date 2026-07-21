-- Free "Join the LIFE Tribe" opt-in qualifying data (2026-07-20).
--
-- app/join now asks one tap-to-select qualifying question before email
-- capture (inspired by a reference funnel the user shared — a video +
-- conversational one-question intake ahead of a lead-gen form). This
-- table is the durable, always-available capture for that answer.
--
-- Deliberately NOT keyed to auth.users — free opt-ins never create an
-- account (see app/join/page.tsx and app/api/join-tribe/route.ts), so
-- there is no user_id to reference. This is pre-account lead data, closer
-- in spirit to life_assessment_purchases than to profiles.
--
-- The qualifying answer is ALSO sent to beehiiv as a custom_field (see
-- lib/beehiiv.ts's new customFields option) so it can drive segmented
-- email content there directly — but beehiiv silently discards any
-- custom_fields value whose field name hasn't been created in the
-- beehiiv dashboard first (Settings > Custom Fields), so this table is
-- the one guaranteed record of every answer regardless of whether that
-- one-time beehiiv setup step has been done yet.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

create table if not exists public.tribe_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  challenge text,
  created_at timestamptz not null default now()
);

comment on table public.tribe_leads is
  'Free "Join the LIFE Tribe" opt-in submissions from app/join — email plus the tap-to-select qualifying answer. Pre-account lead data, not linked to auth.users. Insert-only via the service role from app/api/join-tribe/route.ts; no public read/write policy.';
comment on column public.tribe_leads.challenge is
  'Which of the fixed qualifying options (see app/join/page.tsx) the visitor tapped, e.g. "Energy that crashes by mid-afternoon". Free text column rather than an enum so new options can be added on the frontend without a migration.';

create index if not exists tribe_leads_email_idx on public.tribe_leads (email);
create index if not exists tribe_leads_created_at_idx on public.tribe_leads (created_at desc);

alter table public.tribe_leads enable row level security;

-- No select/insert/update/delete policy for anon or authenticated roles —
-- this is lead data, not something any visitor should be able to read
-- back, and the only writer is app/api/join-tribe/route.ts using the
-- service-role client (createAdminClient()), which bypasses RLS entirely.
-- Same locked-down pattern as safety_flags.
