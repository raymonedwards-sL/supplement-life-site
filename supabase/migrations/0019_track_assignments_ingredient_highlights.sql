-- Supplement :: LIFE — persist ingredient highlights on track_assignments
-- (SAGE_Intake_Completion_Handoff_Spec.md, 2026-07-24).
--
-- The Phase 2 rationale call (buildRationaleSystemPrompt /
-- INTAKE_RATIONALE_TOOL, lib/claude/intake.ts) produces ingredient_
-- highlights alongside the per-track rationale, but until now it was only
-- ever returned in the one-time completion response — never persisted.
-- That made it impossible to reconstruct a subscriber's just-finished LIFE
-- Brief CTA after a page reload (app/api/intake/chat/history/route.ts):
-- everything else needed (summary, daily practices, tracks, rationale) was
-- already durable, but this one section would silently vanish on refresh.
--
-- Additive column, nullable — existing rows before this migration simply
-- have no highlights to show, which the read path treats as an empty list,
-- not an error.
--
-- Run this once in the Supabase SQL Editor, same as prior migrations.
-- Safe to re-run: guarded with IF NOT EXISTS.

alter table public.track_assignments
  add column if not exists ingredient_highlights jsonb;

comment on column public.track_assignments.ingredient_highlights is
  'Array of {ingredient, role} from the Phase 2 rationale call (INTAKE_RATIONALE_TOOL) — persisted so a reload after intake completion can reconstruct the same LIFE Brief CTA content shown live. Null on rows predating this column.';
