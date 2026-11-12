// Mirrors the data/latest.json file the backend writes.

export type Brick = {
  id: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  explainer: string;
  keyTerms: { term: string; definition: string }[];
  disagreement: string | null;
  importance?: number; // 1-10, same scale across topics (missing in editions before Nov 12, 2026)
  image?: string | null; // photo from the news feed
  sources: { name: string; title: string; url: string }[];
};

export type CategoryBricks = {
  id: string;
  title: string;
  bricks: Brick[];
};

export type DailyBricks = {
  version: number;
  date: string; // YYYY-MM-DD, Central time
  generatedAt: string;
  model: string;
  categories: CategoryBricks[];
};
