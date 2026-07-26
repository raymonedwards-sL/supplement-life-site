-- Supplement :: LIFE — Weekly Check-In Loop
-- (docs/SAGE_Weekly_CheckIn_Loop_Gap2.md, 2026-07-25).
--
-- The /assessment landing page claims Sage "learns from how you respond
-- over time" and "keeps refining both the guidance and the formula" — an
-- ongoing relationship. Until now, components/life-brief/Roadmap.tsx
-- rendered its weeklyCheckIn.questions as static, read-only text: nothing
-- in the app ever accepted, stored, or processed an answer to any of
-- them. This table is the real, honest mechanism that makes the landing
-- claim true — append-only, mirroring intake_responses/chat_messages
-- (0001_init.sql / 0018_intake_chat_messages.sql), since a check-in
-- history is inherently a log, not a current-state snapshot the way
-- profiles.current_summary is.
--
-- priority_marker distinguishes the one dynamic, per-subscriber question
-- (RoadmapProps.weeklyCheckIn.priorityMarkerQuestion, tied to their top
-- opportunity domain) from the 6 fixed generic questions plus the
-- free-text "any side effects to flag?" field — useful later if the
-- priority-marker trend specifically needs to be queried across weeks.
--
-- last_check_in_at enforces the "weekly" cadence server-side (see
-- app/api/dashboard/check-in/route.ts) — an unenforced cadence would make
-- the week-over-week trend data (and the landing page's claim) meaningless.
-- last_check_in_note is Sage's own short, compliant acknowledgment of the
-- week's trend (a narrow Claude call, mirroring buildContradictionOnly-
-- SystemPrompt's minimal single-purpose style in lib/claude/intake.ts) —
-- read back by lib/life-brief/adapter.ts's buildDailyRhythmProps onto the
-- Daily LIFE Rhythm timeline's "wake" block, closing the loop the spec
-- flagged: RhythmBlock.sageCheckIn already existed as a rendered field in
-- DailyRhythm.tsx and lib/pdf/life-brief.ts but was never populated by
-- any real code path.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS / DROP POLICY IF EXISTS.

create table if not exists public.check_in_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  question text not null,
  answer text not null,
  priority_marker boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.check_in_responses is
  'Weekly check-in Q&A, persisted turn by turn — append-only log, not a rolled-up current-state snapshot. See docs/SAGE_Weekly_CheckIn_Loop_Gap2.md.';
comment on column public.check_in_responses.priority_marker is
  'True only for the one dynamic, per-subscriber priority question (RoadmapProps.weeklyCheckIn.priorityMarkerQuestion) — false for the 6 fixed generic questions and the free-text side-effects field.';

create index if not exists check_in_responses_user_idx
  on public.check_in_responses (user_id, created_at desc);

alter table public.check_in_responses enable row level security;

drop policy if exists "check_in_responses_select_own" on public.check_in_responses;
create policy "check_in_responses_select_own" on public.check_in_responses
  for select using (auth.uid() = user_id);

drop policy if exists "check_in_responses_insert_own" on public.check_in_responses;
create policy "check_in_responses_insert_own" on public.check_in_responses
  for insert with check (auth.uid() = user_id);

alter table public.profiles
  add column if not exists last_check_in_at timestamptz,
  add column if not exists last_check_in_note text;

comment on column public.profiles.last_check_in_at is
  'Timestamp of the subscriber''s most recent weekly check-in submission — enforces the 7-day cadence server-side (app/api/dashboard/check-in/route.ts) and gates whether /dashboard/brief shows the check-in form or a "next check-in available" state.';
comment on column public.profiles.last_check_in_note is
  'Sage''s short, compliant acknowledgment of the most recent weekly check-in''s trend — general wellness education framing only, refreshed on every check-in submission. Surfaced on the Daily LIFE Rhythm timeline''s "wake" block via RhythmBlock.sageCheckIn (lib/life-brief/adapter.ts).';
