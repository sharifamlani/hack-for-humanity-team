# Plan — 305 Votes pivot: Miami questions, candidates' own words, Gemma 4 decides

## Context

At ~1:00 PM the team changed the method. The voice interview, ballot and polling place stay.
What changes is **what we ask and how we match**:

- **Drop** the roll-call scaling (Bafumi–Herron, Voteview cutpoints, the left–right chart).
- **Ask Miami / South Florida questions** instead of questions about federal bills.
- **Collect candidates' own words** — campaign sites, official sites, press releases/speeches.
- **Match with embeddings (cosine similarity)** to find what each candidate said on each
  question, then **Gemma 4 reads those passages and decides** the candidate's position.

Why it is better for this event: the old method could only place people who have voted in
Congress, so for the venue's own district (FL-24) **both candidates showed "not enough public
record"**. The new one works for challengers, and the questions are about Miami.

**Clock: it is 1:15 PM. Build ends 3:30, submit 3:45.** This plan fits only with the scope
below. The working roll-call version is live now (`a58b9c7`) and gets tagged first, so there
is always something to demo.

(This replaces the 12:20 "evidence file" plan that was in this file; that plan was never
built — there is no `data/evidence.csv` in the repo.)

## Scope decisions (made so we can start; say so if any is wrong)

| Question | Decision | Why |
|---|---|---|
| Which candidates | **U.S. House, FL-24 to FL-28 — 13 people.** U.S. Senate (3) only if time | 64 people are on the roster; 13 is what fits |
| Where their words come from | Campaign site + official house.gov site + their press-release/news pages | "Speeches" = press releases today; video and transcripts don't fit |
| Website addresses | **None are in our data (0 of 64 have a `campaign_url`).** One agent finds them now; teammates add more to the same file | Blocking — nothing can be scraped without them |
| When Gemma decides | **Before the demo, by script** — not live | 13 × 6 = 78 readings at ~8 s each; live it would stall and could fail on stage |
| Question format | **Miami-specific and still yes/no-able**, with room to explain out loud | Keeps the voice flow and the Yes/No buttons the team asked to keep |
| Embedding model | `gemini-embedding-2` (closed-weight; no open one on this key) | It only *finds* passages. **Gemma 4 makes every decision.** Disclosed in README |
| The match | Issue by issue: agrees / differs / no public position, each with the candidate's quote and link | No left–right score; nothing is shown without a source |

### Two ways in (added 1:20 PM)

The interview step opens with a choice:

| Mode | What happens | How the match is made |
|---|---|---|
| **"Ask me"** (guided) | The AI asks the 6 Miami questions out loud; you answer by voice or Yes/No | Your answers vs each candidate's pre-read position — the grid below. **Built first; this is the demo path** |
| **"I'll tell you what I care about"** (open) | You talk freely about what you're passionate or curious about; the AI asks one follow-up | Live: your words are embedded, cosine similarity pulls each candidate's closest passages, and Gemma 4 writes what each has said about *your* topic, with quotes and links. No agree/differ mark unless you stated a clear position |

The open mode reuses the same scraped passages and embeddings, plus one live step
(`/api/ask`). It is **built second and is the first thing cut** if the guided path is not
finished by 2:35.

**Guardrail that replaces the old math:** a candidate's position is shown only if Gemma's quote
is found **word-for-word** in the scraped page. Otherwise the cell reads "No public position
found". The app still describes and never recommends.

## Folder structure

```
.
├── data/
│   ├── candidates/sites.csv          # NEW  candidate_id, url, kind, found_by
│   ├── questions.json                # NEW  6 Miami questions, 2 per theme (human-reviewed)
│   ├── positions/
│   │   ├── _README.md                # NEW  what these files are; the word-for-word rule
│   │   ├── chunks.json               # NEW  scraped passages: candidate, url, text
│   │   ├── embeddings.json           # NEW  one vector per passage and per question
│   │   └── stances.json              # NEW  candidate × question: yes/no/none + quote + url + similarity
│   └── items.json                    # DELETE (roll calls)
├── scripts/
│   ├── scrape-positions.mjs          # NEW  fetch sites.csv pages + issue/news links → chunks.json
│   ├── embed-positions.mjs           # NEW  embed passages + questions → embeddings.json
│   ├── build-stances.mjs             # NEW  cosine top passages → Gemma 4 decides → stances.json
│   ├── verify-stances.mjs            # NEW  every quote word-for-word in its page; coverage table
│   ├── build-items.mjs               # DELETE
│   └── smoke-scale.mjs               # DELETE
├── lib/
│   ├── questions.ts                  # NEW  replaces items.ts (questions, themes, stances)
│   ├── match.ts                      # NEW  agreement count per candidate (plain arithmetic)
│   ├── items.ts, scale.ts            # DELETE
│   └── gemma.ts                      # reuse as is (GEMMA_MODEL only, drops thought parts)
├── app/api/
│   ├── interview/route.ts            # EDIT  read an answer against a Miami question, not a bill
│   ├── explain/route.ts              # EDIT  compare the voter's words with candidates' quotes
│   └── lookup/, voice-token/         # unchanged
├── components/
│   ├── VoiceInterview.tsx            # EDIT  swap ITEMS for questions; drop bill links
│   ├── InterviewStep.tsx             # EDIT  same swap (typed fallback)
│   ├── MatchStep.tsx                 # REWRITE  issue-by-issue grid with quotes
│   └── BallotStep, PollingStep, StepBar   # unchanged
└── docs/build-plan.md, ROADMAP.md, README.md   # updated to the new method
```

