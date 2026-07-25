# Bug Fix Spec: Duplicate Chat Bubbles from Retried Intake Turns

**For: Claude Code session working in `supplement-life-site`**
**Root cause confirmed by reading `app/api/intake/chat/route.ts` and `app/intake/IntakeChat.tsx` directly — this is not speculative.**

## Confirmed root cause

`route.ts`, lines 269–278:

```ts
if (message) {
  const { error: userMessageError } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    conversation_id: conversationId,
    role: "user",
    content: message,
  });
  if (userMessageError) console.error("Failed to persist user chat message:", userMessageError);
  anthropicMessages.push({ role: "user", content: message });
}
```

This insert is unconditional and has no idempotency check. When a turn fails downstream — either the explicit `!toolUse` early return (line 438–441) or the outer `catch` (line 790–793) — the client shows "Sorry — I hit a snag" with a Try Again button (`IntakeChat.tsx`, ~line 306). Clicking it calls `send(attempt.text, attempt.before)` with the identical message text (`lastAttemptRef`, lines 46–51 and 320–321), which POSTs again — and `route.ts` inserts another identical row, every time, no dedup.

The client's `sendingRef` guard (line 45, 134–136) only prevents a *simultaneous* double-fire (e.g. a fast double-click). It does nothing to stop deliberate, sequential retries — each one is a legitimate, separate request as far as the client is concerned, and each one persists its own row.

The duplicate bubbles are a direct, visible symptom: reload the page → `hydrate()` reads back `chat_messages` from `/api/intake/chat/history` → every one of those retried rows renders as its own bubble. Two retries → two duplicates; three retries → three. This matches the screenshots exactly.

## The fix (do this regardless of the investigation below)

Before the insert at `route.ts` line 270, check whether the most recent `chat_messages` row for this `(user_id, conversation_id)` already has `role: 'user'` with identical `content`. If so, this is a retry of an already-persisted message — skip the insert and go straight to the Claude call with the existing history. Only insert when the content actually differs from the last row.

Concretely: a single-row query (`order by created_at desc limit 1`) before the insert, compared against `message`, gates whether the insert runs.

## What's still unconfirmed — please check server logs

I don't have access to your Netlify function logs, so I can't see which of the three "Something went wrong" paths is actually firing for this specific message, or what the real underlying exception is:
- Line 440 — no `tool_use` block in the response at all.
- Line 790–793 — the catch-all around the whole handler (Anthropic API error, a Supabase call throwing instead of returning `{error}`, or something in the scoring engine).
- A malformed-completion or malformed-log_entry shape not yet covered by the existing defensive checks (lines 454–471, 481–493) — those were both added after live testing turned up new failure shapes, so a third one showing up here wouldn't be surprising.

**Please pull the actual log line for this request** (timestamp matches the screenshot — the message was "What are your thoughts regarding my chronic nasal drip / discharge?"). That tells us definitively whether this is:
1. A generic transient failure (rate limit, network) — nothing to fix beyond the dedup above.
2. A new malformed-tool-call shape needing its own defensive check, same pattern as the two already in place.
3. Something related to how Claude handles a physical-symptom-flavored question under `tool_choice: {type:'tool', name:'intake_turn'}` — worth flagging back to me with the real error text if so, since that would be a `lib/claude/intake.ts` prompt-level fix (e.g. explicitly instructing Sage to route symptom questions through the existing `safety_flag` mechanism you've already built, rather than however it's currently landing), not a route.ts bug.

## Acceptance criteria

- A retried turn (via Try Again, or the resume-on-reload path in `hydrate()`) never produces more than one persisted `chat_messages` row for the same actual message.
- Reloading mid-failure shows exactly one bubble for the failed message, not one per retry attempt.
- The real exception for this failure is visible in logs by message/timestamp, not just a generic "Something went wrong" — so this doesn't require a screenshot to diagnose next time.
