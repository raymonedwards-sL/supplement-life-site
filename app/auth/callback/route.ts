import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the code from a Supabase auth email link (the invite sent by
 * the Stripe webhook, or a magic-link login) for a real session.
 * Without this route, clicking the invite email does not actually log
 * the user in — Supabase just redirects here with a one-time code.
 *
 * Some Supabase email links use the older "implicit flow" instead — the
 * token arrives as a #access_token=... hash fragment, which browsers never
 * send to a server. This route can't see those at all, so when there's no
 * ?code= param, hand off to /auth/confirm (a client page) that can read
 * the hash directly, rather than assuming it's an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/intake";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback failed to exchange code:", error);
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  return NextResponse.redirect(
    `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
  );
}
