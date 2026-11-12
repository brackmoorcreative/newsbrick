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
  importance: number; // 1-10 on one scale across every category; the app shows the top few
  image: string | null; // photo from the news feed, when it has one
  sources: { name: string; title: string; url: string }[];
};

// The exact shape Gemini must return. Gemini is forced to answer in this JSON shape,
// and Zod double-checks it before we use it.
const BrickSchema = z.object({
  sourceIds: z.array(z.number().int()).describe("IDs of every item that covers this story"),
  importance: z.number().int().describe("1 to 10, using the shared importance scale"),
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
- whyItMatters: connect the story to the reader's life concretely (money, school, jobs, rights, Missouri). If the link is indirect, say so honestly instead of exaggerating. For sports, say what it means for the team's season or its fans instead.

Importance scale. The app compares scores from every topic (world news, Missouri politics, sports, ...) to pick the reader's 5 stories of the day, so use this one scale, not a ranking within this list:
- 9-10: history-making or affects most Americans right away (war breaks out, presidential election result, market crash, major Supreme Court ruling).
- 7-8: big national or world news many people will talk about (major law passes, Fed changes interest rates, big election upsets), or Missouri news that directly changes the reader's taxes, school, or rights.
- 5-6: notable news: important state or St. Louis government decisions, big business news, a championship or major playoff game.
- 3-4: ordinary news: routine politics, regular-season games, trades, injuries.
- 1-2: minor or niche items.`;

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

  const prompt = `Category: ${category.title}
What belongs here: ${category.focus}

Pick up to ${category.bricks} of the most important stories for this category, most important first. Ignore items that don't fit the category. If fewer stories fit, return fewer bricks (even zero) rather than stretching.

Items:
${itemList}`;

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
          responseJsonSchema: z.toJSONSchema(ResponseSchema),
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
