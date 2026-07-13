-- Supplement :: LIFE — Sage Knowledge Architecture: Subscriber Wellness
-- Profile schema (Stage 2 of Sage_Knowledge_Architecture_Spec.docx,
-- Section 4). Implements the four field groups from that section:
--
--   4.1 Baseline Safety Profile   -> public.safety_flags (new, below)
--   4.2 Lifestyle Inputs          -> public.profiles (extended, below)
--   4.3 Behavioral & Engagement   -> public.profiles (extended, below)
--   4.4 Stack & Adherence History -> Current Stack + Tenure are already
--                                    derivable from the existing
--                                    public.track_assignments table
--                                    (assigned_at gives tenure) — no new
--                                    storage needed for those two.
--                                    Self-Reported Outcomes is new:
--                                    public.subscriber_feedback, below.
--
-- PRIVACY NOTE (carried over from the spec, Section 4): several fields
-- below are health-adjacent data (medications, allergies, pregnancy/
-- nursing status, disclosed health conditions). Legal/compliance should
-- confirm data retention, consent language, and deletion-on-request
-- handling before this ships to production — this migration implements
-- the data model, not a compliance sign-off. Note this doesn't conflict
-- with a genuine account-deletion request: every table below cascades
-- from public.users (on delete cascade), so deleting a user's account
-- row removes all of this data too. The "append-only, never silently
-- overwritten" design below is about Sage/the app never LOSING a
-- disclosed safety flag during normal operation — a different concern
-- from honoring a legitimate deletion request.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS / DROP POLICY IF EXISTS
-- where practical, matching 0001-0003's convention.

-- ---------------------------------------------------------------------
-- 1. safety_flags
-- Permanent Baseline Safety Profile (spec Section 4.1): medications,
-- allergies, pregnancy/nursing status, and subscriber-volunteered health
-- conditions. Per the spec: "must never be silently dropped or
-- overwritten — only appended to or corrected with an explicit
-- subscriber confirmation."
--
-- Modeled as an APPEND-ONLY EVENT LOG, never updated or deleted by the
-- client — same pattern as public.intake_responses. Each row is an
-- "add" (this flag now applies) or "remove" (subscriber confirmed it no
-- longer applies) event for one value, so a list-type field like
-- medications can grow and shrink over time without ever losing history.
-- A subscriber's CURRENTLY ACTIVE flags = the latest action per
-- (user_id, flag_type, value) — see the active_safety_flags view below,
-- which the app should query instead of this table directly.
-- ---------------------------------------------------------------------
create table if not exists public.safety_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  flag_type text not null
    check (flag_type in ('medication', 'allergy', 'pregnancy_nursing', 'health_condition')),
  value text not null,
  action text not null default 'add' check (action in ('add', 'remove')),
  structured_value jsonb,
  note text,
  confirmed_by_subscriber boolean not null default true,
  recorded_at timestamptz not null default now()
);

comment on table public.safety_flags is
  'Append-only event log of permanent safety-relevant disclosures (medications, allergies, pregnancy/nursing, subscriber-volunteered health conditions). Never updated or deleted by the client — query active_safety_flags for current state.';
create index if not exists safety_flags_user_id_idx on public.safety_flags (user_id);
create index if not exists safety_flags_user_type_idx on public.safety_flags (user_id, flag_type);

-- security_invoker = true (Postgres 15+) makes this view run with the
-- QUERYING user's permissions, not the view owner's — without it, a
-- view silently bypasses the underlying table's RLS policies, which
-- would be a real data-exposure bug on a table this sensitive. Do not
-- remove this option.
drop view if exists public.active_safety_flags;
create view public.active_safety_flags
with (security_invoker = true) as
select user_id, flag_type, value, structured_value, note, recorded_at
from (
  select distinct on (user_id, flag_type, value)
    user_id, flag_type, value, action, structured_value, note, recorded_at
  from public.safety_flags
  order by user_id, flag_type, value, recorded_at desc
) latest
where action = 'add';

