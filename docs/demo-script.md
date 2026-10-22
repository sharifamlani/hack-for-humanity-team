## Demo Night — Oct 22, 2026

**Event:** DeepStation *AI Demo Night*, The LAB Miami. Likely slot Demo 3, 7:50–8:35 (length
unconfirmed), then Q&A with all builders at 8:35. Presenter: Sharif Amlani. Audience: about 200,
mostly ML engineers who ship small open-weight models, plus AI-safety and red-teaming people.
Demo 1 right before us is red-teaming small open-weight models live.
Plan and findings: [`demo-night-plan.md`](demo-night-plan.md). Numbers below come from
[`README.md`](../README.md) or the plan doc, except the two marked *(old script)*, which come from
the hackathon script further down this file.

**Status:** drafted Oct 22, not yet rehearsed. Rewrite in your own words and time it twice against
production.

**If the slot is short, use the 2-minute version. If it is the full 45 minutes, use the 7-minute
version and take questions inside the slot.**

### Facts to check on the screen before you say them

| Line | Check |
|---|---|
| "early voting is open" | Banner on the voting plan reads "EARLY VOTING IS OPEN TODAY" and home reads "12 days away · early voting is open now." |
| QR code | Say the QR line **only if** the card shows on the voting plan (it ships only if the load test passes). |
| "Spoken answer" | Say "I'll type" unless the mic test on production passed (plan smoke S6). Never say "you just talk to it" if you typed. |
| Star in a race | A star appears only with at least 4 positions. Otherwise the row reads "Closest, on thin evidence (n)." |
| Closest passages | Run `node scripts/verify-closest.mjs` once; it should report nothing unreviewed. |
| Nothing deploys after the 4:30 PM freeze | Production is the tag `demo-night-final`. |

### 1. Two-minute version

Click order: home, **Try: 2750 NW 3rd Ave** , **Start**, **I'd rather type** (or **Ask me** if the
mic test passed), type ONE answer, tap the rest, **See where I stand**, point at the
district-changed card, open **U.S. House** evidence, **Build my voting plan**, early-voting banner
(and the QR if it shows).

| Seconds | Say | Do |
|---|---|---|
| 0:00–0:15 (15) | "Florida redrew 21 of its 28 congressional districts in May. If you are 18 to 25 in Miami-Dade and you just moved, or you have never voted, you do not know which district you are in now. The election is Tuesday, November 3. That is 12 days away, and early voting is open right now." | Home page, already loaded. Point at "12 days away · early voting is open now." |
| 0:15–0:25 (10) | "This is Your Ballot, Your Block. It takes an address to a ballot, a conversation, and a polling place. We are standing in the address I am about to use." | Tap **Try: 2750 NW 3rd Ave — we're here**, then **Start** |
| 0:25–0:50 (25) | "It asks ten Miami questions: flooding, insurance, heat, rent. I will type one answer in my own words. Gemma 4, an open-weight model, reads it and counts it as a yes or a no. That takes about five seconds. I will tap the rest." | **I'd rather type** (or **Ask me** if the mic test passed). Type ONE answer. Tap Yes / No / Not sure on the others |
| 0:50–1:05 (15) | "This building moved from District 26 to District 24. The county's own map layer still shows the old lines. And here is every race on this address's ballot." | **See where I stand**. Point at the district-changed card |
| 1:05–1:30 (25) | "Gemma 4 now reads everything I said and places me on a left-to-right line. That takes about twenty seconds, so the percentages will move. While it works: Gemma 4 never picks anyone. The percentage is plain arithmetic. And any position it reports has to be a quote that appears word for word on the candidate's own page, or it is thrown out." | Ballot is open; the "refining your matches" line is on screen. Do not click. Keep talking until the numbers settle |
| 1:30–1:45 (15) | "Open the U.S. House race. Here is what each candidate said about my answer, their exact sentence, and a link to the page. If we found nothing, it says so." | Tap **U.S. House**. Point at one quote and its **View source** link |
| 1:45–1:57 (12) | "Last step: where to vote. Early voting is open today through Sunday, November 1. Election Day is Tuesday. Scan this to open it on your phone." *(Drop the last sentence if no QR shows.)* | **Build my voting plan**. Point at the early-voting banner, then the QR card if shown |
| 1:57–2:00 (3) | "It is open source, MIT licensed. Thank you." | Hold on the voting plan |

