// Everything you'd want to tweak lives in this file.
//
// The job writes bricks for EVERY category below each morning: news everyone can follow
// (world, regions, the US) and sports leagues. A reader's own places (any city, state, or
// country) and teams are written on demand by the worker/ service instead.
// Category ids must match app/src/topics.ts.

import { LEAGUES } from "../../shared/leagues.ts";

export type Source = {
  name: string; // shown on the brick, e.g. "NPR"
  url: string; // official RSS feed URL, or an ESPN news API URL
  type?: "rss" | "espn"; // defaults to "rss"
};

export type Category = {
  id: string;
  title: string; // shown above each brick, e.g. "Politics · World"
  bricks: number; // most bricks to write for this category each day
  focus: string; // tells the AI what belongs in this category
  sources: Source[];
  maxAgeHours?: number; // how recent stories must be (default MAX_AGE_HOURS)
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

// Only consider stories published within this many hours.
export const MAX_AGE_HOURS = 36;

// ---------- Sources ----------
const NPR = (id: number) => ({ name: "NPR", url: `https://feeds.npr.org/${id}/rss.xml` });
const PBS = (section: string) => ({
  name: "PBS NewsHour",
  url: `https://www.pbs.org/newshour/feeds/rss/${section}`,
});
const BBC = (section: string) => ({ name: "BBC News", url: `https://feeds.bbci.co.uk/news/${section}/rss.xml` });
const GUARDIAN = (section: string) => ({ name: "The Guardian", url: `https://www.theguardian.com/${section}/rss` });
const DW = (feed: string) => ({ name: "DW", url: `https://rss.dw.com/rdf/rss-en-${feed}` });
const AL_JAZEERA = { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" };
// CNBC replaced the Wall Street Journal, whose RSS feeds stopped updating in Jan 2025.
const CNBC = (id: number) => ({ name: "CNBC", url: `https://www.cnbc.com/id/${id}/device/rss/rss.html` });
const POLITICO = { name: "Politico", url: "https://rss.politico.com/politics-news.xml" };

// ESPN's public news API (no team: the whole league).
const ESPN = (league: string): Source => ({
  name: "ESPN",
  type: "espn",
  url: `https://site.api.espn.com/apis/site/v2/sports/${league}/news?limit=40`,
});

// ---------- Categories ----------
const news = (id: string, title: string, focus: string, sources: Source[]): Category => ({
  id,
  title,
  bricks: 5,
  focus,
  sources,
});

const region = (id: string, name: string, sources: Source[]): Category =>
  news(
    id,
    `World · ${name}`,
    `The most important news from ${name}: politics and government, elections, conflicts, economies, and major events affecting people there.`,
    sources,
  );



const league = ({ id, name, path }: (typeof LEAGUES)[number]): Category => ({
  id,
  title: `Sports · ${name}`,
  bricks: 5,
  focus: `The biggest ${name} news: results, standings, trades, injuries, and league decisions. Skip betting tips, fantasy advice, and video-only clips.`,
  sources: [ESPN(path)],
  maxAgeHours: 96, // smaller leagues and off-seasons are quiet for days
});

export const CATEGORIES: Category[] = [
  // The world
  news("top-world", "Top Stories · World", "The most important news anywhere in the world today, any subject.", [
    BBC("world"),
    GUARDIAN("world"),
    AL_JAZEERA,
    DW("world"),
    NPR(1004),
  ]),
  news(
    "politics-world",
    "Politics · World",
    "Government and politics around the world: elections, leaders, wars, diplomacy, and international agreements.",
    [BBC("world"), GUARDIAN("world"), AL_JAZEERA, DW("world"), PBS("world")],
  ),
  news(
    "economy-world",
    "Economy · World",
    "The global economy: countries' economies, global markets, trade, oil and energy prices, prices people pay, and major companies.",
    [BBC("business"), GUARDIAN("business"), DW("bus"), NPR(1006)],
  ),

  // World regions
  region("region-africa", "Africa", [BBC("world/africa"), GUARDIAN("world/africa"), AL_JAZEERA]),
  region("region-asia", "Asia & Pacific", [BBC("world/asia"), GUARDIAN("world/asia-pacific"), AL_JAZEERA]),
  region("region-europe", "Europe", [BBC("world/europe"), GUARDIAN("world/europe-news"), DW("world")]),
  region("region-latam", "Latin America", [BBC("world/latin_america"), GUARDIAN("world/americas"), AL_JAZEERA]),
  region("region-mideast", "Middle East", [BBC("world/middle_east"), GUARDIAN("world/middleeast"), AL_JAZEERA]),

  // United States (big enough to have its own sections)
  news("top-us", "Top Stories · United States", "The most important news in the United States today, any subject.", [
    NPR(1001),
    PBS("headlines"),
    BBC("world/us_and_canada"),
  ]),
  news(
    "politics-us",
    "Politics · United States",
    "US federal government and national politics: Congress, the White House, federal agencies, the Supreme Court, elections, and national policy.",
    [NPR(1014), PBS("politics"), POLITICO],
  ),
  news(
    "economy-us",
    "Economy · United States",
    "The US economy and markets: jobs, inflation, interest rates and the Federal Reserve, the stock market, big companies, housing, and prices people pay.",
    [NPR(1017), NPR(1006), PBS("economy"), CNBC(100003114), CNBC(20910258)],
  ),

  // Sports
  news(
    "sports-top",
    "Sports · Top Headlines",
    "The biggest sports stories in the world today, any sport or country. Skip betting tips and fantasy advice.",
    [{ name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" }, { name: "ESPN", url: "https://www.espn.com/espn/rss/news" }],
  ),
  ...LEAGUES.map(league),
];