Reused as built: `lib/gemma.ts`, `lib/liveVoice.ts`, `/api/lookup`, `/api/voice-token`,
`parseCsv` in `scripts/merge-candidates.mjs`, the ballot and polling screens.

## Flowchart

```
BEFORE THE DEMO (scripts, run once, results committed)
[agent + teammates] --> data/candidates/sites.csv
                              |
                 scrape-positions.mjs  --> chunks.json   (passages, each with its URL)
                              |
[questions.json] --> embed-positions.mjs --> embeddings.json
                              |
          for each candidate x question:
          cosine similarity --> top 4 passages --> Gemma 4: "yes / no / no clear position
                                                             + the exact sentence"
                              |
                 quote found word-for-word in the page?  --no--> "no public position"
                              | yes
                        stances.json  --> verify-stances.mjs (coverage table)

ON STAGE
[address] --> /api/lookup --> district --> the House candidates on that ballot
[voice interview: 6 Miami questions] --> Gemini Live speaks and hears
          each answer --> /api/interview --> Gemma 4 records yes / no / not sure
                              |
        lib/match.ts: voter's answer vs stances.json   (a count, no model)
                              |
   [Match screen] --tap a cell--> /api/explain --> Gemma 4 writes the comparison
                              |                     from the voter's words + the quote
                        [Polling place]
```

## UI wireframes

**Interview start (step 3) — new chooser**
```
BEFORE                                   AFTER
| Let's talk it through              |  | How do you want to do this?        |
| I'll ask you out loud about 6      |  | +--------------------------------+ |
| things Congress really voted on.   |  | | 🎙 Ask me                      | |
|          ( 🎙 Start )              |  | | 6 quick Miami questions        | |
| I'd rather type                    |  | +--------------------------------+ |
|                                    |  | +--------------------------------+ |
|                                    |  | | 💬 I'll tell you what I care   | |
|                                    |  | | about — talk about anything    | |
|                                    |  | +--------------------------------+ |
|                                    |  | I'd rather type                    |
```
Open mode result (replaces the grid for that mode):
```
| You talked about: rent, your abuela's flood insurance      |
| Brown   "…exact sentence…" [site↗]                         |
| Gilbert "…exact sentence…" [site↗]                         |
| ⚡ Gemma 4: what each has said about this, in plain words   |
| ◌ shown when a candidate has nothing close to your topic   |
```

**Guided interview — only the words change**
```
BEFORE                                   AFTER
| 🌊 WATER·AIR·LAND·FIRE       1 of 6 |  | 🌊 WATER·AIR·LAND·FIRE       1 of 6 |
|            ( 🗣️ )                   |  |            ( 🗣️ )                   |
| Would you vote yes on a bill that  |  | Sunny-day flooding keeps closing   |
| creates a center to predict        |  | Miami streets. Should government   |
| wildfires…?                        |  | spend more to raise roads and fix  |
| ▸ Real vote: H.R. 471 ⓘ            |  | drains here?                       |
| [Yes][No][Not sure][Skip]          |  | [Yes][No][Not sure][Skip]          |
| chips: H.R. 471: Yes ✓             |  | chips: Flooding: Yes ✓             |
```

**Match (step 4) — rewritten**
```
BEFORE                                   AFTER
| Where you stand                    |  | Where you stand                    |
| ◀ left ............... right ▶     |  | U.S. House · FL-24                 |
| 🌊  ──[●YOU]──────A──              |  |               Brown     Gilbert    |
| 🐢  ──[●YOU]───A─────              |  | 🌊 Flooding    ✓ agree  ◌ none     |
| 🎓  (answer 2 to place you)        |  | 🌊 Heat        ✗ differ ✓ agree    |
| ◌ Brown — not enough record        |  | 🐢 Everglades  ◌ none   ✓ agree    |
| ◌ Gilbert — not enough record      |  | 🐢 Biscayne    ✓ agree  ✓ agree    |
|                                    |  | 🎓 Housing     ✗ differ ✓ agree    |
|                                    |  | 🎓 Jobs        ◌ none   ◌ none     |
|                                    |  | Lines up with you on:              |
|                                    |  |  Brown 2 of 4 · Gilbert 4 of 4     |
|                                    |  |  (only issues they've spoken on)   |
```
Tap a cell:
```
| 🌊 Heat — Brown ✗ differs                       |
| You said: "outdoor workers need water breaks"   |
| Brown: "…exact sentence from her site…" [site↗] |
| ⚡ Gemma 4: short plain comparison              |
```
(Names and marks above are layout placeholders, not findings.)
States: ✓ agrees · ✗ differs · ◌ no public position found · — you skipped · loading
("Gemma 4 is reading…") · explanation failed → the quote and link still show.