comment on view public.active_safety_flags is
  'Currently-active safety flags per subscriber — latest add/remove action per (user_id, flag_type, value), filtered to active (add) entries. Query this, not safety_flags directly.';

alter table public.safety_flags enable row level security;

drop policy if exists "safety_flags_select_own" on public.safety_flags;
create policy "safety_flags_select_own" on public.safety_flags
  for select using (auth.uid() = user_id);

drop policy if exists "safety_flags_insert_own" on public.safety_flags;
create policy "safety_flags_insert_own" on public.safety_flags
  for insert with check (auth.uid() = user_id);

-- Deliberately no update/delete policy for the authenticated role —
-- append-only, matching intake_responses. Corrections are new rows, not
-- edits. (The service role key, if ever needed for an admin correction
-- tool, bypasses RLS entirely and isn't affected by this.)

-- ---------------------------------------------------------------------
-- 2. profiles — extended with Lifestyle Inputs (4.2) and Behavioral &
-- Engagement Signals (4.3). These are NOT permanent safety flags — they
-- evolve conversationally and get overwritten as the picture updates,
-- same as the existing current_summary column. Raw Q&A history stays in
-- intake_responses (already append-only); these columns are the
-- rolled-up current state Sage reads to self-assess Depth Ladder tier.
-- No RLS changes needed — profiles' existing select/insert/update-own
-- policies already cover these new columns (RLS is row-level, not
-- column-level).
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists sleep_hours numeric,
  add column if not exists sleep_quality text,
  add column if not exists stress_load text,
  add column if not exists alcohol_frequency text,
  add column if not exists exercise_pattern text,
  add column if not exists diet_pattern text,
  add column if not exists cycle_life_stage text,
  add column if not exists recurring_complaints jsonb not null default '[]'::jsonb,
  add column if not exists curiosity_signal_count integer not null default 0,
  add column if not exists last_curiosity_signal_at timestamptz,
  add column if not exists conversation_count integer not null default 0,
  add column if not exists last_conversation_at timestamptz;

comment on column public.profiles.cycle_life_stage is
  'Subscriber-volunteered only — never inferred from demographic data alone, per spec Section 4.2.';
comment on column public.profiles.curiosity_signal_count is
  'Count of "why"/mechanism-level questions asked across conversations — feeds Tier 3 unlock per the Depth Ladder (spec Section 5/6.3).';
comment on column public.profiles.recurring_complaints is
  'Frequency-tagged list of complaints volunteered across conversations, e.g. [{"complaint": "fatigue", "count": 3}] — used to detect cross-session cascade patterns (spec Section 3).';

-- ---------------------------------------------------------------------
-- 3. subscriber_feedback
-- Self-Reported Outcomes (spec Section 4.4). Append-only — a record of
-- what the subscriber said at the time, never edited. Per the spec:
-- "Never used to make efficacy claims to other subscribers; used only
-- to personalize this subscriber's ongoing journey" — do not aggregate
-- this table for marketing or efficacy-claim purposes.
-- ---------------------------------------------------------------------
create table if not exists public.subscriber_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  track_id text,
  feedback text not null,
  structured_rating jsonb,
  submitted_at timestamptz not null default now()
);

comment on table public.subscriber_feedback is
  'Self-reported outcomes/feedback, one row per submission. Never used to make efficacy claims to other subscribers — personalization only, per spec Section 4.4.';
create index if not exists subscriber_feedback_user_id_idx on public.subscriber_feedback (user_id);

alter table public.subscriber_feedback enable row level security;

drop policy if exists "subscriber_feedback_select_own" on public.subscriber_feedback;
create policy "subscriber_feedback_select_own" on public.subscriber_feedback
  for select using (auth.uid() = user_id);

drop policy if exists "subscriber_feedback_insert_own" on public.subscriber_feedback;
create policy "subscriber_feedback_insert_own" on public.subscriber_feedback
  for insert with check (auth.uid() = user_id);
