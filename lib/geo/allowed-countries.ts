/**
 * Geographic eligibility check for the Founding Subscriber Program.
 *
 * Supplement :: LIFE is currently only offered to residents of the United
 * States, Canada, and Mexico. This is the FIRST of three layers enforcing
 * that restriction:
 *
 *   1. IP geolocation (this file) — best-effort, checked in middleware.ts
 *      before /reserve renders and before /api/checkout runs.
 *   2. Self-attestation checkbox — required on the Reserve form, validated
 *      again server-side in app/api/checkout/route.ts.
 *   3. Stripe shipping_address_collection.allowed_countries — a hard
 *      backstop inside Checkout itself; a disallowed country literally
 *      cannot be selected there.
 *
 * IP geolocation alone is spoofable (VPNs) and occasionally wrong, so this
 * layer FAILS OPEN: any lookup error, timeout, or unresolvable IP is
 * treated as "unknown" and allowed through to the next layer, rather than
 * incorrectly locking out a real US/CA/MX customer.
 */

export const ALLOWED_COUNTRY_CODES = ["US", "CA", "MX"] as const;

/**
 * Extracts the best-guess client IP from standard proxy/CDN headers.
 * Netlify sets x-nf-client-connection-ip; x-forwarded-for is the more
 * universal fallback most CDNs/proxies set (first entry = original client).
 */
export function getClientIp(request: Request): string | null {
  const nfIp = request.headers.get("x-nf-client-connection-ip");
  if (nfIp) return nfIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

/**
 * Resolves an IP to a two-letter ISO country code via ipapi.co's free
 * endpoint. Returns null (== "unknown") on any error, timeout, private IP,
 * or unrecognized response — callers must treat null as "allow through."
 */
export async function lookupCountryForIp(ip: string): Promise<string | null> {
  if (!ip || isPrivateOrLocalIp(ip)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://ipapi.co/${ip}/country/`, {
      signal: controller.signal,
      headers: { "User-Agent": "yourlifeprotocol-geo-check/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const code = (await res.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

/** null (unknown) is treated as allowed — see file header for why. */
export function isAllowedCountry(code: string | null): boolean {
  if (!code) return true;
  return (ALLOWED_COUNTRY_CODES as readonly string[]).includes(code);
}