| UI piece | BEFORE | AFTER |
|---|---|---|
| Question text | Federal bill wording | Miami-specific question |
| Bill details / roll-call links | Shown | Removed |
| Answer chips | Bill number | Short issue name |
| Match chart | Left–right lines, sitting members only | Issue grid, every House candidate on the ballot |
| "Not enough record" | Whole candidates | Single cells, only where nothing was found |
| Evidence | Vote list | Candidate's own sentence + link |
| Method note | Voteview explanation | "From candidates' own websites. Gemma 4 read them. Quotes are exact." |

## Derisking — smokes in dependency order

| # | What it proves | Command | Expected | If it fails → |
|---|---|---|---|---|
| 0 | We can always fall back | `git tag roll-call-version && git push --tags` | tag visible on GitHub | — |
| 1 | We have somewhere to scrape | `node scripts/verify-stances.mjs --sites` | `OK: 13 candidates, >=10 with a URL` | Demo only the districts that have URLs |
| 2 | The sites give real text | `node scripts/scrape-positions.mjs` | `wrote chunks.json: N passages from >=10 candidates` | A site that returns no text gets pasted text from a teammate, or is marked none |
| 3 | Cosine search finds the right passage | `node --env-file=.env scripts/embed-positions.mjs --check` | top passage for the flooding question is about flooding | Fix chunking before any Gemma call |
| 4 | Gemma's readings are sourced | `node --env-file=.env scripts/build-stances.mjs && node scripts/verify-stances.mjs` | `OK: 0 quotes missing from source` + coverage table | A failing cell becomes "none"; drop a question nobody has spoken on |
| 5 | The app builds on the new data | `pnpm build && vercel --prod --yes` | `Compiled successfully`, URL 200 | Fix; old version still tagged |
| 6 | **End to end on the live site** | Venue address → voice interview → match → polling, timed | under 2:00, a quote with a working link on screen | `vercel rollback` to the roll-call version |

Ground truth after smoke 6: a teammate opens three quoted links and confirms the sentence is
on the page and means what the cell says.

## Implementation steps

1. **1:20** Tag the working version (smoke 0). Dispatch one agent to fill
   `data/candidates/sites.csv` for the 13 House candidates (campaign + official + news pages).
2. **1:20–1:40** While it runs: write the scripts; draft 8 candidate questions (2–3 per theme)
   with Gemma 4, Miami-specific and yes/no-able.
3. **1:40–2:00** Smokes 1–3. Pick the **6 questions with the best coverage**.
4. **2:00–2:20** Smoke 4. A teammate starts spot-checking quotes. Dispatch `submission-scribe`
   for the README (track, all three models and what each does, every data source, how to run).
5. **2:20–2:50** Swap the interview to the new questions, rewrite the match screen, update the
   two Gemma routes, delete the roll-call files. Smoke 5. **Feature freeze 2:50.**
6. **2:50–3:30** Smoke 6 twice, demo script, ROADMAP + docs, submit by 3:30.

Open mode adds `app/api/ask/route.ts` (embed the voter's words → cosine over
`embeddings.json` → Gemma 4 summary with exact quotes) and a chooser + result view in
`VoiceInterview.tsx` / `MatchStep.tsx`. It slots into step 5 after the guided path works.

**Cut order:** open "tell me what you care about" mode → U.S. Senate → live Gemma explanation (quotes still show) → districts with thin
data. **Abort rule:** if smoke 4 has not passed by 2:30, stop and demo the tagged roll-call
version — it works today.

## Risks to say out loud

- **Thin challenger websites.** Some cells will read "no public position found". That is
  honest, but a mostly empty grid is a weak demo — coverage decides which district we demo.
- **Gemma misreading a candidate** is the reputational risk. Mitigations: the word-for-word
  quote check, a link on every cell, a human spot-check, and "none" whenever in doubt.
- **We give up a verified method.** The scaling recovered real members within 0.14 of their
  published scores. The new match is a count of agreements, not a measured position — the
  README must not oversell it.
- **Three models on stage** — Gemini Live (voice), `gemini-embedding-2` (finding passages),
  Gemma 4 (every decision). Only Gemma is open-weight; the README must say exactly this.
- **2 hours 15 minutes** for a method change, with no slack for a second pivot.
