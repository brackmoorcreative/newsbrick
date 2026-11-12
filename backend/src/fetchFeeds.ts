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

export async function fetchSource(source: Source): Promise<FeedItem[]> {
  const feed = await parser.parseURL(source.url);
  const cutoff = Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000;

  return feed.items
    .map((item) => ({
      source: source.name,
      title: clean(item.title ?? ""),
      url: item.link ?? "",
      snippet: clean(item.contentSnippet ?? item.content ?? "").slice(0, 500),
      publishedAt: new Date(item.isoDate ?? item.pubDate ?? 0),
    }))
    .filter((item) => item.title && item.url && item.publishedAt.getTime() >= cutoff);
}

// Fetch every source in parallel. One broken feed shouldn't sink the whole category.
export async function fetchCategory(sources: Source[]): Promise<FeedItem[]> {
  const results = await Promise.allSettled(sources.map(fetchSource));
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
