// Mirrors the data/latest.json file the backend writes.

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
