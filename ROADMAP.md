# ROADMAP — Hack for Humanity: Miami

**Version:** v2.2
**Canonical execution directive for this repo.** If any other doc disagrees with this file,
this file wins or the other doc gets corrected.

---

## §0 — You are here

**🏆 GRAND CHAMPION — Hack for Humanity: Miami, Saturday Oct 10, 2026.** The event is over and the build won the top prize. **Next unblocked:** keep the repo public (required to stay prize-eligible); follow up on the commercialization invitation. Everything below this line is the record of the build day.

**Current phase:** Phase 2 — Build (Saturday Oct 10, 2026). **Live site: https://hack-for-humanity-team.vercel.app** — **final UI live at 3:15 PM** (dark theme from the team mockups on all five screens; app renamed **Your Ballot, Your Block** at 3:19 PM). Underneath: the full pivot is deployed (208fe61): Miami questions, voice interview, candidates' own words with quotes, one left–right line per race (votes, donors, or a checked Gemma 4 estimate), a suggested ballot, and the voter's dot placed by Gemma 4 from the conversation. The roll-call version is tagged `roll-call-version`. **Next unblocked:** one timed rehearsal of `docs/demo-script.md` on the live site in a real browser with a microphone, teammate names in README, submit on OrganizerHQ by 3:45.

- **Done:** repo skeleton — MIT license, docs, ignore rules (`87bc02e`, 2026-10-09).
- **Done:** public repo live at **https://github.com/sharifamlani/hack-for-humanity** —
  GitHub reports `visibility: PUBLIC`, `license: MIT`. Submission requirement satisfied.
  Smokes S1 + S2 green.
- **Next unblocked:** rows 0.7–0.10 — idea shortlisting and, most importantly, **verifying
  data sources tonight** (row 0.10 / smoke S5). Smoke S3 green; S4 needs a key in `.env`.
  Note: git is 2.28.0 (2020) — fine for the event, worth upgrading someday, not tonight.
- **✅ RESOLVED (was P0):** `GEMINI_API_KEY` is set and **verified working** — 62 models
  visible, **Gemma 4 reachable** (`gemma-4-31b-it`, `gemma-4-26b-a4b-it`), real completion
  returned. **Smoke S4 PASS.** Two traps found and documented in `docs/gemma4-integration.md`:
  the `.env` default `GOOGLE_MODEL` is **closed-weight Gemini** and would silently forfeit
  Challenges 2+3, and Gemma 4 returns its **reasoning as a `thought: true` part** that a naive
  parse renders on screen.
- **Only open item before kickoff:** add one line to `.env` — `GEMMA_MODEL=gemma-4-31b-it`.
- **⚠️ Teams lock at 10:45 AM** and **OrganizerHQ check-in at the door is required to submit
  and to win.** Neither is recoverable later.
- **Idea on the table:** GOTV Miami + voter ideal-point scaling — evaluated, data paths
  verified, see `docs/idea-gotv-miami.md`. Leans **Data to Action**.
- **Open decision for Sharif:** confirm the scope cut (one product, not three), and the team
  roster (rows 1.1, 0.8).
- **Prep checklist:** `docs/pre-event-checklist.md` (P0–P3, ordered by cost of skipping).
- **✅ RESOLVED (was P0):** Claude Code CLI updated **2.1.123 → 2.1.296**. `--bg`,
  full `claude agents`, `attach`/`logs`/`stop`/`respawn`, cross-session messaging, `/subtask`
  and dynamic workflows all verified present. See `docs/parallel-build-playbook.md`.
- **Team:** **4 people** — Sharif + 3 teammates (row 0.8 revised 2026-10-10 at the event).
- **Submission repo:** https://github.com/sharifamlani/hack-for-humanity-team — created inside
  the build window; `sharifamlani/hack-for-humanity` stays as the pre-event research notebook.
- **Blocked until Saturday 10:45 AM EDT:** every row in Phase 2 and later. Application
  code may not be written before the build window opens (MLH rule).

---

## §1 — The constraint that shapes everything

**~4h45m of build time, and the last 15 minutes of it are the submission scramble.**

