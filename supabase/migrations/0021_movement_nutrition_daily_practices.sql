-- Supplement :: LIFE — Movement & Nutrition Daily Practices (2026-07-25):
-- extends 0009_daily_practices.sql's pattern to the two remaining gaps
-- found in the LIFE Brief audit against the /assessment landing page's
-- "how you eat, move, sleep, fast, hydrate, and recover" claim. Hydration
-- and fasting already got a real Sage-synthesized recommendation; eat
-- (nutrition) and move (movement) did not — exercise_pattern/diet_pattern
-- were collected during intake (0004) and used narratively (Wellness
-- Profile Summary, track rationale), but never turned into a personalized
-- daily-practice recommendation the way water_intake/fasting were, so the
-- Daily Rhythm report's Movement Window block rendered identical generic
-- text for every subscriber.
--
-- Same "overwritten as the picture updates" pattern as 0009 — DERIVED
-- GUIDANCE, distinct from the self-reported exercise_pattern/diet_pattern
-- columns (0004), which store what the subscriber actually said.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.profiles
  add column if not exists movement_recommendation text,
  add column if not exists nutrition_recommendation text;

comment on column public.profiles.movement_recommendation is
  'Sage-generated personalized movement guidance, synthesized from the subscriber''s self-reported exercise_pattern plus their broader lifestyle profile (environment, stress, energy/recovery signals). General wellness education, not an exercise prescription — refreshed on every intake completion.';
comment on column public.profiles.nutrition_recommendation is
  'Sage-generated personalized nutrition guidance, synthesized from the subscriber''s self-reported diet_pattern plus their broader goals/concerns. General wellness education only — never a restrictive/elimination diet or framed around a specific medical condition. Refreshed on every intake completion.';
