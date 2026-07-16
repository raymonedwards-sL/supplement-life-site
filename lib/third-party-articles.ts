/**
 * Live third-party credible-source articles for the dashboard (2026-07-15
 * dashboard architecture pass, item #3) — surfaces reputable external
 * writing on a subscriber's own ingredients/benefit categories directly in
 * the dashboard, so they don't have to leave to research. Per the user's
 * explicit choice, this is wired to a LIVE search API (not a static curated
 * list) so results evolve as a subscriber's protocol evolves, rather than
 * needing manual refresh.
 *
 * 2026-07-17 — SWITCHED from Google Programmable Search Engine (Custom
 * Search JSON API) to the Brave Search API. Verified directly against
 * Google's own docs (developers.google.com/custom-search/v1/overview,
 * updated 2026-02-18): "The Custom Search JSON API is closed to new
 * customers" — existing customers get until Jan 1 2027, but a fresh setup
 * like this one can no longer get an API key at all. That's why the
 * previous GOOGLE_CSE_API_KEY/GOOGLE_CSE_CX setup step had no visible "get
 * a key" path. User chose Brave Search API as the replacement (still open
 * to new signups, simple single-key REST API, 2,000 free queries/month) —
 * see api-dashboard.search.brave.com/app/documentation/web-search.
 *
 * Setup required before this does anything (until then it fails soft and
 * the dashboard section simply doesn't render — see fetchTrustedArticles
 * below):
 *   1. Sign up at https://brave.com/search/api/ and subscribe to the Web
 *      Search plan (free tier: 2,000 queries/month, 1 query/second).
 *   2. Get your API key from the Brave Search API dashboard
 *      (api-dashboard.search.brave.com) — Settings/API Keys.
 *   3. Set BRAVE_SEARCH_API_KEY in the deploy environment.
 *
 * Credibility is enforced TWO ways, not just one: (1) every query embeds a
 * `site:` OR-group restricting results to a fixed allowlist of reputable
 * health/wellness domains, and (2) TRUSTED_DOMAINS is re-checked against
 * every returned result's hostname in code as a second gate — belt and
 * suspenders, since Brave's exact operator-grouping behavior isn't
 * something to blindly trust for a compliance-sensitive feature like this
 * one. A result that somehow slips past the query restriction still gets
 * dropped here if its domain isn't on the allowlist.
 *
 * Results are cached via Next.js's fetch cache (`next.revalidate`) rather
 * than refetched on every dashboard load — daily is frequent enough for
 * "continuously evolving" content without hammering the free-tier quota.
 */

export type TrustedArticle = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

const REVALIDATE_SECONDS = 60 * 60 * 24; // daily
const RESULTS_PER_QUERY = 3;

/**
 * Reputable health/wellness sources a skeptical subscriber would actually
 * trust. Update this list, not per-request logic, if the credibility bar
 * needs to change — every result is checked against it twice (query-level
 * `site:` restriction + a code-level hostname check on the response).
 */
const TRUSTED_DOMAINS = [
  "healthline.com",
  "examine.com",
  "mayoclinic.org",
  "medicalnewstoday.com",
  "webmd.com",
  "verywellhealth.com",
  "ncbi.nlm.nih.gov",
  "clevelandclinic.org",
  "health.harvard.edu",
];

const SITE_RESTRICTION = TRUSTED_DOMAINS.map((d) => `site:${d}`).join(" OR ");

type BraveWebResult = {
  title?: string;
  url?: string;
  description?: string;
};

type BraveSearchResponse = {
  web?: {
    results?: BraveWebResult[];
  };
};

function isTrustedDomain(hostname: string): boolean {
  return TRUSTED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

/**
 * Fetches credible third-party articles for one query (an ingredient name
 * or a benefit-category label). Returns an empty array — never throws — on
 * missing config or any API/network failure, so a not-yet-configured or
 * momentarily-down search API never breaks the dashboard.
 */
export async function fetchTrustedArticles(query: string): Promise<TrustedArticle[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", `${query} wellness benefits (${SITE_RESTRICTION})`);
    url.searchParams.set("count", String(RESULTS_PER_QUERY));
    url.searchParams.set("safesearch", "moderate");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(
        `Trusted-article search failed for "${query}": ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = (await response.json()) as BraveSearchResponse;

    return (data.web?.results ?? [])
      .filter((item): item is Required<BraveWebResult> => Boolean(item.title && item.url))
      .filter((item) => {
        try {
          return isTrustedDomain(new URL(item.url).hostname);
        } catch {
          return false;
        }
      })
      .slice(0, RESULTS_PER_QUERY)
      .map((item) => ({
        title: item.title,
        url: item.url,
        snippet: item.description ?? "",
        source: new URL(item.url).hostname,
      }));
  } catch (error) {
    console.error(`Trusted-article search threw for "${query}":`, error);
    return [];
  }
}

export type BenefitCategoryArticles = {
  categoryKey: string;
  categoryLabel: string;
  articles: TrustedArticle[];
};

/**
 * Fetches trusted articles per benefit-category label (one query per
 * category, not per ingredient — keeps API usage proportional to a
 * subscriber's protocol breadth rather than their full ingredient count).
 * Categories that return zero articles (not yet configured, or a query
 * that happens to return nothing) are omitted from the result.
 */
export async function fetchTrustedArticlesByCategory(
  categories: { key: string; label: string }[]
): Promise<BenefitCategoryArticles[]> {
  const results = await Promise.all(
    categories.map(async (cat) => ({
      categoryKey: cat.key,
      categoryLabel: cat.label,
      articles: await fetchTrustedArticles(cat.label),
    }))
  );
  return results.filter((r) => r.articles.length > 0);
}
