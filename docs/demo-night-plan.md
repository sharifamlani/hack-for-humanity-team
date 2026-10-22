# Demo Night plan — Thursday, Oct 22, 2026

**Event:** DeepStation *AI Demo Night*, The LAB Miami (2750 NW 3rd Ave #24, the same building
as the hackathon). Doors 6:00 PM, welcome 6:45, Demo 1 (red-teaming small open-weight models)
7:00, Demo 2 (OpenAI Codex) 7:30, **Demo 3 "to be announced" 7:50–8:35**, Q&A with all builders
8:35. Source: [Luma listing](https://luma.com/deepst-49cd), read 10:30 AM.

**Goal:** the live app holds up in front of ~200 ML engineers and red-teamers. That means no
claim on screen that a sharp viewer can knock down, a reason to care tonight (early voting is
open right now), and a presenter who has rehearsed against production.

**Baseline (walked on production at 10:27 AM, 1280px and 390px):** every step works. The venue
address resolves (FL-26 → FL-24, Dunbar K-8, precinct 535); a typed answer is read by Gemma 4
in ~5 s; the ballot opens with 16 match percentages; Gemma 4's placement lands ~20 s later; the
map loads; no console errors, no failed requests, no sideways scroll on a phone. Screenshots are
in `.playwright-mcp/dn-*.png` (local, gitignored).

## What the walk found, worst first

| # | Finding | Why it matters tonight |
|---|---|---|
| F1 | U.S. Senate, Ashley Moody, Flooding: *"Closest thing they've said"* is a quote **of Byron Donalds**. A scan of all 122 closest passages flags 16 more that name someone else or report speech (some false alarms; Salazar quoting an FWC director is real) | The app's whole claim is "their own words". One visible misattribution in front of a red-teaming crowd undoes it |
| F2 | U.S. Senate star goes to **Neil J. Gillespie (No Party) at 73%** on 3 positions, over Moody (record of 890 votes) and Nixon (6 positions) | First question from the floor: "why does it recommend someone nobody has heard of?" The arithmetic is honest; the star overstates it |
| F3 | Governor: **Jolly first, Donalds last**, six minor candidates in between | Looks broken. Roster order is used for display (`BallotStep.tsx`), not evidence |
| F4 | Race evidence grid escapes its column on desktop — runs from x≈497 to x≈1257, past the 1120px shell | Looks unfinished on a projector |
| F5 | Last "Got it" bubble in the typed interview sits under the sticky **See where I stand** button | Small, but it is the screen right before the reveal |
| F6 | ~20 s of "Gemma 4 is refining your matches…" with percentages shifting under it | Dead air on stage unless narrated or filled |
| F7 | Spoken answer through a real microphone on the live site **never tested by a person** | Voice is the most impressive beat and the least verified |

## Folder / file structure (paths this plan touches)

```
hack-for-humanity-team/
├── ROADMAP.md                          # Phase 6 rows, §0 banner, changelog, v2.4
├── docs/
│   ├── _README.md                      # index row for this file
│   ├── demo-night-plan.md              # this plan
│   └── demo-script.md                  # + "Demo Night" section: 2-min core, 7-min extended, Q&A prep
├── data/positions/
│   └── reviewed-out.json               # F1: misattributed closest passages added after human review
├── lib/
│   ├── questions.ts                    # F1: closestOf() skips reviewed-out passages
│   └── match.ts                        # F2: evidenceCount() helper for the star rule
├── components/
│   ├── BallotStep.tsx                  # F2 star rule + thin-evidence label; F3 scored-first order
│   ├── MatchStep.tsx                   # F4 evidence grid contained in its column
│   ├── InterviewStep.tsx               # F5 bottom padding under the last bubble
│   └── PollingStep.tsx                 # B1 "Early voting is open" banner; B3 QR card
├── app/page.tsx                        # B2 home countdown line; B4 footer "Grand Champion"
├── public/
│   └── qr-live-site.png                # B3 QR to the live URL (only if S2 passes)
└── scripts/
    ├── verify-closest.mjs              # F1: flags closest passages naming another person
    └── smoke-concurrency.mjs           # S2: N parallel /api/place calls against a base URL
```

## Flowchart — how the day runs

```
+-----------------------+     +---------------------------+
| S0 tag prod baseline  |---->| S1 prod walk (done 10:27) |
| demo-night-baseline   |     | all 4 steps green         |
+-----------------------+     +-------------+-------------+
                                            |
                                            v
                              +---------------------------+
                              | S2 Gemini quota: 10 x     |
                              | /api/place in parallel    |
                              +------+-------------+------+
                                pass |             | 429s / >60 s
                                     v             v
                          QR card is IN         QR card is OUT
                                     |             |
                                     +------+------+
                                            v
   +------------------- Phase A: truth fixes (spine, main session) ------------------+
   | F1 verify-closest.mjs -> human review -> reviewed-out.json -> closestOf() skips  |
   | F2 star rule (evidenceCount)   F3 scored-first order                            |
   +-----------------------------------------+---------------------------------------+
                                             |  pnpm build -> vercel --prod --yes
                                             v
   +------------- Phase B: tonight hooks (screen-builder agent, disjoint files) ------+
   | B1 early-voting banner (PollingStep)  B2 countdown (page.tsx)  B4 footer badge   |
   | B3 QR card (only if S2 passed)        F4 grid width  F5 bubble padding           |
   +-----------------------------------------+---------------------------------------+
                                             |  deploy
                                             v
   +--------------------------------+     +--------------------------------------+
   | S5 full prod walk, 1280 + 390  |---->| tag demo-night-final (code freeze)   |
   | console clean, F1-F5 gone      |     | 4:30 PM, nothing deploys after       |
   +--------------------------------+     +------------------+-------------------+
                                                             v
   +----------- Phase D: presenter (Sharif) -----------------------------------------+
   | real-mic test on prod -> script (2-min core + 7-min extended) -> rehearse x2     |
   | screen recording of the full path = last-resort fallback                         |
   +-----------------------------------------+---------------------------------------+
                                             v
                         6:00 doors -> 7:50 slot (if Demo 3) -> 8:35 Q&A
                                             v
                         ROADMAP flips + changelog (same night)
```

## UI wireframes

**1. Ballot race row: star rule (F2) and order (F3)** — `BallotStep.tsx`

```
BEFORE (U.S. Senate)                                AFTER
+------------------------------------------------+  +------------------------------------------------+
| U.S. Senate                See the evidence ↓  |  | U.S. Senate                See the evidence ↓  |
| [Republican] Ashley Moody  [Campaign] [49%]    |  | [Republican] Ashley Moody  [Campaign] [49%]    |
| [Democratic] Angie Nixon   [Campaign] [52%]    |  | [Democratic] Angie Nixon   [Campaign] [52%]    |
| [No Party]  Neil Gillespie [Campaign][★ 73%]   |  | [No Party]  Neil Gillespie [Campaign] [73%]  ← no star
+------------------------------------------------+  | Closest, on thin evidence (3 positions).       ← new line
                                                    +------------------------------------------------+
```

```
BEFORE (Governor)                                   AFTER
| [Democratic] David Jolly        [45%]          |  | [Democratic] David Jolly        [45%]          |
| [Libertarian] Scott Jewett      Official ↗     |  | [Republican] Byron Donalds      [45%]   ← scored rows first
| [No Party] Dean Ocean Abrams    Official ↗     |  | [Libertarian] Scott Jewett      Official ↗     |
| ... 4 more unscored ...                        |  | ... 5 more unscored, roster order ...          |
| [Republican] Byron Donalds      [45%]          |  | Too close to call between the top two.         |
| Too close to call between the top two.         |  |                                                |
```

Scored rows keep roster order among themselves, so rows do not jump when Gemma 4's placement
arrives 20 s later.

**2. Race evidence grid (F4)** — `MatchStep.tsx`

```
BEFORE (1280px)                                       AFTER
|<-- 1120 shell -->|                                  |<-- 1120 shell -->|
+------+----------------------------------------->    +------+---------------------------+
| addr | Moody | Nixon | Gillespie  (runs to 1257px)  | addr | Moody | Nixon | Gillespie |
| card |                                    ^         | card |  (columns shrink to fit)  |
+------+------------------------------------|         +------+---------------------------+
                               escapes the shell
```

**3. Interview, last answer (F5)** — `InterviewStep.tsx`

```
BEFORE                                        AFTER
| Should Congress spend more on transit?|     | Should Congress spend more on transit?|
|                                 [Yes] |     |                                 [Yes] |
| Got it — counting that as YE ▓▓▓▓▓▓▓▓ |     | Got it — counting that as YES on      |
| [====== See where I stand ▶ ======]   |     |   transit.                            |
|  ⚡ Gemma 4 reads your answers · 10   |     |                                       | ← bottom padding
                                              | [====== See where I stand ▶ ======]   |
```

**4. Voting plan: early voting is open (B1) + QR (B3)** — `PollingStep.tsx`

```
BEFORE                                         AFTER
| Make your voting plan.                 |     | Make your voting plan.                         |
| Your next step, clearly laid out.      |     | +--------------------------------------------+ |
| +--------------+ +-------------------+ |     | | ● EARLY VOTING IS OPEN TODAY               | | ← new, mint
| |  [map]       | | Early voting      | |     | |   Through Sun, Nov 1 · 11 days left.       | |
| |  Dunbar K-8  | | nearby            | |     | |   Nearest: Stephen P. Clark Gov. Center    | |
| |  Precinct 535| | Clark Center 1.9mi| |     | +--------------------------------------------+ |
| +--------------+ +-------------------+ |     | +--------------+ +---------------------------+ |
                                               | |  [map]       | | Early voting nearby       | |
                                               | |  Dunbar K-8  | | ...                       | |
                                               | +--------------+ +---------------------------+ |
                                               | +-----------+                                  |
                                               | | [QR code] |  Try it on your phone:          | ← only if S2 passes
                                               | +-----------+  hack-for-humanity-team...app   |
```

The banner reads the dates from the county's own early-voting data (`opens` / `closes` in
`lib/arcgis.ts`), so it says "closed" by itself after Nov 1. Hidden if the dates are missing.

