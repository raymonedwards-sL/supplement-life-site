import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase auth session on every request so server
 * components always see an up-to-date logged-in/out state.
 * Called from middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touches the session so expired tokens get refreshed. Do not remove —
  // Supabase SSR relies on this call happening on every request.
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * Safety net for stray Supabase auth `?code=` params landing on the wrong
 * page. The email link is supposed to always go to /auth/callback first,
 * which exchanges the code for a session before redirecting onward. But if
 * the origin the link was generated from (e.g. a Netlify deploy-preview
 * subdomain) isn't in the project's Auth > URL Configuration > Redirect
 * URLs allowlist, Supabase silently swaps in a different allowed URL
 * instead of honoring the requested redirect — which can land `code` on
 * an unrelated page (e.g. /dashboard) that has no idea what to do with it,
 * so the user never actually gets logged in and sees a confusing second
 * "log in" prompt. Exchanging a stray code here, in middleware, fixes that
 * no matter which page it lands on. This does NOT replace fixing the
 * Redirect URLs allowlist at the source — see project memory for the exact
 * Supabase dashboard steps.
 */
export async function exchangeStrayCode(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return null;

  let sessionResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          sessionResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const target = request.nextUrl.clone();
  target.pathname = error
    ? "/auth/error"
    : request.nextUrl.searchParams.get("next") ?? request.nextUrl.pathname;
  target.search = "";

  const redirectResponse = NextResponse.redirect(target);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