Total: 120 seconds (15 + 10 + 25 + 15 + 25 + 15 + 12 + 3). If you run long, cut the 0:25–0:50
explanation to one sentence, not the placement fill.

### 2. Seven-minute version

Same click path, with the engineering story added. Time marks are the end of each block.

| Seconds | Say | Do |
|---|---|---|
| 0:00–0:30 (30) | "Who this is for: voters 18 to 25 in Miami-Dade, especially where the congressional district changed in 2026. Florida redrew 21 of its 28 districts. For a young voter, three things are hard at once: which district am I in, who is on my ballot, and what do the candidates actually say. Their websites are long. Nobody should have to read 100 pages." | Home page |
| 0:30–1:15 (45) | "First finding, from checking primary data and not trusting labels. One Miami-Dade map layer still holds the old district lines, but it lists the current representatives' names. So it looks current and is not. It is an office directory with the names updated and the floor plan unchanged. We use the Census Geocoder for the new district and show the county layer only to say whether your district changed. Here: this building, FL-26 on the old lines, FL-24 on the new." | Tap **Try: 2750 NW 3rd Ave — we're here**, **Start** |
| 1:15–2:00 (45) | "Now the conversation. Ten questions written by the team. There are two modes: it asks you, or you tell it what you care about. I will type. Gemma 4 reads my words and records a yes or a no. About five seconds each." | **I'd rather type**. Type ONE answer; tap the rest |
| 2:00–3:00 (60) | "Three models, three jobs. Gemma 4, `gemma-4-31b-it`, open-weight, through the Gemini API, does all the reading: candidate passages, my answers, and my placement on the line. Gemini Live is voice only, and it is closed-weight. An embedding model finds passages and decides nothing. The product code reads the model name from one setting and refuses to run unless it starts with `gemma-`. And Gemma 4 never picks anyone: the match percentage is arithmetic anyone can redo." | **See where I stand**. Ballot opens; while the placement runs (about 20 s) keep talking |
| 3:00–3:50 (50) | "How far to trust the placement. We had Gemma 4 place five sitting members of Congress from their websites alone, without seeing their real scores. It put all five on the correct side, 5 of 5, and the average miss was 0.16 on the scale *(old script)*. For the voter there is no true answer, so we only claim it is ordered and repeatable on test voters. The line mixes votes, donor scores and a model's reading, and the app says so." | Point at the note under the left–right line; tap **How do we compare?** if time allows |
| 3:50–4:50 (60) | "For this room, the guardrail. Candidate websites are untrusted input to the model. Anyone can write anything on a page. So the check does not trust the model. Gemma 4 gives a yes, a no, or none, plus a quote. The code looks for that quote, word for word, in the passage it came from. Not found: it becomes none. That runs when we build the data, again at request time in the open mode, and again in a verify script. It is an output check, so it holds whichever model sits behind it. What it does not prove: that the page is true, or that the words belong to the candidate." | Open **U.S. House** evidence. Point at a quote and **View source** |
| 4:50–6:00 (70) | "The second half of that sentence is how we got caught. This morning I walked production. In the U.S. Senate race, Ashley Moody's 'closest thing they've said' on flooding was a quote of Byron Donalds. It was on her page, so it passed our check, and it was not her words. We scanned all 122 closest passages with a script and it flagged 16 more that name someone else or report speech. Some were false alarms. One was real: a quote from an FWC director on Salazar's page. A person reviewed each one, and the real ones are now excluded. We also found the app starred Neil Gillespie, a No Party candidate, at 73% on 3 positions. The arithmetic was honest and the star overstated it. A star now needs at least 4 positions from votes or the candidate's own words. Otherwise the row says 'Closest, on thin evidence.'" | Tap **U.S. Senate**. Point at Moody's flooding cell and at Gillespie's row |
| 6:00–6:40 (40) | "Last step: the plan. Early voting is open today through Sunday, November 1. Election Day is Tuesday, November 3. The banner reads the dates from the county's own data. Your most likely polling place and the two nearest early-voting sites. We use your address for that one request. It is not stored or logged. Scan this to try it." *(Drop the last sentence if no QR shows.)* | **Build my voting plan**. Point at banner, map, QR card if shown |
| 6:40–7:00 (20) | "Limits: federal and some state legislative candidates only; Miami-Dade only; the question wording is an unreviewed draft. Code is public, MIT licensed. We won Grand Champion at Hack for Humanity: Miami on October 10. Questions welcome." | Hold on the voting plan |

