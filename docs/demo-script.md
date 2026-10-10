# Demo script — 2 minutes

**This file is the spec.** It gets written in Phase 1 (10:20–10:45), *before any code*, and
nothing gets built that is not spoken aloud here. If a feature has no sentence, it has no
reason to exist.

**Status:** empty — written at kickoff once the idea is locked.

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

_To be written._

## Fallback plan

| If this breaks | Do this |
|---|---|
| Venue Wi-Fi drops | Phone hotspot; then localhost build; then screen recording |
| Deployed URL 500s | Switch to the local dev server (keep it running the whole time) |
| LLM API rate-limits or errors | Pre-captured response cached and visibly labeled as cached |
| Laptop dies | Charger in bag; screen recording on a phone as last resort |
