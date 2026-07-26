# Feature Spec: Weekly Check-In Loop (LIFE Brief audit — Gap 2)

**For: Claude Code session working in `supplement-life-site`**
**Root cause confirmed by reading the codebase directly — this is not speculative.**

## Context

The `/assessment` landing page makes two claims:

> "Sage learns from how you respond over time, not just what you report on day one, and continually adjusts your protocol."

> "It's not a one-time result. It's the start of an ongoing relationship with Sage, who keeps refining both the guidance and the formula as your first 90 days unfold."

## Confirmed gap

`components/life-brief/Roadmap.tsx` renders `weeklyCheckIn.questions` (sourced from `lib/life-brief/adapter.ts`'s `buildRoadmapProps`, which pulls the hardcoded `WEEKLY_CHECK_IN_QUESTIONS` array in `lib/claude/intake.ts`) as static, read-only text. There is no form, no `onSubmit`, no input element, no API route, and no database table anywhere in the codebase that accepts, stores, or processes a subscriber's answer to any of these questions.

Confirmed by:
- `grep -ri "check.?in" app/api` — no matches.
- `Roadmap.tsx` in full — a `<ul>` of question strings, nothing interactive.
- No migration creates a check-in-shaped table.

The only real "adjusts over time" mechanism that exists today is a full intake retake (`app/dashboard/brief/page.tsx`'s "Retake your intake" link → a new `track_assignments` row → powers the existing Then-vs-Now `ProgressComparison` component's 2-snapshot comparison). That's legitimate, but it isn't the lightweight week-to-week loop the landing copy describes.

**Also found while researching this:** `RhythmBlock.sageCheckIn` — a field in `lib/life-brief/types.ts`, listed in `DailyRhythm.tsx`'s `CUE_FIELDS` (label "Sage check-in") and in `lib/pdf/life-brief.ts`'s matching `RHYTHM_DETAIL_FIELDS`/`RHYTHM_DETAIL_LABELS` — is used in the mock data (`lib/life-brief/mock-data.ts`) but is **never populated anywhere in the real `buildDailyRhythmProps`**. This looks like a placeholder built for exactly this feature and never wired up — worth building into rather than ignoring.

So the landing page's claim is currently false in production. This spec is to make it true.

## What "resolved" means

A subscriber can answer their weekly check-in questions, the answer is persisted, and it visibly, truthfully feeds back into their experience — at minimum a real acknowledgment ("Sage has noted this"), ideally surfaced back into the Brief itself (e.g. via the dangling `sageCheckIn` field above). This does **not** need to trigger a full re-run of the Domain Opportunity Score engine — that's arguably too heavy for a weekly pulse-check and can be a later phase. Build the lightest honest mechanism that makes the landing-page claim true, not the most sophisticated one.

## Before writing code — decide and confirm the design

This is a real feature with a few genuinely open questions the codebase doesn't answer for you. Read the existing architecture first — `lib/scoring/engine.ts`, `lib/life-brief/adapter.ts`, and `lib/claude/intake.ts`'s `buildContradictionOnlySystemPrompt` (a good template for a narrow, single-purpose Claude call, much cheaper than the full `intake_turn` flow) — then propose an approach before implementing:

1. **Where does a check-in get asked?** Options: (a) a section on `/dashboard` or `/dashboard/brief`, (b) a scheduled email/SMS prompt (Twilio SMS infra already exists — `app/api/webhooks/twilio-sms/route.ts` — as does Resend email), (c) both. Recommend one; don't build all three speculatively.
2. **What happens with the answer?** At minimum: persisted with a timestamp, visible in a check-in history view. Beyond that — does it update `current_summary`? Trigger a narrow Claude call (mirroring `buildContradictionOnlySystemPrompt`'s pattern) that revises `daily_practices` guidance or populates `sageCheckIn` based on the trend? Recommend the smallest version that's still honestly "this adjusts your protocol," and explicitly state what's out of scope for v1.
3. **Cadence enforcement.** "Weekly" implies some cadence logic — decide whether it's enforced server-side (e.g. a `profiles.last_check_in_at` column gating a new submission) or soft/advisory for v1, and say which.
4. **Compliance.** Same non-negotiable guardrails as the rest of Sage's voice — see the "Compliance & Claims Guardrail" block in `lib/claude/intake.ts`: never diagnostic, never claims to detect a medical change, general wellness education framing only. Any Claude-generated response to a check-in answer must carry the same guardrails `buildRationaleSystemPrompt`/the main intake prompt already do — don't write a new prompt from scratch without them. Also apply the same second-person "you" voice rule added 2026-07-25 (see the "Everything you write... addresses the subscriber directly as you/your" line in the intake system prompt) — no third-person slip here either.

Present the proposed design (which questions, where surfaced, what happens on submit, cadence rule) before implementing, unless it's obviously a single reasonable path once you've read the code.

## Suggested shape (a starting point, not a mandate)

- New table `check_in_responses` (`user_id`, `question`, `answer`, `priority_marker boolean`, `created_at`) — append-only, mirroring the `intake_responses` pattern (`supabase/migrations/0001_init.sql` / `0016_intake_responses_system_category.sql`) rather than the overwritten-`profiles`-column pattern used for `current_summary`/`*_recommendation`, since a check-in history is inherently a log, not a current-state snapshot.
- A `profiles.last_check_in_at` timestamp column for the cadence rule.
- A new route, e.g. `app/api/dashboard/check-in/route.ts`, POST-only, authenticated the same way every other route in `app/api/` already is (`createClient()` + `supabase.auth.getUser()`).
- `Roadmap.tsx` gets real inputs (most of `WEEKLY_CHECK_IN_QUESTIONS` read as 1-5 scale or short free-text) wired to that route, with real submit state (loading/success/error) — not static text.
- Wire the acknowledgment/feedback moment through the dangling `sageCheckIn` field so it actually appears in the next Daily Rhythm render, closing the loop described above.

## Acceptance criteria

- Every question in `WEEKLY_CHECK_IN_QUESTIONS` (or its replacement) is answerable through a real UI, not just displayed.
- An answer is persisted and retrievable — reload the page, it's still there.
- The subscriber sees some visible, honest acknowledgment that their answer did something — do not overclaim what v1 actually does (e.g. if v1 only logs and surfaces on the next Brief view, say that, not "your protocol has been updated").
- The mechanism respects the same compliance/claims guardrails and second-person voice as the rest of the product.
- State plainly, in the PR description or a follow-up note, whether the landing page's "continually adjusts your protocol" claim is now fully true, or exactly which part of it still isn't — the same way this spec flagged the original gap — so marketing copy can be checked against actual behavior rather than assumed.
