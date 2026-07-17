-- Supplement :: LIFE — Daily Practices (2026-07-18): Sage now synthesizes a
-- personalized daily water-intake target and fasting-protocol guidance as
-- part of every intake completion, not just logging what the subscriber
-- reported. Stored on public.profiles as the current, evolving
-- recommendation — same "overwritten as the picture updates" pattern as
-- current_summary and the Lifestyle Inputs columns (0004/0007), not an
-- append-only log.
--
-- These are DERIVED GUIDANCE, distinct from 0007's water_intake/
-- fasting_pattern columns, which store what the subscriber SELF-REPORTED
-- ("6-8 glasses/day", "none"). Keeping them as separate columns rather than
-- overwriting the self-reported ones preserves the raw input Sage reasons
-- from, alongside the recommendation Sage produces from it.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.profiles
  add column if not exists water_intake_recommendation text,
  add column if not exists fasting_recommendation text;

comment on column public.profiles.water_intake_recommendation is
  'Sage-generated personalized daily hydration guidance, synthesized from the subscriber''s self-reported water_intake plus their broader lifestyle profile (activity, travel, climate/environment). General wellness education, not a medical hydration prescription — refreshed on every intake completion.';
comment on column public.profiles.fasting_recommendation is
  'Sage-generated personalized fasting-protocol guidance (e.g. a suggested eating window), synthesized from the subscriber''s self-reported fasting_pattern plus their broader lifestyle profile. General wellness education only — must always carry a healthcare-provider caution and must never be generated for a subscriber with a pregnancy/nursing safety flag on file (see public.active_safety_flags). Refreshed on every intake completion.';