**5. Home hero line (B2) and footer (B4)** — `app/page.tsx`

```
BEFORE                                              AFTER
| ...and where you vote on Tuesday, Nov 3.   |      | ...and where you vote on Tuesday, Nov 3.   |
|                                            |      | 12 days away · early voting is open now.   | ← new
footer: A match, not an endorsement · Open    footer: ... · 🏆 Grand Champion, Hack for Humanity:
        source, MIT · Hack for Humanity: Miami        Miami 2026
        2026
```

| UI piece | BEFORE | AFTER |
|---|---|---|
| Race star | Highest % always starred | Starred only with ≥4 positions from votes or own words; else "Closest, on thin evidence (n)" |
| Race row order | Roster order | Scored candidates first (roster order among them), then unscored |
| "Closest thing they've said" | Any passage above similarity 0.73 | Passages flagged and reviewed out are skipped |
| Evidence grid | Escapes the shell | Fits the right column |
| Interview end | Last bubble under the button | Padding clears it |
| Voting plan top | Map + early-voting list | Mint "Early voting is open" banner above |
| QR | None | Card on voting plan, only if S2 passes |
| Home hero | Date only | "12 days away · early voting is open now." |
| Footer | Event credit | + "Grand Champion" |

## Derisking — smokes in dependency order

