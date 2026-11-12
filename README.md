# NewsBrick

Get caught up on the news in under 60 seconds, one "brick" at a time. For anyone, anywhere.

```
GitHub Actions (daily, ~6am Central)
  └─ backend/  world, region, US, and league feeds → Gemini writes bricks → data/ (committed)
                                                                              │
Cloudflare Worker (on demand)                                                 │
  └─ worker/   any place (Google News) or team (ESPN) → bricks, shared for the day
               + "why it matters to you" lines from the reader's quiz answers  │
                                                                              │
Phone (home-screen web app) ── app/ ─────────────────────────────────────────┘
```

## Folders

| Path | What it is |
|---|---|
| `backend/src/config.ts` | Daily topics and their feeds (world, regions, US, sports leagues) |
| `backend/src/fetchFeeds.ts` | Reads RSS feeds and ESPN (headlines, short descriptions, photos) and removes exact repeats |
| `backend/src/summarize.ts` | One Gemini call per topic (free tier): picks top stories, merges duplicates, scores importance |
| `backend/src/run.ts` | The daily job. Writes `data/latest.json`, `data/archive/`, `data/index.json` |
| `worker/src/index.ts` | On-demand service: places, teams, team search, and personalized "why it matters" |
| `shared/` | AI instructions and the league list, used by both the backend and the worker |
| `app/` | Expo (React Native) app, published to GitHub Pages |
| `.github/workflows/` | Daily stories job and app deploy |

## Commands

```bash
# Backend (from backend/)
npm install
npm run dry-run                                       # no API key needed: tests feeds + output file
npm run build-bricks                                  # real run: needs a free GEMINI_API_KEY in backend/.env
node --env-file=.env src/run.ts --only=top-world      # test a few topics; prints, never saves

# Worker (from worker/)
npx wrangler dev        # run locally (key in worker/.dev.vars)
npx wrangler deploy     # publish

# App (from app/)
npm install
npx expo start
```

## Source terms

Only feed headlines, descriptions, and photos are used. Full articles are never fetched or republished. Every brick links to the original article and names its source.
