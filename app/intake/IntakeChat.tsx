"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { findTrack } from "@/lib/tracks";
import { getIngredientEducationList } from "@/lib/ingredient-education";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import { getTrackAtmosphere } from "@/lib/tracks-atmosphere";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);
  // Scopes this sitting's structured answers server-side (see
  // app/api/intake/chat/route.ts) so the scoring engine can tell this
  // conversation's answers apart from a subscriber's whole history.
  // Captured from the server's first response, echoed back on every
  // subsequent turn.
  const conversationId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function send(nextMessages: ChatMessage[]) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, conversationId: conversationId.current }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (data.conversationId) conversationId.current = data.conversationId;

      if (data.done) {
        setSummary(data.summary);
      } else {
        setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
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
    if (!input.trim() || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    void send(next);
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
    return <SummaryCard summary={summary} />;
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
              {m.content}
            </div>
          </div>
        ))}
        {loading && <ThinkingIndicator />}
      </div>

      {error && <p className="px-6 text-sm text-red-600">{error}</p>}

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

function SummaryCard({ summary }: { summary: Completion }) {
  const tracks = summary.recommended_track_ids
    .map((id) => findTrack(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const allIngredients = getIngredientEducationList(tracks.flatMap((t) => t.ingredients));
  const atmosphere = getTrackAtmosphere(tracks[0]?.id);
  const reasonFor = (trackId: string) =>
    summary.rationale.find((r) => r.track_id === trackId)?.reason;

  return (
    <div className="rounded-2xl border border-copper/30 bg-white/70 p-6 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-copper">
        Your Wellness Profile Summary
      </p>
      <p className="mt-4 border-l-4 border-copper/30 pl-5 text-lg font-medium leading-relaxed text-navy sm:text-xl">
        {summary.summary}
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
                    {reasonFor(t.id)}
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
                <span className="ml-2 text-navy/75">{ing.role}</span>
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

      <p className="mt-8 text-xs leading-relaxed text-navy/40">
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