| # | What it proves | Command | Expected | If it fails → |
|---|---|---|---|---|
| S0 | There is a known-good production to roll back to | `git tag demo-night-baseline d2ef280 && git push origin demo-night-baseline` | Tag on remote | Fix push auth before touching code |
| S1 | Production works today, before any change | Playwright walk of the venue address, 1280px (done 10:27 AM) | 4 steps, 16 match %, no console errors | Already green — evidence in `.playwright-mcp/dn-*.png` |
| S2 | The Gemini key survives a room trying it at once | `node scripts/smoke-concurrency.mjs --base https://hack-for-humanity-team.vercel.app --n 10` | `10/10 ok`, slowest under 60 s, zero 429 | Drop the QR (B3); say "try it after" instead of "try it now" |
| S3 | F1: no closest passage on screen names another person | `node scripts/verify-closest.mjs` | `0 flagged` (after review) | Add the flagged passage to `reviewed-out.json`, rerun |
| S4 | The build is clean after Phase A + B | `pnpm build && pnpm lint` | Build succeeds, 0 lint errors | Fix before deploying; nothing deploys red |
| S5 | **End to end on production after every change** | Playwright walk, venue address, 1280px and 390px | U.S. Senate shows no star on Gillespie; Governor shows Donalds second; Moody's flooding cell shows no Donalds quote; banner reads "11 days left"; no console errors, no 4xx/5xx, no sideways scroll | Roll back: `vercel promote` the baseline deployment, then fix |
| S6 | A person's voice reaches the live app | Sharif, laptop mic, prod URL, **Ask me**, answer Q1 aloud | Answer transcribed and recorded as Yes/No within ~5 s | Demo uses typing + taps; voice is mentioned, not shown |
| S7 | Ground truth: the screen's claims match the data | Spot-check 3 quotes on screen against their **View source** pages in a browser | Each quote found word for word on its page | Remove that passage; rerun S3 + S5 |

## Implementation steps

| Time (EDT) | Step | Owner | Rows |
|---|---|---|---|
| 10:45 | S0 tag, S2 concurrency smoke (decides QR) | main session | 6.1–6.2 |
| 11:00–12:30 | Phase A truth fixes F1–F3, deploy, S3 + S5 | main session (spine) | 6.3–6.7 |
| 12:30–1:45 | Phase B hooks B1–B4 + F4–F5, deploy, S5 | `screen-builder` agent on disjoint files | 6.8–6.13 |
| 1:45–2:30 | S5 full walk on prod, S7 ground truth | `demo-verifier` + main | 6.14–6.15 |
| 2:30–4:00 | Script, S6 mic test, rehearse ×2 timed | **Sharif** | 6.16–6.19 |
| 4:30 | **Code freeze**, tag `demo-night-final`, screen recording | main | 6.20–6.21 |
| after 9:30 PM | ROADMAP flips, changelog | main | 6.22 |

**Deliberately not doing today:** renaming the repo, Vercel project or package from "305
Votes" (a URL change on demo day breaks links people already have); new data collection;
any change to the scoring formula beyond the star rule.