Total: 420 seconds (30 + 45 + 45 + 60 + 50 + 60 + 70 + 40 + 20).

**TODO:** before going on, read the final number of passages excluded from
`data/positions/reviewed-out.json` and `closest-review.json` and decide whether to say it.
The plan gives "16 more flagged, some false alarms" but not a post-review count, and this
script does not invent one.

### 3. Q&A prep for this audience

Keep answers to three sentences. Say "we have not tested that" when it is true.

| Question | Answer |
|---|---|
| **Prompt injection through candidate pages?** | "Yes, those pages are untrusted input. Two things limit it. The pages are a list we chose per candidate, not an open crawl. And Gemma 4 returns only a yes, no, or none plus a quote, and the code accepts that only if the quote is on the page word for word. It does not stop a page that really contains hostile or false text from being quoted accurately. We have not run a dedicated injection test against these pages. That is the next thing I would do." |
| **Hallucinated quotes?** | "Any quote the model returns must match the source passage word for word, ignoring curly quotes, dashes and spacing, or it is stored as none. That runs at build, at request time in the open mode, and in `scripts/verify-stances.mjs`. The failure it missed was real text attributed to the wrong person, which we found this morning and now flag with `scripts/verify-closest.mjs`." |
| **Isn't this biased? Why recommend anyone?** | "It shows the closest match and its basis, labelled a match, not an endorsement. Gemma 4 places people on a line and never picks. The percentage is arithmetic in `lib/match.ts`. The prompts forbid recommending, praising or criticising anyone. The choice stays with the voter." |
| **Why did a third-party candidate rank high?** | "This morning in the U.S. Senate race it did: Gillespie at 73% on 3 positions. We changed it. A star needs at least 4 positions from votes or the candidate's own words; otherwise the row says 'Closest, on thin evidence' with the count. In most races the candidates' own words disagree on very little, so the percentage leans on the line and on party guesses, which are drawn differently and labelled." |
| **Quantization and safety drift?** | "We call hosted Gemma 4 through the Gemini API. We do not quantize or host it ourselves, so we cannot speak to drift from quantization. Our guardrail checks outputs, not the model, so it applies whatever model is behind it. We have not measured how the guardrail behaves on a quantized model." |
| **Why the Gemini API if it is open-weight?** | "Speed to build in one day. The product code requires a model name starting with `gemma-`, so swapping to self-hosted weights is a settings and endpoint change. We have not done that." |
| **Privacy?** | "The address is used for that one request and is not stored or logged. The browser gets a single-use, short-lived voice token, so the API key stays on the server." |
| **Cost and latency?** | "About five seconds to read a typed answer, about twenty seconds for Gemma 4 to place the voter. The match screen opens with a rough spot from the yes/no answers and swaps it when Gemma 4 answers. TODO: we have no cost-per-voter number; do not quote one." |
| **How do you know the placement is right?** | "For candidates we checked it on five sitting members: all five on the correct side, average miss 0.16 *(old script)*. A small sample, and their websites also reveal their party. For the voter there is no true answer, so we claim ordered and repeatable." |
| **Where does the district data come from?** | "U.S. Census Geocoder for the new district. A Miami-Dade layer for the old one, shown only to say whether it changed." |
| **What's next?** | "Candidates beyond federal and some state legislative races, a reviewed set of questions, and an injection and drift test on the guardrail. Those are limits today, not promises." |

