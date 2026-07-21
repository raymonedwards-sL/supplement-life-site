import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates (or reuses) the Supabase account tied to a completed Stripe
 * Checkout Session, emailing an invite link when the account is new.
 *
 * Shared by both checkout products handled in
 * app/api/webhooks/stripe/route.ts — the $249 Founding Reservation
 * deposit and the $797 LIFE Assessment purchase — since both need the
 * exact same "invite, or look up the existing user by email" logic.
 * Extracted here on 2026-07-17 when the LIFE Assessment product was
 * added, so the two checkout flows can't drift out of sync.
 */
export async function getOrCreateUserForCheckout(
  supabaseAdmin: SupabaseClient,
  params: { email: string; reservationId: string; siteUrl: string; redirectNext?: string }
): Promise<string> {
  const { email, reservationId, siteUrl, redirectNext = "/intake" } = params;

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { reservation_id: reservationId },
      redirectTo: `${siteUrl}/auth/callback?next=${redirectNext}`,
    }
  );

  if (!inviteError) {
    return invited.user.id;
  }

  const alreadyExists = /already been registered|already exists/i.test(inviteError.message);
  if (!alreadyExists) throw inviteError;

  // User already has an account (e.g. bought the LIFE Assessment, then
  // came back to reserve a Founding Subscription, or vice versa) — look
  // up their existing id instead of failing the webhook.
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (lookupError || !existing) {
    throw lookupError ?? new Error(`No existing user found for ${email}`);
  }
  return existing.id;
}
