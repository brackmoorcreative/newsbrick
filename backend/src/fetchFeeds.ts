import Parser from "rss-parser";
import { MAX_AGE_HOURS, type Source } from "./config.ts";

export type FeedItem = {
  source: string;
  title: string;
  url: string;
  snippet: string; // the feed's own short description, never the full article
  publishedAt: Date;
};

const parser = new Parser({
  timeout: 20_000,
  headers: { "User-Agent": "NewsBrick/0.1 (personal news digest; RSS reader)" },
});

// Several categories share a feed (e.g. BBC World), so each URL is downloaded once per run.
const cache = new Map<string, Promise<FeedItem[]>>();

function fetchSource(source: Source): Promise<FeedItem[]> {
  if (!cache.has(source.url)) {
    cache.set(source.url, source.type === "espn" ? fetchEspn(source) : fetchRss(source));
  }
  return cache.get(source.url)!;
}

async function fetchRss(source: Source): Promise<FeedItem[]> {
  const feed = await parser.parseURL(source.url);
  return feed.items.map((item) => ({
    source: source.name,
    title: clean(item.title ?? ""),
    url: item.link ?? "",
    snippet: clean(item.contentSnippet ?? item.content ?? "").slice(0, 500),
    publishedAt: new Date(item.isoDate ?? item.pubDate ?? 0),
  }));
}

// ESPN's news API returns JSON articles: headline, short description, link, publish date.
type EspnArticle = {
  type?: string;
  headline?: string;
  description?: string;
  published?: string;
  links?: { web?: { href?: string } };
};

async function fetchEspn(source: Source): Promise<FeedItem[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "NewsBrick/0.1" },
    signal: AbortSignal.timeout(20_000), // never wait forever on one feed
  });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  const { articles = [] } = (await res.json()) as { articles?: EspnArticle[] };
  return articles
    .filter((a) => a.type !== "Media") // video clips only, no written story
    .map((a) => ({
      source: source.name,
      title: clean(a.headline ?? ""),
      url: a.links?.web?.href ?? "",
      snippet: clean(a.description ?? "").slice(0, 500),
      publishedAt: new Date(a.published ?? 0),
    }));
}

// Fetch every source in parallel. One broken feed shouldn't sink the whole category.
export async function fetchCategory(sources: Source[], maxAgeHours = MAX_AGE_HOURS): Promise<FeedItem[]> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const results = await Promise.allSettled(
    sources.map(async (s) =>
      (await fetchSource(s)).filter((item) => item.title && item.url && item.publishedAt.getTime() >= cutoff),
    ),
  );
  const items: FeedItem[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`  ${sources[i].name}: ${result.value.length} recent items`);
      items.push(...result.value);
    } else {
      console.warn(`  ${sources[i].name}: FAILED (${result.reason})`);
    }
  });
  return dedupe(items).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

// Removes exact repeats (same link, or same headline). Merging the *same story from
// different outlets* is Claude's job, because those headlines are worded differently.
function dedupe(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const keys = [item.url.split("?")[0], normalize(item.title)];
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

// Strips HTML tags and turns entities like &mdash; or &#8217; into real characters.
function clean(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}
