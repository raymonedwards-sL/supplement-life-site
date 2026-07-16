import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Public RSS feed of daily branded educational content (2026-07-15,
 * dashboard architecture pass item #4). Unauthenticated by design — a
 * native beehiiv "RSS to Email" Automation (configured in the beehiiv
 * dashboard) polls this URL and sends each new entry to the mailing list
 * automatically. See netlify/functions/generate-daily-digest.mts for how
 * entries get written, and lib/beehiiv.ts for why this RSS indirection is
 * used instead of calling a beehiiv "send" API directly.
 *
 * Uses the anon key (not the service-role client) since this only needs
 * the public-select RLS policy on daily_digest_posts — no admin access
 * required for a read-only public feed.
 */
export const revalidate = 3600; // 1 hour — plenty fresh for a daily cadence

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourlifeprotocol.com";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("Feed not configured.", { status: 503 });
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

  const { data: posts, error } = await supabase
    .from("daily_digest_posts")
    .select("id, title, body_html, published_at")
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to load daily_digest_posts for /feed:", error);
    return new Response("Failed to load feed.", { status: 500 });
  }

  const items = (posts ?? [])
    .map((post) => {
      const link = `${SITE_URL}/feed/${post.id}`;
      const pubDate = new Date(post.published_at).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${post.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.body_html}]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Supplement :: LIFE — Daily Cellular Rejuvenation</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed" rel="self" type="application/rss+xml" />
    <description>Daily education, inspiration, and lifestyle guidance for cellular rejuvenation from Supplement :: LIFE.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
