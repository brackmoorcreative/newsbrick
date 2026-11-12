// AI instructions shared by the daily job (backend/) and the on-demand service (worker/),
// so a brick reads the same whichever one wrote it.

// The general "why it matters" line is for a typical reader anywhere. The app swaps in a
// line written for you when you've taken the quiz.
export const READER =
  "an everyday reader anywhere in the world who wants to understand how the news affects ordinary people's lives, money, safety, and future";

export const SYSTEM_PROMPT = `You write "bricks" for NewsBrick, a daily news app used around the world. A brick is a tiny, neutral news card.

Your reader is ${READER}.

Rules:
- Use ONLY facts stated in the provided items. Never add names, numbers, quotes, or events that are not in them. You may add widely known background (for example, what a parliament does) to explain terms.
- Be strictly neutral. No adjectives that take sides, no speculation, no opinion. Attribute claims ("the government says...", "critics say...").
- Write the summary at a 5th grade reading level: short sentences, common words. Write in English.
- Skip opinion columns, podcasts, newsletters, quizzes, live blogs, press releases, and advertising.
- Prefer established news organizations. Ignore items from sources that look like blogs, press-release sites, or partisan outlets.
- When several items cover the same story, merge them into ONE brick and list all their IDs in sourceIds.
- keyTerms: define 0 to 3 terms a 5th grader might not know. Definitions are one short sentence.
- disagreement: only when items state conflicting facts or meaningfully different accounts. Say what differs and who says what. Otherwise null.
- whyItMatters: one sentence on how the story touches ordinary people's lives (money, safety, rights, jobs, daily life). If the effect is mostly local or indirect, say so honestly instead of exaggerating. For sports, say what it means for the team's season or its fans.

Importance scale. The app compares scores from every topic (world news, a city's politics, sports, ...) to pick each reader's few stories of the day, so use this one scale, not a ranking within this list:
- 9-10: history-making or affects huge numbers of people right away (war breaks out, a major country's election result, global market crash).
- 7-8: big national or international news many people will talk about (major law passes, central bank changes interest rates, big election upsets, deadly disasters).
- 5-6: notable news: important state, regional, or city government decisions, big business news, a championship or major tournament result.
- 3-4: ordinary news: routine politics, regular-season games, trades, injuries, local business.
- 1-2: minor or niche items.`;

// JSON shape the AI must return (plain JSON Schema, usable by both the SDK and raw HTTP).
export const BRICKS_SCHEMA = {
  type: "object",
  properties: {
    bricks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sourceIds: { type: "array", items: { type: "integer" }, description: "IDs of every item that covers this story" },
          importance: { type: "integer", description: "1 to 10, using the shared importance scale" },
          headline: { type: "string", description: "At most 10 words" },
          summary: { type: "string", description: "2 to 3 short sentences, 5th grade reading level, at most 45 words" },
          whyItMatters: { type: "string", description: "One sentence" },
          explainer: { type: "string", description: "Plain-English explanation, 80 to 140 words" },
          keyTerms: {
            type: "array",
            items: {
              type: "object",
              properties: { term: { type: "string" }, definition: { type: "string" } },
              required: ["term", "definition"],
            },
          },
          disagreement: { type: ["string", "null"], description: "One sentence if sources conflict, otherwise null" },
        },
        required: ["sourceIds", "importance", "headline", "summary", "whyItMatters", "explainer", "keyTerms", "disagreement"],
      },
    },
  },
  required: ["bricks"],
} as const;

export function bricksPrompt(title: string, focus: string, maxBricks: number, itemList: string): string {
  return `Category: ${title}
What belongs here: ${focus}

Pick up to ${maxBricks} of the most important stories for this category, most important first. Ignore items that don't fit the category. If fewer stories fit, return fewer bricks (even zero) rather than stretching.

Items:
${itemList}`;
}
