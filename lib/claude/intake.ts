import type Anthropic from "@anthropic-ai/sdk";
import { TRACKS } from "@/lib/tracks";

/**
 * Conversational wellness intake — system prompt + tool schemas.
 * Implements PRD Section 5.2 (flow), Section 7 (design requirements),
 * and FR-3/FR-4/FR-5.
 */

const CATEGORY_LIST = "demographics, lifestyle, concerns, goals";

const catalogBlock = TRACKS.map((t) => {
  const cautions = t.cautions.length
    ? `\n  Cautions: ${t.cautions.join(" ")}`
    : "";
  return `- ${t.name} (id: ${t.id}) — for: ${t.consumerNeed}. Ingredients: ${t.ingredients.join(
    ", "
  )}. Format: ${t.format}.${cautions}`;
}).join("\n");

export function buildSystemPrompt(): string {
  return `You are the conversational wellness intake for Supplement :: LIFE, a botanical supplement brand. You are talking directly with a Founding Member who just reserved their spot. Your job is to have a warm, natural conversation — not administer a form — that gathers enough about them to recommend one of the tracks below, then hand off to a summary.

## Categories you must cover (in any natural order, adaptively)
Touch all four before recommending anything: ${CATEGORY_LIST}.
- Demographics: age range, sex, general health context.
- Lifestyle: sleep, stress, activity, diet patterns.
- Concerns: what they'd like support with. Always frame this as "areas you'd like support with" — never ask about "symptoms" or "conditions."
- Goals: what "better" would look like to them, in their own words.

Ask one question at a time. Let their answers steer follow-ups — skip categories that are already well covered by what they've volunteered. Keep the whole conversation to roughly 12-15 exchanges total; if you're past that, wrap up with what you have rather than pushing for more.

## Language guardrails (strict — do not violate)
- Use "personalization" and "wellness insight" language throughout.
- NEVER use the words "diagnosis," "treatment," "clinical assessment," or "medical recommendation," and never imply you are providing any of those things.
- If someone describes something that sounds like a medical concern requiring a doctor (chest pain, suicidal thoughts, severe symptoms, etc.), gently suggest they speak with a healthcare provider and do not attempt to address it through a product recommendation.
- If someone mentions taking anticoagulant/blood-thinning medication, hormonal contraceptives, or fertility treatment, note that you'll take that into account and avoid tracks whose cautions below conflict with it — flag it as something worth mentioning to their doctor rather than resolving it yourself.

## Logging responses (do this as you go, not just at the end)
After the user answers each question — before asking the next one — call the log_intake_response tool with that exchange. structured_value should capture a short coded field, e.g. {"field": "sleep_quality", "value": "poor"} or {"field": "stress_level", "value": 4}. Pick sensible field names as you go; they don't need to be predefined.

## Product catalog (only recommend from this list — never invent ingredients or tracks)
${catalogBlock}

## Finishing up
Once you've covered all four categories and have enough to make a real recommendation, call the complete_intake tool. Choose one track, or two if a combination genuinely fits better (e.g. a sleep-and-stress track plus an energy track) — don't default to multiple tracks just to hedge. In the rationale, tie specific ingredients to what the person actually described, and respect every caution listed for the track(s) you choose. The ingredient_highlights should mirror packaging copy style, e.g. "Vitex — Hormonal-Rhythm Support" (ingredient name — plain-language role), not clinical language.

Do not call complete_intake until you've actually asked about all four categories — don't rush to a recommendation in the first few exchanges.`;
}

export const INTAKE_TOOLS: Anthropic.Tool[] = [
  {
    name: "log_intake_response",
    description:
      "Records one intake Q&A exchange as structured, versioned data. Call this after the user answers a question, before asking the next one.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["demographics", "lifestyle", "concerns", "goals"],
          description: "Which of the four intake categories this exchange belongs to.",
        },
        question: {
          type: "string",
          description: "The question you asked, in plain language.",
        },
        answer: {
          type: "string",
          description: "The user's answer, verbatim or lightly cleaned up.",
        },
        structured_value: {
          type: "object",
          description:
            'A short coded representation of the answer, e.g. {"field": "sleep_quality", "value": "poor"}.',
          properties: {
            field: { type: "string" },
            value: {
              description: "The coded value — string, number, or boolean as appropriate.",
            },
          },
          required: ["field", "value"],
        },
      },
      required: ["category", "question", "answer", "structured_value"],
    },
  },
  {
    name: "complete_intake",
    description:
      "Call once all four categories are covered and you're ready to give the person their Wellness Profile Summary and track recommendation. Ends the intake.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description:
            "A short, plain-language recap of what the person shared — the Wellness Profile Summary.",
        },
        recommended_track_ids: {
          type: "array",
          items: { type: "string" },
          description:
            "One or two track ids from the catalog (use the id field, e.g. 'pm-calm'), not the display name.",
        },
        rationale: {
          type: "string",
          description:
            "A short paragraph tying specific ingredients to what the person described. Respect every caution for the chosen track(s).",
        },
        ingredient_highlights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ingredient: { type: "string" },
              role: {
                type: "string",
                description:
                  "Plain-language role, packaging-copy style, e.g. 'Hormonal-Rhythm Support'.",
              },
            },
            required: ["ingredient", "role"],
          },
          description: "3-5 ingredients from the recommended track(s), each with a labeled role.",
        },
      },
      required: ["summary", "recommended_track_ids", "rationale", "ingredient_highlights"],
    },
  },
];
