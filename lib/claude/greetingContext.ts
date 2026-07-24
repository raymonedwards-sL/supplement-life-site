/**
 * Return-greeting variation (SAGE_Return_Greeting_and_Chat_History_Spec.md,
 * 2026-07-24). Root cause of the "same greeting every time" bug: Sage's
 * turn-one prompt (lib/claude/intake.ts) never saw which greetings it had
 * already used, and had no instruction to vary sentence structure — so
 * near-identical phrasing was the natural result, not a one-off fluke.
 * This module assembles the context block that fixes that: a computed
 * time-since-last-visit string, a deterministic opening-style pick, and
 * the last few greetings actually sent, framed as "already used."
 */

const ARCHETYPES = [
  {
    label: "Direct check-in on the last concern",
    instruction:
      'Open by asking directly about the specific concern/topic from their last conversation — e.g. "Still feeling [X], or has that eased up?" Keep it to one or two sentences before moving into the conversation.',
  },
  {
    label: "Observation-led",
    instruction:
      'Open with a brief observation about the time that\'s passed and what that typically means, rather than a direct question — e.g. "It\'s been about [time] since we talked — that\'s usually enough time to notice a shift, one way or another." Let the actual question follow naturally after.',
  },
  {
    label: "Forward-looking / protocol-anchored",
    instruction:
      "Open by referencing something concrete they were doing or working on last time (a daily practice, a habit they mentioned) and ask how it went — anchor the greeting in that specific thread, not a generic check-in.",
  },
  {
    label: "Open-ended, no recap",
    instruction:
      'Open with a genuinely open question and no recap of last time at all — e.g. "What\'s been on your mind since we last talked?" Trust them to bring up what matters rather than leading with what Sage remembers.',
  },
  {
    label: "Warm, short, minimal recap",
    instruction:
      "Keep this one especially brief and warm — a short greeting with at most a light touch of recap, not a full restatement of last time. Best suited when the return is very recent, but keep it natural regardless.",
  },
] as const;

export type GreetingArchetype = (typeof ARCHETYPES)[number];

/** Deterministic (not cryptographic) string hash — only needs a stable,
 * roughly-even spread across a small archetype list, not collision
 * resistance. */
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Picks one of the archetypes above per (subscriber, conversation) pair —
 * varied turn to turn since conversationCount changes every conversation,
 * but reproducible for a given turn rather than random, per the spec's
 * "(userId + sessionCount) % N" guidance.
 */
export function pickGreetingArchetype(userId: string, conversationCount: number): GreetingArchetype {
  const index = stableHash(`${userId}:${conversationCount}`) % ARCHETYPES.length;
  return ARCHETYPES[index];
}

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Buckets a raw timestamp into the kind of phrasing a person would
 * actually use ("3 days," "2.5 weeks") — deliberately computed here rather
 * than left to the model, since date arithmetic from a raw ISO timestamp
 * is exactly the kind of thing that invites both errors and repeated
 * phrasing. Returns null if there's no prior visit to compare against.
 */
export function computeTimeSinceLastVisit(lastConversationAt: string | null | undefined): string | null {
  if (!lastConversationAt) return null;
  const elapsedMs = Date.now() - new Date(lastConversationAt).getTime();
  if (elapsedMs < 0) return null;

  if (elapsedMs < MS_PER_DAY) return "earlier today";
  if (elapsedMs < 2 * MS_PER_DAY) return "since yesterday";

  const days = elapsedMs / MS_PER_DAY;
  if (days < 14) return `${Math.round(days)} days`;

  const weeks = days / 7;
  if (weeks < 8) return `${Math.round(weeks * 2) / 2} weeks`;

  const months = days / 30;
  return `${Math.round(months * 2) / 2} months`;
}

export function buildReturnGreetingBlock({
  timeSinceLastVisit,
  archetype,
  priorGreetings,
}: {
  timeSinceLastVisit: string | null;
  archetype: GreetingArchetype;
  priorGreetings: string[];
}): string {
  const priorGreetingsBlock =
    priorGreetings.length > 0
      ? `\nGreetings already used with this subscriber — do not repeat this phrasing, rhythm, or question structure:\n${priorGreetings
          .map((g, i) => `${i + 1}. "${g}"`)
          .join("\n")}`
      : "";

  return `
## This is a return visit — vary your opening
${timeSinceLastVisit ? `Time since their last conversation: ${timeSinceLastVisit}.` : ""}

For this turn's opening message only, use this style: **${archetype.label}**. ${archetype.instruction}
${priorGreetingsBlock}

Vary sentence structure and opening style every time — a subscriber who talks with you repeatedly should never feel like they're hearing the same script. Do not reuse the phrasing, rhythm, or question structure of any greeting listed above as already used. Still introduce yourself by name exactly once as usual, and keep it in Sage's voice — warm, specific, never generic. The greeting must still accurately reflect this subscriber's real last topic/concern from their profile above — vary HOW you say it, not the underlying accuracy.
`;
}
