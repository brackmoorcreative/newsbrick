import { ApiError, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { z } from "zod";
import { BRICKS_SCHEMA, bricksPrompt, SYSTEM_PROMPT } from "../../shared/prompt.ts";
import { MODELS, type Category } from "./config.ts";
import type { FeedItem } from "./fetchFeeds.ts";

export type Brick = {
  id: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  explainer: string;
  keyTerms: { term: string; definition: string }[];
  disagreement: string | null;
  importance: number; // 1-10 on one scale across every category; the app shows the top few
  image: string | null; // photo from the news feed, when it has one
  // site: the outlet's homepage, for its logo (Google News links go through news.google.com)
  sources: { name: string; title: string; url: string; site?: string }[];
};

// Zod double-checks the AI's answer against the shared shape (shared/prompt.ts) before we use it.
const ResponseSchema = z.object({
  bricks: z.array(
    z.object({
      sourceIds: z.array(z.number().int()),
      importance: z.number().int(),
      headline: z.string(),
      summary: z.string(),
      whyItMatters: z.string(),
      explainer: z.string(),
      keyTerms: z.array(z.object({ term: z.string(), definition: z.string() })),
      disagreement: z.string().nullable(),
    }),
  ),
});

// One quick attempt per model (timeout in milliseconds). Retrying is done by moving on
// to the next model, which is much faster than waiting on a busy one.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { timeout: 60_000, retryOptions: { attempts: 1 } },
});

// Models in the order to try. Whichever answers moves to the front, so the rest of the
// run skips models that are busy today.
const modelOrder = [...MODELS];

// Which model actually wrote today's bricks (saved in latest.json).
export const modelsUsed = new Set<string>();

export async function writeBricks(category: Category, items: FeedItem[]): Promise<Brick[]> {
  const itemList = items
    .map((item, i) => `[${i}] ${item.source} | ${item.title}\n${item.snippet}`)
    .join("\n\n");

  const prompt = bricksPrompt(category.title, category.focus, category.bricks, itemList);

  let response: GenerateContentResponse | undefined;
  let model = "";
  for (model of [...modelOrder]) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: BRICKS_SCHEMA,
        },
      });
      modelOrder.splice(modelOrder.indexOf(model), 1);
      modelOrder.unshift(model);
      break;
    } catch (err) {
      // Busy, rate-limited, timed out, or model retired: try the next one.
      // Anything else is a real bug.
      if (err instanceof ApiError && [404, 429, 500, 503, 504].includes(err.status)) {
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
      // Links and images come from the feeds, never from the AI, so they can't be made up.
      const used = [...new Set(b.sourceIds)].filter((id) => id >= 0 && id < items.length).map((id) => items[id]);
      const { sourceIds, importance, ...text } = b;
      return {
        id: `${category.id}-${i}`,
        ...text,
        importance: Math.min(10, Math.max(1, importance)),
        image: used.find((item) => item.image)?.image ?? null,
        sources: used.map((item) => ({ name: item.source, title: item.title, url: item.url })),
      };
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
    importance: 5 - i,
    image: item.image ?? null,
    sources: [{ name: item.source, title: item.title, url: item.url }],
  }));
}
