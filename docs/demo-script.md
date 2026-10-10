# Demo script — 2 minutes

**This file is the spec.** It gets written in Phase 1 (10:20–10:45), *before any code*, and
nothing gets built that is not spoken aloud here. If a feature has no sentence, it has no
reason to exist.

**Status:** drafted at 2:20 PM against the live site. Not yet rehearsed.

---

## Why write the demo before the code

Judges score **demo clarity** and **working build** as two of five criteria. Both are decided
by what happens in a 120-second window, not by what exists in the repo. Writing the script
first does three things:

1. It defines the minimum feature set — the script *is* the scope.
2. It surfaces the one screen that has to look finished, so we don't polish four that don't.
3. It makes the cut decisions cheap at 2 PM, because they were already made at 10:40.

## The 120-second budget

| Seconds | Beat | What is said | What is on screen |
|---|---|---|---|
| 0:00–0:20 | **The problem** | Name a specific Miami person or group and the thing that is hard for them today. One sentence, no preamble, no "so basically." | The live app, already loaded |
| 0:20–0:35 | **The idea** | One sentence: what this does. | Same |
| 0:35–1:30 | **The demo** | Narrate a single real path through the product, start to finish. Real input, real data, real AI output. | The actual working thing |
| 1:30–1:50 | **Why the AI matters** | Say what the model is doing that a lookup table could not. | The AI's output, visible |
| 1:50–2:00 | **The impact + close** | Who is better off, and what happens next. Name the repo + license. | Final screen |

## Rules for the demo

- **Demo the deployed URL, not localhost.** Venue Wi-Fi is a risk, so also have a local
  fallback running and a recorded screen capture as the last resort.
- **No logins on stage.** Pre-authenticate. If the demo needs a logged-in state, be logged in.
- **No empty states.** Seed real-looking data before demoing. A judge seeing "No results"
  scores a working build as not working.
- **One path only.** Do not show a second feature. Depth reads as finished; breadth reads as unfinished.
- **Rehearse twice, timed.** Against the deployed URL. Overrunning two minutes means getting
  cut off mid-sentence before the impact line lands.
- **Say the license out loud.** There is an explicit Best Open-Source AI Project prize; make it
  easy for that judge to tick the box.

## The script

Drafted 2:20 PM from what is live. **The presenter should rewrite it in their own words** and
time it twice against the live site. Address used: the venue, 2750 NW 3rd Ave.

| Seconds | Say | Do |
|---|---|---|
| 0:00–0:20 | "If you're 22 and live in Wynwood, your congressional district changed this year and nobody told you. The person who represents you today is not on your ballot in November. Young voters here don't skip elections because they don't care — they skip because nobody connects the ballot to their life." | Site already open on the address screen |
| 0:20–0:35 | "305 Votes takes you from your address to the ballot box in two minutes." | Tap **Try: 2750 NW 3rd Ave**, then **Show my ballot** |
| 0:35–0:50 | "This building moved from District 26 to District 24. Here is everyone on your ballot, from Congress to the county questions, each with its official source." | Point at the "district changed" card; scroll the ballot once |
| 0:50–1:20 | "Now it talks with you. It asks about things that matter here — flooding, insurance, rent, the Everglades — and you just answer out loud." | **See where you stand** → **Ask me**. Answer ONE question by voice. Tap Yes/No for the rest |
| 1:20–1:45 | "Then it shows where each candidate stands — in their own words. We read 215 pages from 31 candidates' own websites. Gemma 4, an open-weight model, read them and pulled the exact sentence. Solid means they said it. Dashed means it's only a party guess, and we say so. Every mark has a link." | **See where I stand**. Tap one **why?** to open a quote and its source |
| 1:45–2:00 | "And here's where you vote, with directions. It's open source, MIT licensed, and it never tells you who to vote for. It shows you the evidence and gets you to the polls." | **Where do I vote?** → point at the polling place |

**If asked "isn't this biased?"** — The app describes and never recommends. A position is shown
only when the candidate's exact sentence is on their own page; a person removed 13 readings that
were a stretch; party guesses are drawn differently and counted separately.

**If asked "where's the AI?"** — Gemma 4 does three jobs: it reads each candidate's pages and
decides what they said, it reads the voter's spoken answer, and it writes the comparison. Gemini
Live is only the voice. The embedding model only finds passages.

**Numbers you can say (all from `scripts/verify-stances.mjs` and the data files at 2:20 PM):**
31 candidates · 215 pages · 1,753 passages · 82 quoted positions before review, every quote
checked word-for-word against its page.

## Fallback plan

| If this breaks | Do this |
|---|---|
| Venue Wi-Fi drops | Phone hotspot; then localhost build; then screen recording |
| Deployed URL 500s | Switch to the local dev server (keep it running the whole time) |
| LLM API rate-limits or errors | Pre-captured response cached and visibly labeled as cached |
| Laptop dies | Charger in bag; screen recording on a phone as last resort |
