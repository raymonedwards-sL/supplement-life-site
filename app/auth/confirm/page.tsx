"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Handles Supabase "implicit flow" auth links — token arrives as a
 * #access_token=...&refresh_token=... hash fragment, which only the
 * browser can read (servers never see anything after #). This page picks
 * up where /auth/callback (server-side, handles ?code= links) can't.
 */
export default function AuthConfirm() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmInner />
    </Suspense>
  );
}

function AuthConfirmInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const next = searchParams.get("next") ?? "/intake";
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setError(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        console.error("Failed to establish session from auth link:", error);
        setError(true);
      } else {
        router.replace(next);
      }
    });
  }, [router, searchParams]);

  if (error) {
    router.replace("/auth/error");
    return null;
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <span className="flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-copper/60 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-copper/60 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-copper/60" />
      </span>
      <p className="text-navy/70">Logging you in…</p>
    </section>
  );
}
