// Everything you'd want to tweak lives in this file.
//
// The job writes bricks for EVERY category below each morning. The app's Settings
// decide which ones you see. Category ids must match app/src/topics.ts.

export type Source = {
  name: string; // shown on the brick, e.g. "NPR"
  url: string; // official RSS feed URL, or an ESPN news API URL
  type?: "rss" | "espn"; // defaults to "rss"
};

export type Category = {
  id: string;
  title: string; // shown above each brick, e.g. "Politics · Missouri"
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

// Used to write each brick's "why it matters to me" line.
export const READER_PROFILE =
  "a college student in Missouri who studies finance, grew up in the St. Louis area, and wants to understand how news affects their daily life, money, and future";

// Only consider stories published within this many hours.
export const MAX_AGE_HOURS = 36;

// ---------- Sources ----------
const NPR = (id: number) => ({ name: "NPR", url: `https://feeds.npr.org/${id}/rss.xml` });
const PBS = (section: string) => ({
  name: "PBS NewsHour",
  url: `https://www.pbs.org/newshour/feeds/rss/${section}`,
});
const BBC = (section: string) => ({ name: "BBC News", url: `https://feeds.bbci.co.uk/news/${section}/rss.xml` });
// CNBC replaced the Wall Street Journal, whose RSS feeds stopped updating in Jan 2025.
const CNBC = (id: number) => ({ name: "CNBC", url: `https://www.cnbc.com/id/${id}/device/rss/rss.html` });
// Only the Post-Dispatch's general local feed is current; its politics and business
// section feeds stopped updating in 2026.
const POST_DISPATCH_LOCAL = {
  name: "St. Louis Post-Dispatch",
  url: "https://www.stltoday.com/search/?f=rss&t=article&c=news/local&l=25&s=start_time&sd=desc",
};
const KSDK = (section: string) => ({ name: "KSDK", url: `https://www.ksdk.com/feeds/syndication/rss/${section}` });
const MO_INDEPENDENT = { name: "Missouri Independent", url: "https://missouriindependent.com/feed/" };
const POLITICO = { name: "Politico", url: "https://rss.politico.com/politics-news.xml" };

// ESPN's public news API. `team` narrows a league to one team.
const ESPN = (league: string, team?: string): Source => ({
  name: "ESPN",
  type: "espn",
  url: `https://site.api.espn.com/apis/site/v2/sports/${league}/news?limit=40${team ? `&team=${team}` : ""}`,
});

// ---------- Categories ----------
const news = (id: string, title: string, focus: string, sources: Source[]): Category => ({
  id,
  title,
  bricks: 5,
  focus,
  sources,
});

const league = (id: string, name: string, path: string): Category => ({
  id,
  title: `Sports · ${name}`,
  bricks: 5,
  focus: `The biggest ${name} news: results, standings, trades, injuries, and league decisions. Skip betting tips, fantasy advice, and video-only clips.`,
  sources: [ESPN(path)],
});

const team = (id: string, name: string, path: string, espnTeam: string): Category => ({
  id,
  title: `Sports · ${name}`,
  bricks: 3,
  focus: `Only stories mainly about the ${name}: games, roster moves, injuries, coaches. Skip stories where the ${name} are only mentioned in passing.`,
  sources: [ESPN(path, espnTeam)],
  maxAgeHours: 96, // teams don't have news every day
});

export const CATEGORIES: Category[] = [
  // Top stories
  news("top-world", "Top Stories · World", "The most important news from around the world.", [
    BBC("world"),
    NPR(1004),
    PBS("world"),
  ]),
  news("top-us", "Top Stories · United States", "The most important news in the United States today, any subject.", [
    NPR(1001),
    PBS("headlines"),
  ]),

  // Politics & government
  news(
    "politics-world",
    "Politics · World",
    "Government and politics in other countries and between countries: elections, leaders, wars, diplomacy, international agreements.",
    [BBC("world"), NPR(1004), PBS("world")],
  ),
  news(
    "politics-us",
    "Politics · United States",
    "Federal government and national politics: Congress, the White House, federal agencies, the Supreme Court and federal courts, elections, and national policy.",
    [NPR(1014), PBS("politics"), POLITICO],
  ),
  news(
    "politics-mo",
    "Politics · Missouri",
    "Missouri state government and politics: the governor, the Missouri legislature, state agencies, state courts, state ballot measures, and Missouri's members of Congress.",
    [MO_INDEPENDENT, KSDK("news/politics")],
  ),
  news(
    "politics-stl",
    "Politics · St. Louis",
    "St. Louis city and county government: the mayor, the Board of Aldermen, St. Louis County Council, local elections, police and public safety policy, schools boards, and local taxes.",
    [KSDK("news/local"), KSDK("news/politics"), POST_DISPATCH_LOCAL],
  ),

  // Economy & money
  news(
    "economy-world",
    "Economy · World",
    "The global economy: other countries' economies, global markets, trade, oil and energy prices, and international companies.",
    [BBC("business"), NPR(1006)],
  ),
  news(
    "economy-us",
    "Economy · United States",
    "The US economy and markets: jobs, inflation, interest rates and the Federal Reserve, the stock market, big companies, housing, and prices people pay.",
    [NPR(1017), NPR(1006), PBS("economy"), CNBC(100003114), CNBC(20910258)],
  ),
  news(
    "economy-mo",
    "Economy · Missouri",
    "Missouri's economy: jobs and employers in Missouri, state taxes and budget, farming, energy and utility rates, and businesses opening or closing in Missouri.",
    [MO_INDEPENDENT, KSDK("money")],
  ),
  news(
    "economy-stl",
    "Economy · St. Louis",
    "The St. Louis-area economy: local employers, development projects, real estate, local businesses opening or closing, and costs for St. Louis residents.",
    [KSDK("money"), POST_DISPATCH_LOCAL, KSDK("news/local")],
  ),

  // Sports: leagues
  league("sports-nfl", "NFL", "football/nfl"),
  league("sports-nba", "NBA", "basketball/nba"),
  league("sports-mlb", "MLB", "baseball/mlb"),
  league("sports-nhl", "NHL", "hockey/nhl"),
  league("sports-cfb", "College Football", "football/college-football"),
  league("sports-cbb", "College Basketball", "basketball/mens-college-basketball"),
  league("sports-mls", "MLS", "soccer/usa.1"),
  league("sports-epl", "Premier League", "soccer/eng.1"),

  // Sports: teams (ESPN team ids or abbreviations)
  team("team-mizzou-football", "Mizzou Football", "football/college-football", "142"),
  team("team-mizzou-basketball", "Mizzou Basketball", "basketball/mens-college-basketball", "142"),
  team("team-blues", "St. Louis Blues", "hockey/nhl", "stl"),
  team("team-cardinals", "St. Louis Cardinals", "baseball/mlb", "stl"),
  team("team-packers", "Green Bay Packers", "football/nfl", "gb"),
  team("team-chiefs", "Kansas City Chiefs", "football/nfl", "kc"),
];
