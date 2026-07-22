-- Supplement :: LIFE — Sage's daily SMS nudge (2026-07-22): a subscriber
-- opts in from the dashboard (post-signup, not part of any checkout form —
-- lowest-lift place to collect consent) and gets one short daily text
-- pulled from the same water_intake_recommendation/fasting_recommendation
-- guidance already shown on the dashboard and in the LIFE Brief PDF.
--
-- Same "evolving current state, not an append-only log" pattern as
-- current_summary and the Daily Practices columns (0009) — a subscriber
-- can flip this off (or Twilio/us can flip it off on their behalf after a
-- STOP reply) and back on, so this is a plain overwritable column set, not
-- an event log.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists sms_opt_in boolean not null default false,
  add column if not exists sms_consent_at timestamptz;

comment on column public.profiles.phone_number is
  'E.164-formatted phone number, subscriber-entered from the dashboard. Only used to send the daily SMS nudge below — never shared, never used for marketing outreach beyond what sms_opt_in explicitly covers.';
comment on column public.profiles.sms_opt_in is
  'Whether this subscriber has opted in to Sage''s daily SMS nudge (netlify/functions/send-daily-sms.mts). Set true by the subscriber''s own dashboard toggle (with sms_consent_at recorded at the same time); set false either by the subscriber toggling off, or automatically by app/api/webhooks/twilio-sms/route.ts when Twilio reports an inbound STOP reply — defense in depth alongside Twilio''s own carrier-level opt-out enforcement.';
comment on column public.profiles.sms_consent_at is
  'Timestamp of the subscriber''s own opt-in action — kept as a consent record, separate from sms_opt_in itself so a later opt-out doesn''t erase when/whether consent was originally given.';

-- No RLS changes needed — profiles' existing select/insert/update-own
-- policies already cover these new columns (RLS is row-level, not
-- column-level), same note as 0004's Lifestyle Inputs columns.
