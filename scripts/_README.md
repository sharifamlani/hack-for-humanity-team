# scripts/

Any command that gets run more than once lives here as a script. Each one prints what it
did and exits non-zero on failure.

| Script | What it does |
|---|---|
| `merge-candidates.mjs` | Merges `data/candidates/{federal,state,local}.csv` into `data/candidates.csv` |
| `build-candidates-json.mjs` | Turns that CSV into `data/candidates.json`, the file the app reads |
| `verify-candidates.mjs` | Checks every roster row has a source |
| `fill-campaign-urls.mjs` | Fills each candidate's `campaign_url` from the `campaign_home` pages in `data/candidates/sites/*.csv` (front page of the site; official government sites are never used). Run `pnpm data` after it |
| `verify-campaign-urls.mjs` | Checks every `campaign_url` answers; a dead address fails the run, a site that refuses scripts is listed for a check by hand |
| `scrape-positions.mjs` | Downloads the pages in `data/candidates/sites/*.csv` and saves their exact text as passages |
| `embed-positions.mjs` | Embeds passages and interview questions (`--check` prints the closest passages per question) |
| `build-stances.mjs` | Gemma 4 reads each candidate's closest passages and decides yes / no / none, with a word-for-word quote check (`--second-look` re-reads the empty cells) |
| `verify-stances.mjs` | Asserts every shown quote is on its page word for word; prints the coverage table |
| `verify-closest.mjs` | Flags "closest thing they've said" passages that may be someone else's words (attribution patterns, other candidates' names, long quotations) and fails unless each is reviewed in `data/positions/closest-review.json` |

| `smoke-concurrency.mjs` | N voters finishing the interview at once against `/api/place` (`--base`, `--n`, `--limit`); fails on any non-200 or a slow answer |
| `deploy-clean.mjs` | Deploys what is committed at HEAD from a temporary git worktree, so other sessions' unfinished edits never reach production (`--preview` for a preview URL) |

Order for the position data: scrape → embed → build-stances → verify-stances.
`pnpm data` runs the two candidate-roster scripts and is run automatically before `pnpm build`.
