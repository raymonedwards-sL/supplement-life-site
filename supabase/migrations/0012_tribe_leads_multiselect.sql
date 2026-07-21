-- Multi-select pain points (2026-07-20, same day as 0011) — user asked to
-- let /join visitors choose multiple pain points instead of one tap
-- selection ("if they face a cacophony of issues, I want to capture
-- that"). Replaces the single `challenge text` column with `challenges
-- text[]` so one submission can hold more than one selected pain point.
--
-- Safe to run regardless of whether 0011 has already been applied: drops
-- `challenge` if it exists, adds `challenges` if it doesn't. This
-- migration only ALTERs the existing table — if 0011 hasn't been run
-- yet, run it first (it's what creates public.tribe_leads).
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.

alter table public.tribe_leads drop column if exists challenge;
alter table public.tribe_leads add column if not exists challenges text[];

comment on column public.tribe_leads.challenges is
  'Every pain point tapped in app/join''s qualifying step (see lib/pain-points.ts) for this submission, not just one — a visitor can select as many as apply. Null/empty if they used "Skip".';
