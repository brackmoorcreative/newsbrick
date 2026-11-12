# NewsBrick

Get caught up on the news in under 60 seconds, one "brick" at a time.

```
GitHub Actions (daily, ~6am Central)
  └─ backend/  fetch RSS feeds → remove repeats → Gemini writes bricks → data/latest.json (committed to the repo)
                                                                              │
iPhone (Expo Go) ── app/ downloads latest.json once, caches it on the phone ──┘
```

## Folders

| Path | What it is |
|---|---|
| `backend/src/config.ts` | Categories, feeds, bricks per category, AI model, your reader profile |
| `backend/src/fetchFeeds.ts` | Reads RSS feeds (headlines and short descriptions only) and removes exact repeats |
| `backend/src/summarize.ts` | One Gemini call per category (free tier): picks top stories, merges duplicates, writes bricks |
| `backend/src/run.ts` | The daily job. Writes `data/latest.json` |
| `app/` | Expo (React Native) app |
| `.github/workflows/daily-bricks.yml` | Runs the backend every morning for free |

## Commands

```bash
# Backend (from backend/)
npm install
npm run dry-run        # no API key needed: tests feeds + output file
npm run build-bricks   # real run: needs a free GEMINI_API_KEY in backend/.env

# App (from app/)
npm install
npx expo start         # scan the QR code with your iPhone camera (Expo Go installed)
```

## Source terms

Only feed headlines and descriptions are used. Full articles are never fetched or republished. Every brick links to the original article and names its source.
