import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes the auth session via Next.js cookies so
 * the logged-in user is available on the server.
 *
 * Still uses the public anon key — RLS enforces per-user access. For
 * privileged operations that must bypass RLS (e.g. the Stripe webhook
 * writing subscription rows for a user), a separate service-role client
 * will be needed once that key is added (see Step 5 of the launch guide).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
            // when middleware is also refreshing sessions.
          }
        },
      },
    }
  );
}
