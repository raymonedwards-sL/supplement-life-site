/**
 * beehiiv integration (2026-07-15 dashboard architecture pass, item #4) —
 * adds new Founding Subscribers to the Supplement :: LIFE beehiiv audience
 * so they can receive the daily branded educational email.
 *
 * Setup required before this does anything (fails soft until configured —
 * see addBeehiivSubscriber below):
 *   1. Create a beehiiv account and publication at https://www.beehiiv.com/
 *      if you don't have one yet.
 *   2. Get an API key: Settings -> Integrations -> API in the beehiiv
 *      dashboard.
 *   3. Get your Publication ID (format "pub_...") from the same area, or
 *      from the publication's settings.
 *   4. Set BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID in the deploy
 *      environment.
 *
 * IMPORTANT — verified against beehiiv's public API docs (developers.
 * beehiiv.com) on 2026-07-15: creating a subscription via this endpoint is
 * on beehiiv's standard API (works on any plan with API access). Actually
 * SENDING a daily email automatically, however, is handled by a SEPARATE
 * mechanism — see netlify/functions/generate-daily-digest.mts and
 * app/feed/route.ts — because beehiiv's "Send API" (create-a-post-that-
 * triggers-a-send) is beta/Enterprise-plan-only as of this writing. The
 * daily send itself should be configured as a native beehiiv "RSS to
 * Email" Automation pointed at this site's /feed (see that route's
 * comment), which is available on beehiiv's standard plans and doesn't
 * require Send API access. Reconfirm both of these facts against beehiiv's
 * current docs before assuming they still hold — API terms change.
 */

type AddSubscriberOptions = {
  /** Skip the welcome email if you're double-sending via another flow. */
  sendWelcomeEmail?: boolean;
  /** Ties the beehiiv subscription back to the Stripe customer for reference. */
  stripeCustomerId?: string;
  /**
   * Segmentation tag for where this subscriber entered from. Defaults to
   * "founding_reservation" to preserve existing behavior at the two
   * paid-checkout call sites (app/api/webhooks/stripe/route.ts) — pass an
   * explicit value for any new, non-paid entry point (e.g. the free
   * "Join the LIFE Tribe" opt-in) so beehiiv audience segments/automations
   * can tell paying customers apart from free-list subscribers.
   */
  utmMedium?: string;
  /**
   * beehiiv custom field values, e.g. [{ name: "Biggest Challenge", value:
   * "Sleep that doesn't actually restore you" }]. Verified against
   * beehiiv's live API reference (developers.beehiiv.com/api-reference/
   * subscriptions/create) on 2026-07-20: shape is { name, value } pairs.
   * IMPORTANT — per that same doc, "the custom fields must already exist
   * for the publication. Any new custom fields here will be discarded" —
   * this call does NOT create the field. Create it once in the beehiiv
   * dashboard (Settings > Custom Fields) with a matching name before
   * assuming this data is actually landing in beehiiv; until then it's
   * silently dropped (not an error) and the source of truth is wherever
   * the caller also persisted it directly (e.g. public.tribe_leads for
   * the join-tribe route).
   */
  customFields?: { name: string; value: string }[];
  /**
   * beehiiv Automation IDs to enroll this NEW subscriber into immediately
   * after creation (verified 2026-07-20 against developers.beehiiv.com's
   * Create Subscription reference: "Enroll the subscriber into automations
   * after their subscription has been created. Requires the automations
   * to have an active *Add by API* trigger"). IMPORTANT: beehiiv's API has
   * no endpoint to CREATE an automation's actual content (steps/emails/
   * delays) — only to list existing automations and enroll subscribers
   * into ones that already exist with that trigger type turned on. The
   * automation itself must be built by hand in the beehiiv dashboard
   * (Automations > New Automation > trigger: "Add by API") before this
   * option does anything.
   */
  automationIds?: string[];
};

export async function addBeehiivSubscriber(
  email: string,
  options: AddSubscriberOptions = {}
): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    console.warn(
      "beehiiv not configured (BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID missing) — skipping subscriber sync."
    );
    return { ok: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: options.sendWelcomeEmail ?? true,
          stripe_customer_id: options.stripeCustomerId,
          utm_source: "yourlifeprotocol.com",
          utm_medium: options.utmMedium ?? "founding_reservation",
          ...(options.customFields ? { custom_fields: options.customFields } : {}),
          ...(options.automationIds && options.automationIds.length > 0
            ? { automation_ids: options.automationIds }
            : {}),
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`beehiiv subscribe failed for ${email}: ${response.status} ${body}`);
      return { ok: false, reason: `http_${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error(`beehiiv subscribe threw for ${email}:`, error);
    return { ok: false, reason: "network_error" };
  }
}
