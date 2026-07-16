/**
 * Live third-party credible-source articles for the dashboard (2026-07-15
 * dashboard architecture pass, item #3) — surfaces reputable external
 * writing on a subscriber's own ingredients/benefit categories directly in
 * the dashboard, so they don't have to leave to research. Per the user's
 * explicit choice, this is wired to a LIVE search API (not a static curated
 * list) so results evolve as a subscriber's protocol evolves, rather than
 * needing manual refresh.
 *
 * Uses Google Programmable Search Engine (Custom Search JSON API). Setup
 * required before this does anything (until then it fails soft and the
 * dashboard section simply doesn't render — see getTrustedArticles below):
 *   1. Create a Programmable Search Engine at
 *      https://programmablesearchengine.google.com/ restricted to "Search
 *      specific sites" — add ONLY credible health/wellness sources (e.g.
 *      examine.com, health.clevelandclinic.org, healthline.com,
 *      medicalnewstoday.com, ncbi.nlm.nih.gov, mayoclinic.org,
 *      verywellhealth.com, webmd.com). Restricting at the engine level
 *      (rather than per-request domain filtering) keeps every query
 *      automatically limited to sources worth a skeptical subscriber's
 *      trust — do not point this at the open web.
 *   2. Get an API key from Google Cloud Console (enable the "Custom Search
 *      API"), and the Search Engine ID ("cx") from the PSE control panel.
 *   3. Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_CX in the deploy environment.
 *
 * Results are cached via Next.js's fetch cache (`next.revalidate`) rather
 * than refetched on every dashboard load — daily is frequent enough for
 * "continuously evolving" content without hammering the API or the Custom
 * Search free-tier quota (100 queries/day) on every page view.
 */

export type TrustedArticle = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

const REVALIDATE_SECONDS = 60 * 60 * 24; // daily
const RESULTS_PER_QUERY = 3;

type GoogleCseItem = {
  title?: string;
  link?: string;
  snippet?: string;
  displayLink?: string;
};

type GoogleCseResponse = {
  items?: GoogleCseItem[];
};

/**
 * Fetches credible third-party articles for one query (an ingredient name
 * or a benefit-category label). Returns an empty array — never throws — on
 * missing config or any API/network failure, so a not-yet-configured or
 * momentarily-down search API never breaks the dashboard.
 */
export async function fetchTrustedArticles(query: string): Promise<TrustedArticle[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    return [];
  }

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", `${query} wellness benefits`);
    url.searchParams.set("num", String(RESULTS_PER_QUERY));
    url.searchParams.set("safe", "active");

    const response = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      console.error(
        `Trusted-article search failed for "${query}": ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = (await response.json()) as GoogleCseResponse;

    return (data.items ?? [])
      .filter((item): item is Required<Pick<GoogleCseItem, "title" | "link">> & GoogleCseItem =>
        Boolean(item.title && item.link)
      )
      .map((item) => ({
        title: item.title!,
        url: item.link!,
        snippet: item.snippet ?? "",
        source: item.displayLink ?? new URL(item.link!).hostname,
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
