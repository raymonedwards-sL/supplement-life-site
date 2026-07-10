"use client";

import { useEffect, useRef, useState } from "react";
import { findTrack } from "@/lib/tracks";

type ChatMessage = { role: "user" | "assistant"; content: string };

type Completion = {
  summary: string;
  recommended_track_ids: string[];
  rationale: string;
  ingredient_highlights: { ingredient: string; role: string }[];
};

export default function IntakeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); // true on mount to fetch the opener
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Completion | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(nextMessages: ChatMessage[]) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    void send(next);
  }

  if (summary) {
    return <SummaryCard summary={summary} />;
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white/50">
      <div className="flex items-center gap-3 border-b border-navy/10 bg-navy/5 px-6 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-copper/15 text-sm font-semibold text-copper">
          S
        </span>
        <div>
          <p className="text-sm font-semibold text-navy">Sage</p>
          <p className="text-xs text-navy/50">Your LIFE Guide</p>
        </div>
      </div>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}>
            {m.role === "assistant" && (
              <p className="mb-1 px-1 text-xs font-semibold text-navy/40">Sage</p>
            )}
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-6 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-navy/10 p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
          disabled={loading}
          className="flex-1 rounded-full border border-navy/20 bg-white px-5 py-3 text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function SummaryCard({ summary }: { summary: Completion }) {
  const tracks = summary.recommended_track_ids
    .map((id) => findTrack(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="rounded-2xl border border-copper/30 bg-white/70 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-copper">
        Your Wellness Profile Summary
      </p>
      <p className="mt-3 leading-relaxed text-navy/80">{summary.summary}</p>

      {tracks.length > 0 && (
        <div className="mt-6 rounded-xl bg-navy/5 p-4">
          <p className="text-sm font-semibold text-navy">
            Recommended: {tracks.map((t) => t.name).join(" + ")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            {summary.rationale}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {summary.ingredient_highlights.map((ing, i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="font-semibold text-copper">{ing.ingredient}</span>
            <span className="text-navy/60">— {ing.role}</span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-navy/40">
        This is personalized wellness information, not medical advice,
        diagnosis, or treatment. Your profile has been saved — you can revisit
        it any time from your{" "}
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
