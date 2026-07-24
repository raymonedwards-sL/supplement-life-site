-- Supplement :: LIFE — persistent "Talk with Sage" chat history
-- (SAGE_Return_Greeting_and_Chat_History_Spec.md, 2026-07-24).
--
-- Until now, no raw chat transcript was ever persisted — intake_responses
-- stores Sage's own DISTILLED structured facts (age, sleep_quality, etc.),
-- not what was actually said turn by turn. IntakeChat.tsx held `messages`
-- only in React state, so leaving the page lost the visible thread even
-- though the underlying facts were safe.
--
-- conversation_id here is deliberately NOT a lifetime-of-the-subscriber
-- thread — it stays exactly what it already means everywhere else in this
-- schema (0015_assessment_scoring_engine.sql): one intake "sitting". Once
-- a sitting completes (a track_assignments row exists for its
-- conversation_id), the app starts a fresh conversation_id on the next
-- visit rather than resuming this table's rows into it — mixing an old,
-- already-scored sitting's transcript into a new one would have no effect
-- on scoring (the engine only ever reads intake_responses.structured_value,
-- never this table) but would misrepresent a retake as a continuation of
-- an already-completed assessment. The app layer (see
-- app/api/intake/chat/history/route.ts) only ever offers to resume a
-- conversation_id that has rows here and NO track_assignments row yet.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS / DROP POLICY IF EXISTS.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- True only for the first assistant message of a brand-new conversation
  -- — i.e. Sage's opening/return greeting. Lets the return-greeting
  -- variation logic (lib/claude/greetingContext.ts) fetch "the last few
  -- greetings already used for this subscriber" with a plain indexed
  -- lookup instead of a per-conversation window function.
  is_opening_greeting boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.chat_messages is
  'Raw "Talk with Sage" chat transcript, persisted turn by turn — distinct from intake_responses, which stores Sage''s distilled structured facts, not the conversation itself. conversation_id scopes one intake sitting, same meaning as intake_responses.conversation_id / track_assignments.conversation_id.';
comment on column public.chat_messages.is_opening_greeting is
  'True only for the first assistant message of a new conversation (Sage''s return greeting) — see lib/claude/greetingContext.ts.';

create index if not exists chat_messages_user_conversation_idx
  on public.chat_messages (user_id, conversation_id, created_at);

-- Fast "last N greetings sent to this subscriber" lookup
-- (app/api/intake/chat/route.ts) — filters on user_id + the boolean flag,
-- ordered by recency.
create index if not exists chat_messages_user_greeting_idx
  on public.chat_messages (user_id, created_at desc)
  where is_opening_greeting;

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);
