import { ApiError, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { z } from "zod";
import { MODELS, READER_PROFILE, type Category } from "./config.ts";
import type { FeedItem } from "./fetchFeeds.ts";

export type Brick = {
  id: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  explainer: string;
  keyTerms: { term: string; definition: string }[];
  disagreement: string | null;
  sources: { name: string; title: string; url: string }[];
};

// The exact shape Gemini must return. Gemini is forced to answer in this JSON shape,
// and Zod double-checks it before we use it.
const BrickSchema = z.object({
  sourceIds: z.array(z.number().int()).describe("IDs of every item that covers this story"),
  headline: z.string().describe("At most 10 words"),
  summary: z.string().describe("2 to 3 short sentences, 5th grade reading level, at most 45 words"),
  whyItMatters: z.string().describe("One sentence starting with 'You' or 'Your'"),
  explainer: z.string().describe("Plain-English explanation, 80 to 140 words"),
  keyTerms: z.array(z.object({ term: z.string(), definition: z.string() })),
  disagreement: z.string().nullable().describe("One sentence if sources conflict, otherwise null"),
});
const ResponseSchema = z.object({ bricks: z.array(BrickSchema) });

const SYSTEM_PROMPT = `You write "bricks" for NewsBrick, a daily news app. A brick is a tiny, neutral news card.

Your reader is ${READER_PROFILE}.

Rules:
- Use ONLY facts stated in the provided items. Never add names, numbers, quotes, or events that are not in them. You may add widely known background (for example, what the Senate does) to explain terms.
- Be strictly neutral. No adjectives that take sides, no speculation, no opinion. Attribute claims ("Republicans say...", "the White House says...").
- Write the summary at a 5th grade reading level: short sentences, common words.
- Skip opinion columns, podcasts, newsletters, quizzes, and live blogs.
- When several items cover the same story, merge them into ONE brick and list all their IDs in sourceIds.
- keyTerms: define 0 to 3 terms a 5th grader might not know (for example "filibuster", "continuing resolution"). Definitions are one short sentence.
- disagreement: only when items state conflicting facts or meaningfully different accounts. Say what differs and who says what. Otherwise null.
- whyItMatters: connect the story to the reader's life concretely (money, school, jobs, rights, Missouri). If the link is indirect, say so honestly instead of exaggerating.`;

// The free tier is sometimes busy (HTTP 503) or rate-limited (429): retry each model
// once after 10s, then move on to the next model in MODELS.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { retryOptions: { attempts: 2, initialDelay: 10 } },
});

// Which model actually wrote today's bricks (saved in latest.json).
export const modelsUsed = new Set<string>();

export async function writeBricks(category: Category, items: FeedItem[]): Promise<Brick[]> {
  const itemList = items
    .map((item, i) => `[${i}] ${item.source} | ${item.title}\n${item.snippet}`)
    .join("\n\n");

  const prompt = `Category: ${category.title}
What belongs here: ${category.focus}

Pick the ${category.bricks} most important stories for this category, ranked most important first. Importance = how much it affects many Americans, plus how many outlets cover it. Ignore items that don't fit the category.

Items:
${itemList}`;

  let response: GenerateContentResponse | undefined;
  let model = "";
  for (model of MODELS) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(ResponseSchema),
        },
      });
      break;
    } catch (err) {
      // Busy, rate-limited, or model retired: try the next one. Anything else is a real bug.
      if (err instanceof ApiError && [404, 429, 500, 503].includes(err.status)) {
        console.warn(`  ${model}: unavailable (HTTP ${err.status}), trying next model`);
        continue;
      }
      throw err;
    }
  }
  if (!response) throw new Error("Every Gemini model was busy. Try again in a few minutes.");

  if (!response.text) {
    const reason = response.candidates?.[0]?.finishReason ?? "no text returned";
    throw new Error(`Gemini returned no answer (${reason})`);
  }
  const parsed = ResponseSchema.parse(JSON.parse(response.text));
  modelsUsed.add(model);
  const usage = response.usageMetadata;
  console.log(
    `  Gemini (${model}): ${usage?.promptTokenCount ?? "?"} input / ${usage?.candidatesTokenCount ?? "?"} output tokens`,
  );

  return parsed.bricks
    .map((b, i) => {
      // Links come from the feeds, never from the AI, so they can't be made up.
      const sources = [...new Set(b.sourceIds)]
        .filter((id) => id >= 0 && id < items.length)
        .map((id) => ({ name: items[id].source, title: items[id].title, url: items[id].url }));
      const { sourceIds, ...text } = b;
      return { id: `${category.id}-${i}`, ...text, sources };
    })
    .filter((brick) => brick.sources.length > 0)
    .slice(0, category.bricks);
}

// Used by --dry-run: builds bricks straight from the feeds with no AI call,
// so you can test the whole pipeline and the app without an API key.
export function placeholderBricks(category: Category, items: FeedItem[]): Brick[] {
  return items.slice(0, category.bricks).map((item, i) => ({
    id: `${category.id}-${i}`,
    headline: item.title,
    summary: item.snippet || "(No description in feed.)",
    whyItMatters: "[Dry run: the AI writes this line in a real run.]",
    explainer: "[Dry run: the AI writes this explanation in a real run.]",
    keyTerms: [],
    disagreement: null,
    sources: [{ name: item.source, title: item.title, url: item.url }],
  }));
}
