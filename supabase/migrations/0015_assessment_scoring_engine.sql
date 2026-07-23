-- Supplement :: LIFE — Phase 2 Assessment & Scoring engine (lib/scoring/,
-- ported from SAGE_LIFE_Phase2_Assessment_Scoring.docx /
-- sage_scoring_engine.py). Sage's free-form conversation stays the intake
-- UX, but track selection is no longer the LLM's own judgment call — it's
-- now decided by the deterministic engine, computed from structured
-- answers logged during one sitting. Two schema needs follow from that:
--
--   1. intake_responses needs a way to scope "this conversation's answers"
--      — the table is append-only across every conversation a subscriber
--      ever has, so without a session boundary the engine couldn't tell a
--      first-time intake's structured answers apart from an unrelated
--      check-in six months later.
--   2. track_assignments needs to record what the engine actually
--      computed (domain scores, Safety Gate results, Track-Fit scores,
--      Confidence Score, contradiction flags) — not just the final track
--      list — so a recommendation is auditable/explainable after the
--      fact, and so re-scoring against recalibrated weights later
--      (Phase 4 pilot data) has something to compare against.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

-- ---------------------------------------------------------------------
-- 1. intake_responses.conversation_id
-- App-supplied (app/api/intake/chat/route.ts generates one per browser
-- session and the client echoes it back every turn — see IntakeChat.tsx).
-- Defaults to a fresh random value per row so every pre-existing row
-- effectively becomes its own single-row "conversation" — those rows
-- predate this concept entirely and were never going to be re-scored by
-- the engine anyway, so this default just keeps the column NOT NULL
-- without a backfill migration.
-- ---------------------------------------------------------------------
alter table public.intake_responses
  add column if not exists conversation_id uuid not null default gen_random_uuid();

comment on column public.intake_responses.conversation_id is
  'Scopes Q&A rows to one sitting so the scoring engine (lib/scoring/) can read back exactly this conversation''s structured answers, not a subscriber''s entire history. Generated server-side per session, echoed by the client on every turn.';

create index if not exists intake_responses_user_conversation_idx
  on public.intake_responses (user_id, conversation_id);

-- ---------------------------------------------------------------------
-- 2. track_assignments — record of what the engine computed
-- Additive columns only; existing tracks/rationale columns are unchanged
-- and still what the UI/PDF/email read. These new columns are the audit
-- trail behind that recommendation.
-- ---------------------------------------------------------------------
alter table public.track_assignments
  add column if not exists conversation_id uuid,
  add column if not exists domain_scores jsonb,
  add column if not exists safety_gate jsonb,
  add column if not exists track_fit_scores jsonb,
  add column if not exists confidence_score numeric,
  add column if not exists contradiction_flags jsonb;

comment on column public.track_assignments.conversation_id is
  'The intake_responses.conversation_id this assignment was computed from.';
comment on column public.track_assignments.domain_scores is
  'Array of EngineDomainResult (lib/scoring/engine.ts) — per-domain Opportunity Score (P2-3) at assignment time.';
comment on column public.track_assignments.safety_gate is
  'Record of SafetyGateResult per track id (lib/scoring/safety-gate.ts, P1-4) at assignment time — which tracks were eligible/excluded and why.';
comment on column public.track_assignments.track_fit_scores is
  'Array of EngineTrackResult (lib/scoring/engine.ts) — Track-Fit Score (P2-4) and its inputs for every safety-gate-eligible track, not just the ones recommended.';
comment on column public.track_assignments.confidence_score is
  'Confidence / Data-Quality Score (P2-5) at assignment time — completeness minus straightlining/contradiction penalties.';
comment on column public.track_assignments.contradiction_flags is
  'Array of ContradictionFlag (lib/scoring/contradictions.ts, P2-6) raised for this assignment, if any.';

-- No RLS changes needed — both tables' existing select/insert-own
-- policies already cover these new columns (RLS is row-level, not
-- column-level), same note as 0004/0014's additive-column migrations.
