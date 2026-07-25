import { type NextRequest, NextResponse } from "next/server";
import { updateSession, exchangeStrayCode } from "@/lib/supabase/middleware";
import {
  getClientIp,
  lookupCountryForIp,
  isAllowedCountry,
} from "@/lib/geo/allowed-countries";

/**
 * Geo-restriction, layer 1 of 3 (see lib/geo/allowed-countries.ts for the
 * full picture). US/CA/MX-only:
 *   - /reserve and /concierge render a hard "not available in your
 *     region" state instead of the respective checkout form.
 *   - /api/checkout and /api/checkout-concierge are rejected outright,
 *     in case the form page is bypassed.
 * /assessment and /api/checkout-assessment are deliberately NOT
 * restricted (2026-07-25, sage_launch_package_v2) — the LIFE Assessment
 * is a digital/service deliverable with no customs/import/controlled-
 * ingredient exposure, unlike the physical Botanical Kits shipped via
 * the Founding Reservation/Concierge, so it's offered worldwide while
 * kit distribution stays Phase-1-restricted.
 * Both checks fail OPEN on an unresolvable IP or a lookup error/timeout —
 * layer 2 (attestation checkbox) and layer 3 (Stripe allowed_countries)
 * remain as backstops either way, for the routes that still have them.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Runs first, on every route: catches a stray Supabase ?code= that
  // landed somewhere other than /auth/callback and exchanges it for a
  // session before anything else executes. See exchangeStrayCode's doc
  // comment in lib/supabase/middleware.ts for why this can happen.
  const codeExchange = await exchangeStrayCode(request);
  if (codeExchange) return codeExchange;

  if (pathname === "/api/checkout" || pathname === "/api/checkout-concierge") {
    const ip = getClientIp(request);
    const country = ip ? await lookupCountryForIp(ip) : null;
    if (!isAllowedCountry(country)) {
      return NextResponse.json(
        {
          error:
            "Supplement :: LIFE is currently only available to residents of the United States, Canada, and Mexico.",
        },
        { status: 403 }
      );
    }
  }

  if (
    (pathname === "/reserve" || pathname === "/concierge") &&
    searchParams.get("region") !== "unsupported"
  ) {
    const ip = getClientIp(request);
    const country = ip ? await lookupCountryForIp(ip) : null;
    if (!isAllowedCountry(country)) {
      const url = request.nextUrl.clone();
      url.searchParams.set("region", "unsupported");
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization
     * files, so auth sessions stay fresh on every page/route navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
