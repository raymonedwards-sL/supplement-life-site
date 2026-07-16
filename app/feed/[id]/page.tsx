import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Container, Eyebrow } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

/**
 * Public permalink for one daily digest entry (2026-07-15) — the `<link>`
 * target inside each /feed RSS item, so the daily branded email beehiiv
 * sends has a real "read online" destination rather than a dead link.
 */
export default async function DigestPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    notFound();
  }

  const supabase = createSupabaseClient(supabaseUrl!, supabaseAnonKey!);
  const { data: post } = await supabase
    .from("daily_digest_posts")
    .select("title, body_html, published_at")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  const publishedDate = new Date(post.published_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="py-20">
      <Container className="max-w-2xl">
        <Eyebrow>Daily Cellular Rejuvenation</Eyebrow>
        <p className="mt-2 text-sm text-navy/50">{publishedDate}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          {post.title}
        </h1>
        <div
          className="prose prose-navy mt-8 max-w-none leading-relaxed text-navy/80"
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />
        <div className="mt-10 border-t border-navy/10 pt-8">
          <LinkButton href="/reserve" size="lg">
            Reserve Your Founding Subscription
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
