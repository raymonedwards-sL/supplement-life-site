"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help with billing, shipping, and account questions about Supplement :: LIFE. For anything about your personal wellness profile or Botanical Track, that's Sage's job — I'll point you there. What can I help with?",
};

/**
 * Sitewide support chat widget — a floating bubble in the bottom-right
 * corner, present on every page via app/layout.tsx. Deliberately a
 * separate, unbranded "Support" assistant, not Sage — see the file-level
 * comment in lib/claude/support.ts for why blending the two personas
 * would be both a brand and a compliance problem.
 *
 * Stateless on purpose: the greeting is a hardcoded local message (no API
 * call just to open the widget), and the running conversation only lives
 * in React state for this browser session — nothing is persisted to
 * Supabase. See app/api/support/chat/route.ts for the (also stateless,
 * no-auth) backend.
 */
export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Skip the hardcoded local greeting — the API's system prompt
        // already establishes the assistant's role, it doesn't need to
        // see its own canned opening line as conversation history.
        body: JSON.stringify({ messages: nextMessages.filter((m) => m !== GREETING) }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-cream shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-navy/10 bg-navy px-4 py-3">
            <p className="text-sm font-semibold text-cream">Supplement :: LIFE Support</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="flex h-7 w-7 items-center justify-center rounded-full text-cream/70 transition-colors hover:bg-cream/10 hover:text-cream"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-copper text-cream"
                      : "rounded-bl-sm bg-navy/5 text-navy"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[85%]">
                <div className="rounded-2xl rounded-bl-sm bg-navy/5 px-3.5 py-2.5 text-sm text-navy/40">
                  Typing…
                </div>
              </div>
            )}
          </div>

          {error && <p className="px-4 pb-1 text-xs text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-navy/10 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about billing, shipping, your account…"
              disabled={loading}
              className="min-w-0 flex-1 rounded-full border border-navy/20 bg-white px-4 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-copper focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-copper text-cream transition-colors hover:bg-copper/90 disabled:opacity-60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="m3 3 18 9-18 9 4-9-4-9Z" />
              </svg>
            </button>
          </form>

          <p className="border-t border-navy/5 px-4 py-2 text-center text-[11px] leading-relaxed text-navy/40">
            For wellness or ingredient questions, talk with Sage instead.
            This assistant handles billing, shipping, and account help.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-copper text-cream shadow-lg transition-transform hover:scale-105"
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
