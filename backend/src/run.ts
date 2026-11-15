// The daily job: fetch feeds -> remove repeats -> Gemini writes bricks -> save data/latest.json,
// then refresh the weekly quiz.
//
//   node src/run.ts                  today's edition (skips if it already exists)
//   node src/run.ts --force          rebuild today's edition anyway
//   node src/run.ts --dry-run        no AI: placeholder text, never archived
//   node src/run.ts --only=a,b       just those categories; prints, never saves
//   node src/run.ts --quiz-test      write this week's quiz from the archive; prints, never saves
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "./config.ts";
import { fetchCategory } from "./fetchFeeds.ts";
import { modelsUsed, placeholderBricks, writeBricks, writeQuiz, type Brick } from "./summarize.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const quizTest = args.includes("--quiz-test");
// `--only=politics-us,sports-nfl` runs just those categories (handy for testing).
const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../data");
const archiveDir = path.join(dataDir, "archive");
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());

type Edition = { date: string; categories: { id: string; title: string; bricks: Brick[] }[] };

if (!dryRun && !process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Add it to backend/.env, or run `npm run dry-run`.");
  process.exit(1);
}

// Past editions, newest first (today's excluded).
async function pastEditions(days: number): Promise<Edition[]> {
  const dates = existsSync(archiveDir)
    ? (await readdir(archiveDir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10))
    : [];
  const wanted = dates.filter((d) => d < today).sort().reverse().slice(0, days);
  return Promise.all(wanted.map(async (d) => JSON.parse(await readFile(path.join(archiveDir, `${d}.json`), "utf8")) as Edition));
}

// ---------------------------------------------------------------- weekly quiz

// The quiz draws on the week's biggest shared stories (not reader-specific places or teams).
const QUIZ_TOPICS = /^(top-|politics-|economy-|region-|sports-top)/;

async function buildQuiz(editions: Edition[]) {
  const seen = new Set<string>();
  const stories = editions
    .flatMap((e) => e.categories.filter((c) => QUIZ_TOPICS.test(c.id)).flatMap((c) => c.bricks.map((b) => ({ ...b, date: e.date, topic: c.title }))))
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .filter((s) => !seen.has(s.headline.toLowerCase()) && seen.add(s.headline.toLowerCase()))
    .slice(0, 25);
  if (stories.length < 5) throw new Error("not enough stories this week for a quiz");
  console.log(`\nWeekly quiz (from ${stories.length} stories)`);
  const questions = await writeQuiz(stories);
  if (questions.length < 3) throw new Error("the AI returned too few usable questions");
  return { generatedAt: new Date().toISOString(), weekEnding: today, questions };
}

if (quizTest) {
  const quiz = await buildQuiz(await pastEditions(7));
  for (const q of quiz.questions) console.log(`\n${q.question}\n${q.options.map((o, i) => `  ${i === q.answer ? "*" : " "} ${o}`).join("\n")}\n  (${q.explanation})`);
  console.log("\n(--quiz-test: nothing saved)");
  process.exit(0);
}

// ---------------------------------------------------------------- today's edition

// GitHub's scheduler often starts late, so a second, backup run may come along. Today's
// edition already being saved means there's nothing to do (and no AI quota to spend).
if (!dryRun && !only && !force && existsSync(path.join(archiveDir, `${today}.json`))) {
  console.log(`Today's edition (${today}) is already built. Use --force to rebuild it.`);
  process.exit(0);
}

const categories = only ? CATEGORIES.filter((c) => only.includes(c.id)) : CATEGORIES;
// Yesterday's bricks per category, for "what's new since yesterday".
const [previous] = await pastEditions(1);
const yesterday = new Map(previous?.categories.map((c) => [c.id, c.bricks]) ?? []);

// The free tier allows only so many requests per minute, so space the AI calls out.
const PAUSE_MS = 4000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const output: { id: string; title: string; bricks: Brick[] }[] = [];

async function runCategory(category: (typeof CATEGORIES)[number]): Promise<boolean> {
  console.log(`\n${category.title}`);
  try {
    // Newest 60 items is plenty to pick from and keeps each AI request small.
    const items = (await fetchCategory(category.sources, category.maxAgeHours)).slice(0, 60);
    if (items.length === 0) throw new Error("no recent items from any source");
    if (!dryRun) await sleep(PAUSE_MS);
    const bricks = dryRun
      ? placeholderBricks(category, items)
      : await writeBricks(category, items, yesterday.get(category.id) ?? []);
    const updates = bricks.filter((b) => b.update).length;
    console.log(`  -> ${bricks.length} bricks (${bricks.filter((b) => b.image).length} with images, ${updates} updates)`);
    output.push({ id: category.id, title: category.title, bricks });
    return true;
  } catch (err) {
    console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

const failed: typeof categories = [];
for (const category of categories) {
  if (!(await runCategory(category))) failed.push(category);
}
// Busy spells on the free tier usually pass in a minute, so give failures one more try.
if (failed.length && !dryRun) {
  console.log(`\nRetrying ${failed.length} failed categories in 30s...`);
  await sleep(30_000);
  for (const category of failed) await runCategory(category);
}
output.sort((a, b) => CATEGORIES.findIndex((c) => c.id === a.id) - CATEGORIES.findIndex((c) => c.id === b.id));

// Don't overwrite yesterday's good file with an empty one. (exitCode instead of
// process.exit() lets Node close network handles cleanly, avoiding a crash on Windows.)
if (output.every((c) => c.bricks.length === 0)) {
  console.error("\nNo bricks were made. Leaving data/latest.json unchanged.");
  process.exitCode = 1;
} else if (only) {
  // A partial test run must never replace the full edition.
  for (const c of output) {
    console.log(`\n== ${c.title}`);
    for (const b of c.bricks) {
      console.log(`- [${b.importance}] ${b.headline}${b.image ? " (photo)" : ""}${b.update ? `\n    UPDATE: ${b.update}` : ""}`);
    }
  }
  console.log("\n(--only test run: nothing saved)");
} else {
  const file: Edition & { version: number; generatedAt: string; model: string } = {
    version: 1,
    date: today, // YYYY-MM-DD in Central time
    generatedAt: new Date().toISOString(),
    model: dryRun ? "dry-run" : [...modelsUsed].join(", "),
    categories: output,
  };

  // latest.json is today's edition; archive/ keeps every day for the app's calendar,
  // and index.json lists which days exist (newest first).
  const json = JSON.stringify(file, null, 2) + "\n";
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

    // A fresh quiz from the last 7 days, including today. A failure here never affects the edition.
    try {
      const quiz = await buildQuiz([file, ...(await pastEditions(6))]);
      await mkdir(path.join(dataDir, "quiz"), { recursive: true });
      await writeFile(path.join(dataDir, "quiz", "latest.json"), JSON.stringify(quiz, null, 2) + "\n");
      console.log(`Saved data/quiz/latest.json (${quiz.questions.length} questions)`);
    } catch (err) {
      console.error(`Weekly quiz skipped: ${err instanceof Error ? err.message : err}`);
    }
  }
}
