"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { findTrack } from "@/lib/tracks";
import { getIngredientEducationList } from "@/lib/ingredient-education";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import { getTrackAtmosphere } from "@/lib/tracks-atmosphere";
import { boldBotanicals } from "@/components/BoldBotanicals";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Completion = {
  summary: string;
  recommended_track_ids: string[];
  rationale: { track_id: string; reason: string }[];
  ingredient_highlights: { ingredient: string; role: string }[];
  daily_practices: { water_intake: string; fasting: string };
};

export default function IntakeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); // true on mount to fetch the opener
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Completion | null>(null);
  // Sage's own closing words for this completion — shown as a lead-in on
  // SummaryCard so the conversation doesn't trail into ambiguity (see
  // SAGE_Intake_Completion_Handoff_Spec.md). Set alongside `summary`
  // whether the completion just happened live or was reconstructed from
  // a reload.
  const [closingMessage, setClosingMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);
  // Synchronous double-submit guard (SAGE_Intake_Duplicate_Send_Error_Bug.md,
  // 2026-07-26). `loading` state alone isn't enough here: it only becomes
  // true again once React actually re-renders, which happens a beat after
  // the triggering event, not within it. A fast double-click on Send or
  // Enter-key auto-repeat can fire submitMessage() twice before that
  // render lands, so both calls read a stale loading=false and both
  // proceed — producing the exact repro (the same message sent twice as
  // two bubbles). A ref is read/written synchronously, immune to that gap.
  const sendingRef = useRef(false);
  // Captures the args of the most recent send() call so a failed attempt
  // can be retried with exactly the same message + pre-send state,
  // regardless of which call site triggered it (a fresh submitMessage(),
  // the crash-mid-turn resume in hydrate(), etc.) — set once, inside
  // send() itself, rather than duplicated at every call site.
  const lastAttemptRef = useRef<{ text: string | undefined; before: ChatMessage[] } | null>(null);
  // Scopes this sitting's structured answers server-side (see
  // app/api/intake/chat/route.ts) so the scoring engine can tell this
  // conversation's answers apart from a subscriber's whole history.
  // Captured from the server's first response, echoed back on every
  // subsequent turn.
  const conversationId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resume-on-reload (SAGE_Return_Greeting_and_Chat_History_Spec.md,
  // 2026-07-24): before assuming this is a brand-new conversation, check
  // whether the subscriber has an unfinished sitting to pick back up —
  // see app/api/intake/chat/history/route.ts for what counts as
  // "unfinished" (a completed sitting always starts fresh instead, since
  // that's a real retake).
  async function hydrate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake/chat/history");
      const data = await res.json();

      // Completed sitting (SAGE_Intake_Completion_Handoff_Spec.md,
      // 2026-07-24) — reload right after finishing shows the same closing
      // message + CTA instead of silently starting a new conversation.
      if (res.ok && data.completedConversation) {
        setSummary(data.completedConversation.summary);
        setClosingMessage(data.completedConversation.closingMessage ?? null);
        setEmail(data.completedConversation.email ?? null);
        setLoading(false);
        return;
      }

      const history: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];

      if (res.ok && data.conversationId && history.length > 0) {
        conversationId.current = data.conversationId;
        setMessages(history);

        const last = history[history.length - 1];
        if (last.role === "user") {
          // Rare crash-mid-turn case: the subscriber's message was saved
          // but Sage never replied — pick the conversation back up rather
          // than leaving them stuck on their own last message.
          void send(undefined, history);
          return;
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Failed to load chat history, starting fresh:", err);
    }

    // No resumable sitting (or the history fetch itself failed) — behave
    // exactly as before: fetch the opening question for a new conversation.
    void send(undefined, []);
  }

  // Scroll only the chat's own message list, not the page — a plain
  // scrollIntoView() on a sentinel element also drags the outer window
  // scroll position along with it, which is what was pushing the whole
  // page down to the footer on every reply. Setting scrollTop directly on
  // the scrollable container itself never touches the page's own scroll.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // History now lives server-side (see hydrate() above) — this only ever
  // sends the single new message being replied with, not the whole
  // transcript. `currentMessages` is the state from BEFORE this message
  // (used to rebuild the post-reply array without waiting on a round
  // trip for what the client already knows).
  async function send(userMessageText: string | undefined, currentMessages: ChatMessage[]) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    lastAttemptRef.current = { text: userMessageText, before: currentMessages };
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessageText, conversationId: conversationId.current }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (data.conversationId) conversationId.current = data.conversationId;

      if (data.done) {
        setSummary(data.summary);
        setClosingMessage(data.closingMessage ?? null);
        setEmail(data.email ?? null);
      } else {
        const withUserMessage = userMessageText
          ? [...currentMessages, { role: "user" as const, content: userMessageText }]
          : currentMessages;
        setMessages([...withUserMessage, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }

  // Auto-grow the textarea with its content (up to a capped height, after
  // which it scrolls internally) instead of the old single-line <input>
  // that silently truncated anything longer than the visible width.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function submitMessage() {
    // Checked here, before the optimistic bubble append below — not just
    // inside send() — because a second, near-simultaneous call reaching
    // this function would otherwise still append its own duplicate bubble
    // even if send() itself later no-ops. sendingRef is set synchronously
    // by send() (see above), so this read is never stale the way `loading`
    // state was.
    if (sendingRef.current || !input.trim()) return;

    const text = input.trim();
    setMessages([...messages, { role: "user", content: text }]);
    setInput("");
    void send(text, messages);
  }

  // Explicit retake action from the completed-conversation CTA — per the
  // SAGE_Intake_Completion_Handoff_Spec.md decision, /intake now shows the
  // finished LIFE Brief + CTA by default whenever the subscriber's latest
  // sitting is complete (including via the dashboard's "Retake your
  // intake" link), so starting a genuinely new conversation is one
  // deliberate click here rather than automatic on every page load.
  function startNewConversation() {
    conversationId.current = undefined;
    setSummary(null);
    setClosingMessage(null);
    setEmail(null);
    setMessages([]);
    void send(undefined, []);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitMessage();
  }

  // Enter sends the message (matching the old input's behavior);
  // Shift+Enter inserts a newline, since the box can now hold multiple lines.
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }

  if (summary) {
    return (
      <SummaryCard
        summary={summary}
        closingMessage={closingMessage}
        email={email}
        onStartNew={startNewConversation}
      />
    );
  }

  return (
    <div className="relative">
      {/* Sage avatar callout — deliberately a sibling of the chat box (not
          nested inside it) so it can overlap the top-left corner without
          fighting the box's own overflow-hidden, which clips the rounded
          message-scroll area. This is meant to make the intake feel like a
          real one-on-one conversation with Sage, not an anonymous form. */}
      <div className="absolute -top-6 -left-3 z-10 h-16 w-16 overflow-hidden rounded-full border-4 border-cream shadow-lg sm:-top-8 sm:-left-4 sm:h-20 sm:w-20">
        <Image
          src="/Sage-avatar.png"
          alt="Sage, Your LIFE Guide"
          fill
          priority
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white/50">
      <div className="flex items-center justify-between gap-3 border-b border-navy/10 bg-navy/5 py-3 pl-20 pr-6 sm:pl-24">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-navy">Sage</p>
            <p className="text-xs text-navy/50">Your LIFE Guide</p>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-navy/40 sm:flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          Confidential &amp; secure
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-6"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}>
            {m.role === "assistant" && (
              <p className="mb-1 px-1 text-xs font-semibold text-navy/40">Sage</p>
            )}
            <div
              className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-copper text-cream"
                  : "rounded-bl-sm bg-navy/5 text-navy"
              }`}
            >
              {boldBotanicals(m.content)}
            </div>
          </div>
        ))}
        {loading && <ThinkingIndicator />}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 px-6">
          <p className="text-sm text-red-600">Sorry — I hit a snag there. {error}</p>
          <button
            type="button"
            onClick={() => {
              // Replays the exact call that failed — including the
              // original message text, if there was one — rather than
              // silently dropping it. Safe to resend even if the server
              // already persisted it on a prior attempt (that request
              // failed AFTER persisting, not before): worst case is a
              // harmless duplicate chat_messages row visible only if the
              // conversation is later reloaded, which is a far better
              // failure mode than the subscriber's answer just vanishing.
              const attempt = lastAttemptRef.current;
              if (attempt) void send(attempt.text, attempt.before);
            }}
            disabled={loading}
            className="shrink-0 rounded-full border border-red-600/30 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600/10 disabled:opacity-60"
          >
            Try again
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-3 border-t border-navy/10 p-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer…"
          disabled={loading}
          rows={1}
          className="max-h-40 flex-1 resize-none overflow-y-auto rounded-3xl border border-navy/20 bg-white px-5 py-3 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream shadow-[0_0_0_5px_var(--color-ivory)] transition-shadow hover:bg-copper/90 hover:shadow-[0_0_0_7px_var(--color-ivory)] disabled:opacity-60"
        >
          Send
        </button>
      </form>
      </div>
    </div>
  );
}

const TRACK_ROLE_LABELS = ["Primary", "Secondary", "Tertiary"];

function SummaryCard({
  summary,
  closingMessage,
  email,
  onStartNew,
}: {
  summary: Completion;
  closingMessage: string | null;
  email: string | null;
  onStartNew: () => void;
}) {
  const tracks = summary.recommended_track_ids
    .map((id) => findTrack(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const allIngredients = getIngredientEducationList(tracks.flatMap((t) => t.ingredients));
  const atmosphere = getTrackAtmosphere(tracks[0]?.id);
  const reasonFor = (trackId: string) =>
    summary.rationale.find((r) => r.track_id === trackId)?.reason;

  return (
    <div className="rounded-2xl border border-copper/30 bg-white/70 p-6 sm:p-10">
      {closingMessage && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-navy/5 px-4 py-3">
          <p className="text-xs font-semibold text-navy/40">Sage</p>
          <p className="flex-1 text-sm leading-relaxed text-navy/80">{boldBotanicals(closingMessage)}</p>
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-copper">
        Your Wellness Profile Summary
      </p>
      <p className="mt-4 border-l-4 border-copper/30 pl-5 text-lg font-medium leading-relaxed text-navy sm:text-xl">
        {boldBotanicals(summary.summary)}
      </p>

      {tracks.length > 0 && (
        <div className="mt-8 rounded-xl bg-navy/5 p-5 sm:p-6">
          <p className="text-base font-bold text-navy">
            Your Initial Protocol
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {tracks.map((t, i) => (
              <div
                key={t.id}
                className="flex flex-col items-center rounded-lg border border-navy/10 bg-white/60 p-4 text-center"
              >
                <div className="relative h-56 w-32 overflow-hidden rounded-md shadow-sm">
                  <Image
                    src={t.image}
                    alt={`${t.name} packaging`}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
                <span className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-copper/70">
                  {TRACK_ROLE_LABELS[i] ?? "Additional"}
                </span>
                <span className="mt-0.5 text-base font-bold text-navy">{t.name}</span>
                {reasonFor(t.id) && (
                  <p className="mt-3 border-t border-navy/10 pt-3 text-left text-sm leading-relaxed text-navy/75">
                    {boldBotanicals(reasonFor(t.id)!)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.ingredient_highlights.length > 0 && (
        <div className="mt-8">
          <p className="text-base font-bold text-navy">Why these, specifically</p>
          <div className="mt-3 flex flex-col gap-2.5">
            {summary.ingredient_highlights.map((ing, i) => (
              <div key={i} className="rounded-lg bg-copper/5 px-4 py-2.5 text-sm sm:text-base">
                <span className="font-bold text-copper">{ing.ingredient}</span>
                <span className="ml-2 text-navy/75">{boldBotanicals(ing.role)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.daily_practices && (
        <div className="mt-8">
          <p className="text-base font-bold text-navy">Your Daily Practices</p>
          <p className="mt-1 text-sm text-navy/60">
            Sage&apos;s hydration and fasting guidance, personalized to how you
            actually live.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
              <div className="flex items-center gap-2 text-copper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-wide">
                  Hydration
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy/75">
                {summary.daily_practices.water_intake}
              </p>
            </div>
            <div className="rounded-xl border border-navy/10 bg-white/70 p-5">
              <div className="flex items-center gap-2 text-copper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                <p className="text-sm font-bold uppercase tracking-wide">
                  Fasting Window
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy/75">
                {summary.daily_practices.fasting}
              </p>
            </div>
          </div>
        </div>
      )}

      {allIngredients.length > 0 && (
        <div className="relative mt-10 overflow-hidden rounded-2xl">
          {atmosphere && (
            <>
              <Image
                src={atmosphere}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                aria-hidden
              />
              <div className="absolute inset-0 bg-cream/90" />
            </>
          )}
          <div className="relative p-5 sm:p-7">
            <p className="text-base font-bold text-navy">Your Botanical Compounds</p>
            <p className="mt-1 text-sm text-navy/60">
              The full ingredient story behind your protocol — what each one is, why
              it&apos;s formulated in, and where to read more.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allIngredients.map((ing) => (
                <IngredientCard key={ing.name} ingredient={ing} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Explicit next-step CTA — SAGE_Intake_Completion_Handoff_Spec.md:
          a visible, clickable element, not just descriptive text. Copy and
          hrefs match app/dashboard/page.tsx's equivalent links exactly. */}
      <div className="mt-10 rounded-xl border border-copper/20 bg-copper/5 p-5 sm:p-6">
        <p className="text-sm font-semibold text-navy">Your LIFE Brief is ready.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <a
            href="/dashboard/brief"
            className="rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-copper/90"
          >
            View Your Full LIFE Brief →
          </a>
          <a
            href="/api/dashboard/insights-pdf"
            className="rounded-full border border-copper/40 px-5 py-2.5 text-sm font-semibold text-copper transition-colors hover:bg-copper/10"
          >
            Download Your LIFE Brief (PDF)
          </a>
        </div>
        {email && <p className="mt-3 text-xs text-navy/50">Also sent to you at {email}.</p>}
        <p className="mt-4 text-xs">
          <button
            type="button"
            onClick={onStartNew}
            className="font-semibold text-navy/50 underline underline-offset-2 hover:text-navy/70"
          >
            Start a new conversation
          </button>
        </p>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-navy/40">
        This is personalized wellness information, not medical advice,
        diagnosis, or treatment. Wikipedia links are provided as a general
        reference, not as medical guidance. Your profile has been saved — you
        can revisit it any time from your{" "}
        <a href="/dashboard" className="underline">
          dashboard
        </a>
        .
      </p>
    </div>
  );
}

const THINKING_MESSAGES = ["Sage is thinking…", "Still with you…", "Almost there…"];

function ThinkingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, THINKING_MESSAGES.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mr-auto flex items-center gap-2 rounded-2xl bg-navy/5 px-4 py-3 text-sm text-navy/50">
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-navy/40" />
      </span>
      {THINKING_MESSAGES[messageIndex]}
    </div>
  );
}
