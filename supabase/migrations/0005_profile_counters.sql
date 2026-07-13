-- Supplement :: LIFE — Sage Knowledge Architecture: atomic profile
-- counters (Stage 3 of Sage_Knowledge_Architecture_Spec.docx).
--
-- Curiosity-signal and conversation counts (spec Section 4.3) get
-- incremented from the intake chat route on relevant turns. A plain
-- read-then-write from application code would race across concurrent or
-- rapid turns within one conversation; these two functions do an atomic
-- insert-or-increment in a single statement instead. Both run with the
-- CALLER's privileges (not security definer), so the existing profiles
-- RLS policies (insert-own/update-own, auth.uid() = user_id) still
-- apply — a subscriber can only ever increment their own counters, even
-- via this RPC path.
--
-- Run this once in the Supabase SQL Editor, after 0004.

create or replace function public.increment_curiosity_signal(p_user_id uuid)
returns void
language sql
as $$
  insert into public.profiles (user_id, curiosity_signal_count, last_curiosity_signal_at)
  values (p_user_id, 1, now())
  on conflict (user_id) do update
    set curiosity_signal_count = public.profiles.curiosity_signal_count + 1,
        last_curiosity_signal_at = now();
$$;

create or replace function public.increment_conversation_count(p_user_id uuid)
returns void
language sql
as $$
  insert into public.profiles (user_id, conversation_count, last_conversation_at)
  values (p_user_id, 1, now())
  on conflict (user_id) do update
    set conversation_count = public.profiles.conversation_count + 1,
        last_conversation_at = now();
$$;

comment on function public.increment_curiosity_signal(uuid) is
  'Atomically increments profiles.curiosity_signal_count and updates last_curiosity_signal_at. Runs as invoker so existing profiles RLS still applies.';
comment on function public.increment_conversation_count(uuid) is
  'Atomically increments profiles.conversation_count and updates last_conversation_at. Runs as invoker so existing profiles RLS still applies.';

grant execute on function public.increment_curiosity_signal(uuid) to authenticated;
grant execute on function public.increment_conversation_count(uuid) to authenticated;
