// Everything you'd want to tweak lives in this file.

export type Source = {
  name: string; // shown on the brick, e.g. "NPR"
  url: string; // official RSS feed URL
};

export type Category = {
  id: string;
  title: string;
  bricks: number; // how many bricks to make for this category each day
  focus: string; // tells Claude what belongs in this category
  sources: Source[];
};

// Google Gemini, on its free tier (no credit card). A free key comes from
// https://aistudio.google.com/apikey. The free tier is sometimes overloaded, so these
// are tried in order until one answers. GEMINI_MODEL (optional) is tried first.
export const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite", // smaller and less in demand, so usually available
  "gemini-3.1-flash-lite",
].filter((m): m is string => Boolean(m));

// Used to write each brick's "why it matters to me" line.
export const READER_PROFILE =
  "a college student in Missouri who studies finance, grew up in the St. Louis area, and wants to understand how news affects their daily life, money, and future";

// Only consider stories published within this many hours.
export const MAX_AGE_HOURS = 36;

export const CATEGORIES: Category[] = [
  {
    id: "us-politics",
    title: "US Politics & Government",
    bricks: 5,
    focus:
      "Federal government and national politics: Congress, the White House, federal agencies, the Supreme Court and federal courts, elections, and national policy.",
    sources: [
      { name: "NPR", url: "https://feeds.npr.org/1014/rss.xml" },
      { name: "PBS NewsHour", url: "https://www.pbs.org/newshour/feeds/rss/politics" },
      { name: "Politico", url: "https://rss.politico.com/politics-news.xml" },
    ],
  },
];