| Time (EDT), Sat Oct 10 | Phase |
|---|---|
| 10:00–10:45 | Check-in + opening remarks → **Phase 1: lock the idea** |
| 10:45–12:30 | **Phase 2: thin end-to-end slice running** |
| 12:30–14:30 | **Phase 3: make the AI load-bearing + make it look real** |
| 14:30–15:15 | **Phase 4: demo rehearsal + README** |
| 15:15–15:45 | **Phase 5: submit (hard deadline 3:45 PM)** |
| 15:45–16:30 | Demos — 2 minutes |

---

## §2 — Phase 0: Pre-build setup (allowed before the event)

| # | Row | Status |
|---|---|---|
| 0.1 | `LICENSE` — MIT, OSI-approved (submission requirement) | ✅ 2026-10-09 · `87bc02e` |
| 0.2 | `.gitignore` — secrets, agent tooling, deps, build output | ✅ 2026-10-09 · `87bc02e` |
| 0.3 | `.env.example` — tracked template, no real keys | ✅ 2026-10-09 · `87bc02e` |
| 0.4 | `CLAUDE.md` — repo purpose, event rules, working agreements | ✅ 2026-10-09 · `87bc02e` |
| 0.5 | `docs/hackathon-brief.md` — verified rules/schedule/judging | ✅ 2026-10-09 · `87bc02e` |
| 0.6 | **Create public GitHub repo + push** (required for submission) | ✅ 2026-10-09 · `bc36250` · [repo](https://github.com/sharifamlani/hack-for-humanity) |
| 0.7 | `docs/idea-shortlist.md` — 2–3 candidates per track, scored | 🟡 data sources verified; **ideas + track still unchosen** |
| 0.8 | Confirm team roster (1–4 people) and who demos | ✅ **team of 4** (Sharif + 3); demoer TBD |
| 0.9 | Verify tooling on the laptop that will be used: `node -v`, `pnpm -v`, `git push` auth, API keys live | 🟡 node/pnpm/git + push auth ✅ (S1, S3); API keys still unverified (S4) |
| 0.10 | Read the data sources for the top-2 ideas — confirm each endpoint actually returns data **before** the build day | ✅ 2026-10-09 — 13 probed, 11 live · `docs/data-sources-verified.md` |

> Row 0.10 is the highest-value pre-build row. The classic hackathon loss is discovering at
> 1 PM that the open-data API you planned the whole project around is dead, rate-limited,
> or returns 2019 data. Checking an endpoint is reading docs, not writing code — allowed.

## §3 — Phase 1: Lock the idea (10:20–10:45)

| # | Row | Entry gate | Status |
|---|---|---|---|
| 1.1 | Pick the track | Opening remarks heard (sponsors sometimes add constraints) | ⏸ |
| 1.2 | Pick ONE idea from the shortlist | 1.1 | ⏸ |
| 1.3 | Write `docs/demo-script.md` — the 2-minute demo, in sentences, **before any code** | 1.2 | ⏸ |
| 1.4 | Cut the idea down to what those sentences actually require | 1.3 | ⏸ |

> 1.3 is non-negotiable and it comes before code. The demo script is the spec. If a feature
> is not spoken aloud in the script, it does not get built.

## §4 — Phase 2+: Build (10:45 onward)

Rows are written at the event once the idea is locked — a roadmap for an unchosen idea is
fiction. The shape is fixed, though:

| # | Row | Status |
|---|---|---|
| 2.1 | Framework `init` + first commit (timestamped inside the build window) | ⏸ |
| 2.2 | Deploy the empty app to a public URL immediately — never deploy for the first time at 3 PM | ⏸ |
| 2.3 | Thinnest end-to-end slice: real input → real data → real AI → real output on screen | ⏸ |
| 3.x | Make the AI load-bearing; make one screen look finished | ⏸ |
| 4.1 | Demo rehearsal against the **deployed** URL, timed, twice | ⏸ |
| 4.2 | README "The problem" / "What we built" / "How it works" filled in | ⏸ |
| 5.1 | Repo public, MIT license present, submission form in by **3:45 PM** | ⏸ |

## §5 — Derisking: the smoke ladder

Ordered by dependency — each smoke is meaningless to interpret if the one above it is broken.

| # | What it proves | Command | Expected | If it fails → | Result |
|---|---|---|---|---|---|
| S1 | Git identity + push auth work from this machine | `git push -u origin main` | Branch published, no credential prompt | Fix GitHub auth **Friday night**, not Saturday | ✅ pushed clean as `sharifamlani` |
| S2 | The repo is publicly visible (submission requirement) | `curl -s https://api.github.com/repos/sharifamlani/hack-for-humanity` | `private: false` and `license: MIT` | Flip visibility to public in GitHub settings | ✅ HTTP 200 unauthenticated; `private: False`, `license: MIT` |
| S3 | Toolchain is live | `node -v && pnpm -v && git --version` | Three version strings, no errors | Install/repair before Saturday | ✅ node v22.14.0 · pnpm 10.28.2 · git 2.28.0 |
| S4 | The LLM key actually works | One minimal authenticated **Gemini API / Gemma 4** call | HTTP 200 with a completion | Get a Gemini key — it gates two prize categories | ✅ **PASS** — auth 200, 62 models, `gemma-4-31b-it` returned a real completion, `finishReason: STOP` |
| S5 | The chosen Miami data source returns usable data | `curl` the endpoint, inspect the payload | Non-empty, recent, parseable records | Fall back to the #2 idea — this is why there is a #2 idea | ✅ 311 = 343,851 rows, CORS `*`; NWS/NHC/USGS/FEMA/iNat live. Census needs a key |
| S6 | The app deploys to a public URL from a clean clone | Deploy the empty scaffold at ~11 AM | Live URL loads | Debug deploy at hour one, when it is cheap | ⏸ |
| S7 | **End-to-end: the demo script runs start to finish on the deployed URL** | Walk the script, timed | Under 2:00, no dead ends, no console errors | Cut scope until it passes | ⏸ |

S1–S5 run **Friday night**. S6–S7 run at the event. S7 is the last smoke and it runs
against production, not localhost.

---

## §6 — Changelog

- **2026-10-10 (night) — first post-event change** — **Ballot buttons open the candidate's campaign website.** Every candidate row now has a link: "Campaign site" when we hold their campaign site, otherwise "Official listing" (the filing that puts them on the ballot); ballot questions keep "Source". Scored candidates used to show only a percentage and no link; they now show both. 33 of 81 people on the roster have a campaign site, taken from the `campaign_home` pages already collected for the position data (`scripts/fill-campaign-urls.mjs`); `scripts/verify-campaign-urls.mjs` reports 28 answering and 5 refusing a script, and those 5 load with the right page title in a real browser. At the venue address: 16 campaign-site buttons, 17 official listings, 13 ballot-question sources. Not done: the 48 people with no campaign site on file (six minor Governor candidates, Uthmeier, sitting House members whose only collected site is their official one, judges, county and city offices) still open the official listing. Event-day versions are tagged `submission-deadline`, `judged-demo` and `event-day-final`; this and everything after it is post-event work.
- **2026-10-10 (evening)** — **README team section filled in:** Sharif Amlani, Sandy Denis, Vania Arredondo and Schneur Werde, with LinkedIn links for the three teammates. Closes the last of the five required README sections.
- **2026-10-10 (evening)** — **🏆 Grand Champion.** "Your Ballot. Your Block." won the top prize at Hack for Humanity: Miami, as reported by Sharif from the venue. Team of four. Phase 5 (submit) and the demo are closed. Still open after the event: README team names; statewide candidates have only two quoted positions, so their matches rest mostly on party guess and donor score; the spoken-answer path was never tested through a real microphone by this session; repo, Vercel URL and package name still carry the old "305 Votes" name. The repo must stay public.
- **2026-10-10 (4:18 PM)** — **All four statewide races are matched on production** (`ad7a55f`, `0756c87`, `3b0c63f`): pages collected for eight statewide candidates (383 passages), donor scores for four, and Gemma 4's first-pass readings (128, quote check 0 missing). A donor score now counts as evidence, which unblocked Attorney General. Checked on production with the venue address: Governor, Attorney General, CFO and Agriculture each show a match; 16 match percentages on the ballot. **Honest limit:** only two of those 128 readings are real stated positions (Donalds on immigration enforcement, Jolly on offshore drilling), so statewide percentages rest mostly on party guess and donor score; Jolly showed a starred 100% on a party guess. Gemma 4's leanings pass was still running in another session at the time.
- **2026-10-10 (3:52-4:05 PM)** — **Home page and polish** (`054c52e`, `acc396e`, `e79dfd9`, `edadef7`, `8a242a3`, `6ac6adf`): "Two minutes." removed from the headline; a "Clarity. Choice. Control." section with three cards (no links, since those pages do not exist); every screen now opens at the top (the ballot used to open 1,854px down after the interview; measured 0 on production after the fix); logo reads "Your Ballot. Your Block." with "Your Block." in mint.
- **2026-10-10 (3:47 PM)** — **Governor race is now matched** (`3b1c126`). It was skipped because the ballot only scored races with collected pages, although Byron Donalds has 515 scored votes in Congress and roll-call votes on our questions. A race is now scored when any candidate has published words or a voting record. Checked on production: Governor shows a match for Donalds (from votes) and Jolly. Open and important: **Jolly's percentage rests on a party guess only** (no pages collected, and his 2014-2017 House record is not loaded), yet it can carry the star; the six other Governor candidates and the Attorney General, CFO and Agriculture races still have no data.
- **2026-10-10 (3:39 PM)** — **Interview is now ten questions** (`b2cb734`), chosen from the sixteen already written so that all 20 candidates with a quoted position have at least one to match on: immigration, hurricane relief, home insurance, flooding, transit, health care, immigration enforcement, housing, Everglades, student debt. Endangered animals dropped (two candidates had a position). Production walk passed; the U.S. House race now shows 14 source links, up from 7. Not changed: 11 collected candidates still have no clear yes or no on any question, and statewide offices have no collected pages. The interview is longer, so the demo should tap through most of it.
- **2026-10-10 (3:35 PM)** — **Ballot panel shows the voter's street address** (`f33c2e4`), not just the city; live on production and walked with the venue address (reads "2750 NW 3RD AVE"). The first attempt (`8e775ee`) broke the build; the deploy failed, so production was never affected, and the next commit repaired it. Code freeze from here: what is left is the submission on OrganizerHQ by 3:45, teammate names in the README, and one spoken answer on the live site by a person.
- **2026-10-10 (3:33 PM)** — **Race evidence opens inside the ballot** (`36ac1b6`): tapping a race drops its evidence open under it, with no page change; the left-right line comes first and every marker slides from the middle to its position. Production walk passed (8 match percentages, 7 source links on U.S. House, no errors). Tags: `v01` (`a74fa49`, five-step flow) and `v02` (`92d9f57`, race evidence on its own page) are the fallbacks. Open: the slide animation was seen in still screenshots only, not watched by a person; spoken answer on the live site untested by a person; demo not rehearsed.
- **2026-10-10 (3:30 PM)** — **Flow reordered** (`15ce9d3`): address → interview → ballot with a match per scored race → tap a race for its evidence → voting plan. Four steps instead of five; Gemma 4's placement of the voter is fetched once and shared by the ballot and race screens. Production walk passed with the venue address: 8 match percentages on the ballot, 7 source links on the U.S. House race, no errors. The previous version is tagged `v01` (`a74fa49`) as the fallback. Open: `docs/demo-script.md` has the new click order but has not been rehearsed; a spoken answer on the live site is still untested by a person.
- **2026-10-10 (3:20 PM)** — **Talk screen redesigned and app renamed** (`2d9fbd9`, `fc3ff74`): the brand flower is now the voice guide (yellow speaking, mint listening, blue thinking) in the centred mockup layout; handlers and prompts unchanged. "305 Votes" became **Your Ballot, Your Block** in the logo, page title, voice prompts, README and demo script. Production walk of all five screens passed with no errors, and the talk screen connected and spoke in a headless browser with a fake microphone (seen locally; the production run completed without page errors). Open: a real spoken answer by a person on the live site; demo not rehearsed; the repo, Vercel URL and package name still carry the old name.
- **2026-10-10 (3:15 PM)** — **Final UI shipped** (`74ae027`, `66f1232`, `aa893ac`): dark palette, serif headlines, 1040px shell with nav, labelled step dots and brand shapes; Ballot and Voting plan in two columns; Compare shows each candidate's exact quote and source in the cell, with theme tabs, the suggested ballot reduced to one strip ("Closest to what you told us") and the method text collapsed. Mockup labels saying "demo" or "prototype" were deliberately not copied because the data is real. Checked by a scripted browser walk of all five screens on production with the venue address at 1280px and 390px: no console errors, no failed requests. Open: the interview screen has new colours only (its mockup is still to come); the spoken-answer path has not been re-tested by a person since the reskin; on a phone the Compare grid scrolls sideways; demo not rehearsed.
- **2026-10-10 (2:50 PM)** — **Voter placed from the conversation; pivot deployed to production** (208fe61). `/api/place`: Gemma 4 reads the whole interview and places the voter with a range (smoke: five test voters in order, reruns identical; ~23 s on prod). Five House candidates with no record or donor score get a Gemma 4 estimate from their own words, used only after a check on five sitting members (correct side 5 of 5, average miss 0.16); state candidates are excluded because two estimates could not be verified. CFscores converted with a fitted line (average miss 0.07, was 0.13 when halved). Verified on prod by direct calls: home, lookup, place, ask, voice token. **Not verified:** the match screen in a browser (test browser was locked) and the microphone path on the deployed site. README and demo script updated: the app now suggests a closest match, so "never recommend" wording is gone.

- **2026-10-10 (2:21 PM)** — **Method pivot shipped** (`8e2c457`): roll-call scaling removed; six Miami questions; open "tell me what I care about" mode; match grid with four kinds of mark (stated, leans, closest passage, party guess). Data: 8 research-agent passes, 215 pages, 1,753 passages, 31 candidates (16 federal, 14 state legislature, 3 county/school board with text). `verify-stances.mjs`: 0 quotes missing from source, 82 positions; 13 weak leanings removed by review (`data/positions/reviewed-out.json`). Verified on prod with the venue address: four races shown, no console or network errors. Open: voice path on the deployed site not re-tested since the pivot; question wording still unreviewed; news interviews held out; five candidates have no reachable website; demo not rehearsed.
- **2026-10-10 (1:01 PM)** — **Voice interview live** (a0d3526): the AI speaks first and converses by voice (Gemini Live, `gemini-3.8-live`, single-use browser token); Gemma 4 re-reads each spoken answer and its reading is what gets scored; tap buttons and typing remain. Confirmed working by Sharif in the browser; the scripted voice loop passed (spoken answer heard and recorded in 2 s). Not independently checked: the deployed site's mic path on a phone. README must disclose both models and which does what.
- **2026-10-10 (12:52 PM)** — **Quiz replaced by an AI interviewer; full flow live** (d60f536). 12 real House votes (4 per theme) with Voteview cutpoints; scaling smoke PASS (all five Miami-Dade members recovered within 0.14 of their published score from their own votes). Gemma 4 (`gemma-4-31b-it`) reads typed answers (~8 s) and writes the per-theme comparison; verified on prod. Gemini Live voice probed and working (first audio 1.7 s) but not built. Open: question wording and hooks are Gemma drafts, not yet human-reviewed; challengers are not placed (no stance data); congress.gov demo key rate-limits, so summaries come from govinfo bulk data.
- **2026-10-10 (12:34 PM)** — **Lookup path works end to end on production** (e48f1f6): address or phone location → Census Geocoder (2026 lines) + Miami-Dade ArcGIS (old-lines district, precinct, polling place, early voting) → ballot from the sourced candidate roster. Checked on prod with the Miami Beach address (FL-24 → FL-25, Miami Beach City Hall) and locally in a browser with the venue (FL-26 → FL-24, Dunbar K-8, no console errors). Not done: County Commissioner and School Board races are not matched to an address; quiz, scale, Gemma 4 not started; no congress.gov key in `.env`.
- **2026-10-10 (12:16 PM)** — **Site is up:** Next.js 16 + Tailwind scaffold with the five-step shell and the address screen, deployed to https://hack-for-humanity-team.vercel.app (181af42). Build passes; live URL returns 200. Not wired yet: lookup, ballot, quiz, scale, polling place. GitHub auto-deploy could not be connected, so deploys are manual (`vercel --prod --yes`).

- **2026-10-10 (11:45 AM, at the event)** — **Team submission repo created and pushed:**
  https://github.com/sharifamlani/hack-for-humanity-team. Fresh history starting inside the
  build window, carrying the pre-event research docs and MIT license only — no application
  code yet. **Team is 4 people** (Sharif + 3), replacing the solo-builder assumption; row 0.8
  revised. Still open: lock the idea and track (rows 1.1–1.4), add teammates as collaborators.

- **2026-10-10** — **Smoke S4 PASS: Gemma 4 verified end to end.** `GEMINI_API_KEY` authenticates
  (62 models), both Gemma 4 variants are reachable (`gemma-4-31b-it`, `gemma-4-26b-a4b-it`), and
  a real `generateContent` call returned a correct completion with `finishReason: STOP`. The last
  P0 is cleared. **Two traps found that a passing smoke would have hidden** — written up in
  `docs/gemma4-integration.md`: (1) the `.env` defaults point at `gemini-3.1-pro-preview`, which
  is **closed-weight**, so an app reading `GOOGLE_MODEL` would run perfectly and **silently
  forfeit Challenges 2 and 3** — added an explicit `GEMMA_MODEL` to `.env.example`; (2) Gemma 4
  is a **thinking model** and returns its reasoning as a separate part flagged `thought: true`,
  so the naive `parts.map(p => p.text).join("")` **renders the model's internal monologue on
  screen** — filtering on `!p.thought` is mandatory because `thinkingBudget: 0` is rejected with
  HTTP 400 on both variants. Thoughts also cost ~10× the answer (52 vs 5 tokens on a trivial
  prompt), so a tight `maxOutputTokens` yields an empty answer with `finishReason: MAX_TOKENS`
  that looks like a broken integration.

- **2026-10-10** — **Toolchain updated: CLI 2.1.123 → 2.1.296** (173 versions). Diagnosed that
  updating the VS Code extension does **not** update the CLI — there is one npm-global install
  and `claude --version` reports that one; the extension's own newer bundled build is why
  `Workflow`/`ListAgents`/`SendMessage` worked in-session while the CLI lacked their flags.
  `claude update` resolved it. Re-probed after updating rather than assuming: `--bg` live, full
  `claude agents` agent view, `attach`/`logs`/`stop`/`respawn`/`rm`/`daemon` present, and the
  gates for cross-session messaging (2.1.234 Windows), `/subtask` (2.1.212), dynamic workflows
  and `ultracode` (2.1.203), worktree skills read-through (2.1.277) and the agent-team mailbox
  fix (2.1.207) all cleared. Corrected the playbook, which had recorded the old state. Noted
  that `--teammate-mode` is undocumented in `--help` by design, so grepping `--help` can't
  distinguish missing from hidden for that flag. **Row 0.8 answered: solo builder.**

- **2026-10-10** — **Redistricting claim challenged and re-verified.** Florida ran a
  mid-decade redistricting: signed **May 4, 2026**, **21 of 28 districts reworked**, effective
  this election cycle, challenge rejected by the Florida Supreme Court. Confirmed
  independently in the data — geocoded addresses run against both county layers show
  `ReDist2026` matching the federal Census Geocoder **7/7** while the county's other
  congressional layer matches only **4/7**, making `CongressionalDistrict_gdb` the **stale
  pre-redistricting map** (flagged do-not-use; it carries current reps' names, so it looks
  authoritative). **3 of 7 sampled addresses change district**, including the venue itself
  (FL-26 → FL-24), Miami Beach and Sunny Isles (FL-24 → FL-25). Corrected the original
  reasoning: the `REPNAME` placeholder only means the winner is unknown and proves nothing
  about boundaries — right conclusion, weak evidence. **New finding:** this does not merely
  decorate the GOTV idea, it **breaks its core comparison** — "your representative" has two
  different answers (old-lines incumbent vs new-district ballot), so the DW-NOMINATE
  comparison must pick one deliberately or show both.

- **2026-10-10** — **Official organizer repo read; brief rewritten from source.** The MLH and
  Luma listings understated the event badly. Three corrections that change strategy:
  (1) **three stackable challenges**, not one — Build for Miami plus MLH Best Open-Source AI
  Project plus **Best Use of Gemma 4**, and one build can win all three; (2) the rubric is
  **weighted** — Community impact 30%, Working build 25%, AI/data 20%, Originality **15%**,
  Demo clarity 10%, ties broken on impact, so originality is worth far less than assumed;
  (3) **the model choice is a prize-eligibility decision** — Gemma 4 via the Gemini API is
  open-weight and satisfies Challenges 2 and 3 with one integration, while a closed-weight
  model forfeits both. Revised the P0 blocker accordingly: **a Gemini key, not an Anthropic
  one.** Also captured: submission is via **OrganizerHQ** (check-in at the door required to
  submit or win), **teams lock 10:45 AM**, demo is **2 min + 1 min Q&A**, the repo must
  **stay public after the event**, MIT confirmed acceptable, and the README has **five
  required sections** (track, data sources, models, how to run, team) — restructured
  `README.md` to match. Noted the stricter wording **"code or project materials"** and added
  a repo-strategy recommendation: start a fresh submission repo at 10:45 AM and keep this one
  as the research notebook.

- **2026-10-10** — **GOTV idea evaluated; all data paths verified** (`docs/idea-gotv-miami.md`).
  Found and corrected a hole in the plan: **congress.gov has no geocoding**, so address →
  representative cannot work as proposed — replaced with the Census Geocoder (keyless,
  verified, returns congressional *and* state districts in one call). Google Civic ruled out
  (deprecation announced). Biggest win: **Voteview ships DW-NOMINATE cutpoints for all 674
  House roll calls**, so the IRT battery needs no parameter estimation and no MCMC — one
  respondent is a 1-D grid search, and the scale is pre-anchored, which answers Bafumi et
  al. (2005) on identification. Filtered 674 → **443 usable items** (101 are near-unanimous
  with zero discrimination). Polling places solved: `PollingPlace_gdb` (756), `Precinct_gdb`
  (757 polygons, server-side point-in-polygon), `ElectionGeography_public` (28 early-voting
  centers with accessibility + hours). Discarded a decoy "Polling Place Locater" layer that
  is actually in **Ireland**. Flagged: drop the phone number (TCPA + PII + no demo value),
  always defer to the official SOE/state lookup on polling location, and handle the 2026
  redistricting ("Pending 11/03/2026 Election") explicitly. Recommended scope cut from three
  products to one spine.

- **2026-10-09** — **Data sources verified (row 0.10 ✅, smoke S5 ✅).** Probed 13 Miami civic
  endpoints with real requests; 11 live. Standout: **Miami-Dade 311 at 343,851 records with
  `Access-Control-Allow-Origin: *`** — browser-callable, no proxy needed, and its
  `goal_days` vs `actual_completed_days` fields support a service-equity story rather than
  another dots-on-a-map dashboard. Found three traps: Census returns **HTTP 200 with an HTML
  error body** without a key; FEMA NFHL only answers on the `/arcgis/` path; and the county
  "Animal Services" layer is `ASD - Dangerous Dogs` containing **named residents' home
  addresses** — flagged do-not-display. 311 data stops at 2023 (2024 is token-gated).
  Also verified: Vercel CLI authed, Supabase CLI present, toolchain green.
  **Surfaced a P0 blocker:** `.env` is empty, so smoke S4 (LLM key) is blocked.
  Added `docs/pre-event-checklist.md`. Rows 0.1–0.6 + 0.10 done; 0.7 partial.

- **2026-10-09** (`bc36250`) — **Public repo live:** https://github.com/sharifamlani/hack-for-humanity
  GitHub's own license detector reports MIT, and an unauthenticated API call returns HTTP 200
  with `private: false` — so the "public GitHub repository with open-source license"
  submission requirement is satisfied and verified, not assumed. Row 0.6 ✅. Smokes S1 + S2 ✅.
  Remaining pre-event work: verify the data sources (row 0.10 / S5) and the LLM key (S4)
  tonight, and lock a track.

- **2026-10-09** (`87bc02e`) — Repo created. Rows 0.1–0.5 ✅. MIT license set (satisfies the MLH public-repo +
  open-source-license submission requirement and MLH Best Open-Source AI Project
  eligibility). `CLAUDE.md`, `README.md`, `.gitignore`, `.env.example`, and the verified
  hackathon brief written. Confirmed the MLH "all code written during the event" rule and
  deliberately shipped **no application scaffold** as a result. Unblocked: public GitHub
  push (row 0.6) and idea shortlisting (row 0.7).
