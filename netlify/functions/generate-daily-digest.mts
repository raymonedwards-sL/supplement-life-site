import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { BENEFIT_CATEGORIES } from "../../lib/ingredient-education";

/**
 * Daily branded educational email content (2026-07-15, dashboard
 * architecture pass item #4). Drafts one new post via Claude, in brand
 * voice, and inserts it into public.daily_digest_posts. A native beehiiv
 * "RSS to Email" Automation (configured in the beehiiv dashboard, not
 * here) polls /feed and sends each new entry to the mailing list — see
 * lib/beehiiv.ts and app/feed/route.ts for why this indirection exists
 * instead of a direct beehiiv "send" API call (that API is beta/
 * Enterprise-only as of this writing).
 *
 * Runs daily. Rotates through benefit categories plus a few general
 * wellness topics so the daily digest doesn't repeat the same subject on
 * consecutive days — checks the last 7 days of `topic` values on
 * daily_digest_posts and excludes anything used recently.
 *
 * Same self-contained-function pattern as notify-pre-conversion.mts:
 * relative imports (no @/ alias — this runs outside the Next.js build),
 * a plain Supabase client built with the service-role key, default export
 * handler returning a plain Response, and the Config/schedule export at
 * the bottom.
 */

const GENERAL_TOPICS = [
  "hydration and cellular vitality",
  "sleep hygiene and nightly recovery",
  "cellular rejuvenation basics",
  "gentle movement after 35",
  "mindful moderation and social drinking",
  "seasonal resilience habits",
];

const MODEL = "claude-sonnet-5";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DIGEST_TOOL: Anthropic.Tool = {
  name: "write_daily_digest",
  description: "Call this exactly once to submit today's daily digest email.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "A short, warm, non-hyped email subject line (no exclamation points, no emojis).",
      },
      body_html: {
        type: "string",
        description:
          "3-5 short paragraphs of HTML (use <p> tags only, no headings/scripts/styles) educating and inspiring the reader toward a healthier lifestyle for cellular rejuvenation. Same voice as Sage: calm, precise, evidence-grounded, never hyped. Never a disease-treatment, diagnostic, or 'cure' claim. End with one gentle, specific, doable suggestion for today.",
      },
    },
    required: ["title", "body_html"],
  },
};

export default async () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set — skipping today's digest.");
    return new Response("ANTHROPIC_API_KEY not set", { status: 200 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase service-role env vars not set — skipping today's digest.");
    return new Response("Supabase not configured", { status: 200 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentPosts } = await supabaseAdmin
    .from("daily_digest_posts")
    .select("topic")
    .gte("published_at", sevenDaysAgo);

  const recentTopics = new Set((recentPosts ?? []).map((p) => p.topic).filter(Boolean));

  const allTopics = [
    ...BENEFIT_CATEGORIES.map((c) => c.label),
    ...GENERAL_TOPICS,
  ];
  const availableTopics = allTopics.filter((t) => !recentTopics.has(t));
  const topicPool = availableTopics.length > 0 ? availableTopics : allTopics;
  const topic = topicPool[Math.floor(Math.random() * topicPool.length)];

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `You write the daily branded educational email for Supplement :: LIFE, a personalized botanical supplement brand for adults 35+. Voice: calm, precise, evidence-grounded practitioner — like Sage, the brand's wellness guide. No exclamation points, no "amazing"/"incredible"/hype language, no emojis. Never name a medical diagnosis, disorder, or disease as something the reader has or is at risk for. Never claim to treat, cure, or prevent any disease. Frame everything as general lifestyle education, not medical advice. You must respond by calling the write_daily_digest tool exactly once.`,
      tools: [DIGEST_TOOL],
      tool_choice: { type: "tool", name: "write_daily_digest" },
      messages: [
        {
          role: "user",
          content: `Write today's daily digest email. Today's topic focus: "${topic}".`,
        },
      ],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (!toolUse) {
      console.error("generate-daily-digest: no tool_use block in Claude response");
      return new Response("No tool_use block", { status: 500 });
    }

    const { title, body_html } = toolUse.input as { title: string; body_html: string };

    const { error } = await supabaseAdmin.from("daily_digest_posts").insert({
      title,
      body_html,
      topic,
    });

    if (error) {
      console.error("Failed to insert daily_digest_posts row:", error);
      return new Response("Failed to save digest", { status: 500 });
    }

    return new Response(`Published today's digest: "${title}" (topic: ${topic})`, {
      status: 200,
    });
  } catch (error) {
    console.error("generate-daily-digest failed:", error);
    return new Response("Failed to generate digest", { status: 500 });
  }
};

export const config: Config = {
  schedule: "@daily",
};