### 4. Pre-flight, 5:30 PM

One line: production URL and local dev server open in separate tabs and the screen recording
queued, address pre-typed once to warm the page, laptop sound on and volume tested, phone hotspot
on and tested, charger plugged in, `node scripts/verify-closest.mjs` run, and the recording of
the full path on the laptop and phone as the last resort.

---

# Hackathon script — Oct 10, 2026 (history)

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

> **Click order changed at 3:30 PM.** Address → **Start** → interview → **See where I stand** → ballot with matches → tap **U.S. House** and its evidence drops open under the race (the markers slide into place on the line) → scroll to **Build my voting plan**. The district-changed card is now on the ballot page, after the interview, so say the 0:35 line when the ballot appears.

| Seconds | Say | Do |
|---|---|---|
| 0:00–0:20 | "If you're 22 and live in Wynwood, your congressional district changed this year and nobody told you. The person who represents you today is not on your ballot in November. Young voters here don't skip elections because they don't care — they skip because nobody connects the ballot to their life." | Site already open on the address screen |
| 0:20–0:35 | "Your Ballot, Your Block takes you from your address to the ballot box in two minutes." | Tap **Try: 2750 NW 3rd Ave**, then **Start** |
| 0:35–0:50 | "This building moved from District 26 to District 24. Here is everyone on your ballot, from Congress to the county questions, each with its official source." | Point at the "district changed" card; scroll the ballot once |
| 0:50–1:20 | "Now it talks with you. It asks about things that matter here — flooding, insurance, rent, the Everglades — and you just answer out loud." | **Explore your priorities** → **Ask me**. Answer ONE question by voice. Tap Yes/No for the rest |
| 1:20–1:45 | "Then it shows where each candidate stands — in their own words. We read 215 pages from 31 candidates' own websites. Gemma 4, an open-weight model, read them and pulled the exact sentence. Solid means they said it. Dashed means it's only a party guess, and we say so. Every mark has a link. And it puts you and the candidates on one line: Gemma 4 places you from what you actually said, and gives a closest match in each race." | **See where I stand**. Point at "Closest to what you told us", then a quote and its **View source** link in the grid, then the left-right line under it (your dot shifts after about 20 seconds when Gemma 4 answers). Tap **How do we compare?** for Gemma 40027s comparison |
| 1:45–2:00 | "And here's where you vote, with directions. It's open source, MIT licensed. The match is a starting point with its evidence on screen — the vote is yours — and it gets you to the polls." | **Build my voting plan** → point at the polling place |

**If asked "isn't this biased?"** — The app shows a closest match, labelled "a match, not an endorsement", and the percentage is plain arithmetic anyone can redo; Gemma 4 places people but never picks. A position is shown
only when the candidate's exact sentence is on their own page; a person removed 13 readings that
were a stretch; party guesses are drawn differently and counted separately.

**If asked "where's the AI?"** — Gemma 4 does four jobs: it reads each candidate's pages and
decides what they said, it reads the voter's spoken answer, it places the voter (and five House
candidates with no record) on the left-right line, and it writes the comparison. Gemini
Live is only the voice. The embedding model only finds passages.

**If asked "how do you know the placement is right?"** — For candidates we tested it: Gemma 4
placed five sitting members from their websites alone and landed on the correct side for all
five, 0.16 away from their real voting scores on average. For the voter there is no true answer
to compare with; on test voters it comes out in the right order and gives the same number twice.

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
