// The daily job: fetch feeds -> remove repeats -> Gemini writes bricks -> save data/latest.json
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "./config.ts";
import { fetchCategory } from "./fetchFeeds.ts";
import { modelsUsed, placeholderBricks, writeBricks, type Brick } from "./summarize.ts";

const dryRun = process.argv.includes("--dry-run");
const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../data");

if (!dryRun && !process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Add it to backend/.env, or run `npm run dry-run`.");
  process.exit(1);
}

// `--only=politics-mo,team-blues` runs just those categories (handy for testing).
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const categories = only ? CATEGORIES.filter((c) => only.includes(c.id)) : CATEGORIES;

// The free tier allows only so many requests per minute, so space the AI calls out.
const PAUSE_MS = 4000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const output: { id: string; title: string; bricks: Brick[] }[] = [];

for (const [i, category] of categories.entries()) {
  console.log(`\n${category.title}`);
  try {
    // Newest 60 items is plenty to pick from and keeps each AI request small.
    const items = (await fetchCategory(category.sources, category.maxAgeHours)).slice(0, 60);
    if (items.length === 0) throw new Error("no recent items from any source");
    if (!dryRun && i > 0) await sleep(PAUSE_MS);
    const bricks = dryRun ? placeholderBricks(category, items) : await writeBricks(category, items);
    console.log(`  -> ${bricks.length} bricks`);
    output.push({ id: category.id, title: category.title, bricks });
  } catch (err) {
    console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
  }
}

// Don't overwrite yesterday's good file with an empty one. (exitCode instead of
// process.exit() lets Node close network handles cleanly, avoiding a crash on Windows.)
if (output.every((c) => c.bricks.length === 0)) {
  console.error("\nNo bricks were made. Leaving data/latest.json unchanged.");
  process.exitCode = 1;
} else if (only) {
  // A partial test run must never replace the full edition.
  for (const c of output) {
    console.log(`\n== ${c.title}`);
    for (const b of c.bricks) console.log(`- ${b.headline} [${b.sources.map((s) => s.name).join(", ")}]`);
  }
  console.log("\n(--only test run: nothing saved)");
} else {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
  const file = {
    version: 1,
    date: today, // YYYY-MM-DD in Central time
    generatedAt: new Date().toISOString(),
    model: dryRun ? "dry-run" : [...modelsUsed].join(", "),
    categories: output,
  };

  // latest.json is today's edition; archive/ keeps every day for the app's calendar,
  // and index.json lists which days exist (newest first).
  const json = JSON.stringify(file, null, 2) + "\n";
  const archiveDir = path.join(dataDir, "archive");
  await mkdir(archiveDir, { recursive: true });
  await writeFile(path.join(dataDir, "latest.json"), json);
  if (dryRun) {
    // Placeholder text never goes into the archive.
    console.log(`\nSaved data/latest.json (${today}, dry run: archive untouched)`);
  } else {
    await writeFile(path.join(archiveDir, `${today}.json`), json);
    const dates = (await readdir(archiveDir))
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
    await writeFile(path.join(dataDir, "index.json"), JSON.stringify({ dates }, null, 2) + "\n");
    console.log(`\nSaved data/latest.json and data/archive/${today}.json (${dates.length} days archived)`);
  }
}
