-- Supplement :: LIFE — allow a 'system' category on intake_responses
-- (2026-07-23), so the server can record its own bookkeeping rows
-- alongside the four subscriber-facing categories (demographics,
-- lifestyle, concerns, goals) without a separate table.
--
-- Immediate use: P2-2's mid-conversation contradiction follow-up
-- (app/api/intake/chat/route.ts). Before injecting a "you contradicted
-- yourself, ask about it" instruction into Sage's system prompt, the
-- server writes a 'system' row marking that contradiction as surfaced for
-- this conversation_id — a deterministic, server-side "ask exactly once"
-- guarantee, instead of relying on Sage noticing her own prior message in
-- the transcript (verified via live testing to be unreliable — Sage
-- re-asked the same clarifying question three turns in a row when the
-- subscriber didn't resolve it the first time).
--
-- Uses a dynamic lookup for the existing check constraint's name rather
-- than assuming Postgres's default auto-generated name
-- (intake_responses_category_check) — safe either way, but this avoids
-- silently leaving a stale, more-restrictive constraint in place if the
-- real name ever differs from that assumption.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run.

do $$
declare
  con_name text;
begin
  select con.conname into con_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'intake_responses'
    and con.contype = 'c'
    and att.attname = 'category';

  if con_name is not null then
    execute format('alter table public.intake_responses drop constraint %I', con_name);
  end if;
end $$;

alter table public.intake_responses
  add constraint intake_responses_category_check
  check (category in ('demographics', 'lifestyle', 'concerns', 'goals', 'system'));

comment on column public.intake_responses.category is
  'demographics/lifestyle/concerns/goals are subscriber-facing Q&A categories. system is server-authored bookkeeping (currently: contradiction-surfaced markers, structured_value = [{"field": "_contradiction_surfaced", "value": "<rule message>"}]) — never shown to the subscriber, never sent to Claude as conversation history.';
