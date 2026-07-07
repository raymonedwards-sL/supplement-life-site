import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the service_role key — bypasses Row
 * Level Security entirely. Server-only. Never import this from a Client
 * Component or anything reachable from the browser.
 *
 * Used by: the Stripe webhook (creating accounts and writing subscription
 * rows on behalf of a user with no active session), and the 14-day
 * pre-conversion notice scheduled job.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Find it in " +
        "Supabase: Project Settings > API > service_role secret."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
