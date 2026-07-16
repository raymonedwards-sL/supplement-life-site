-- Supplement :: LIFE — extends the Lifestyle Inputs schema (spec Section
-- 4.2, originally added in 0004_wellness_profile_schema.sql) with the
-- additional signals requested 2026-07-15: water consumption, fasting
-- protocols, and living/working/travel environment. Sleep is already
-- covered by sleep_hours/sleep_quality from 0004 — no new sleep column
-- needed here.
--
-- Same pattern as 0004: these evolve conversationally and get overwritten
-- as the picture updates (not append-only like safety_flags). No RLS
-- changes needed — profiles' existing select/insert/update-own policies
-- already cover new columns (RLS is row-level, not column-level).
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.profiles
  add column if not exists water_intake text,
  add column if not exists fasting_pattern text,
  add column if not exists living_environment text,
  add column if not exists work_environment text,
  add column if not exists travel_frequency text;

comment on column public.profiles.water_intake is
  'Subscriber-reported hydration pattern, e.g. "6-8 glasses/day", "rarely tracks". Free text, not a numeric column, since Sage gathers this conversationally rather than as a precise measurement.';
comment on column public.profiles.fasting_pattern is
  'Subscriber-reported fasting protocol, e.g. "16:8 intermittent fasting", "none". Combines with diet_pattern (0004) for a fuller nutrition picture.';
comment on column public.profiles.living_environment is
  'Subscriber-reported living environment, e.g. "urban", "suburban", "rural".';
comment on column public.profiles.work_environment is
  'Subscriber-reported work environment/setting, e.g. "remote", "hybrid", "in-office", "frequent travel" — distinct from living_environment since the two can differ (e.g. suburban home, heavy business travel).';
comment on column public.profiles.travel_frequency is
  'Subscriber-reported travel frequency/pattern, e.g. "frequent flyer", "rarely travels" — feeds environmental-exposure and circadian-disruption reasoning alongside sleep/stress inputs.';
