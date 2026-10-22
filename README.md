# Your Ballot. Your Block.

**From your address to the ballot box, for Miami-Dade's Nov 3, 2026 election.**
Grand Champion of **[Hack for Humanity: Miami](https://events.mlh.com/events/14790-hack-for-humanity-miami)**
(Hacktoberfest 2026), an MLH-hosted civic-innovation hackathon presented by The AI Collective at
The LAB Miami.

- **Live app:** https://yourballotyourblock.com (also at https://hack-for-humanity-team.vercel.app)
- **Code:** https://github.com/sharifamlani/hack-for-humanity-team (public, [MIT](LICENSE))
- **Built:** the hackathon entry was written during the build window on Saturday, Oct 10, 2026
  (git tags `submission-deadline`, `judged-demo`, `event-day-final`). Everything after that is
  post-event work, dated in [`ROADMAP.md`](ROADMAP.md); the build shown at DeepStation's AI Demo
  Night on Oct 22 is tagged `demo-night-final`.

## The problem

**Voters aged 18–25 in Miami-Dade County, especially in neighbourhoods whose congressional
district changed in 2026.**

Florida redrew 21 of its 28 congressional districts in May 2026. The new lines are in use for
the election on **Tuesday, Nov 3, 2026**. For a young voter who has just moved, or who has
never voted, three things are hard at once:

1. **Which district am I in now?** Some addresses moved. The LAB Miami (Wynwood) went from
   FL-26 to FL-24; Miami Beach and Sunny Isles Beach went from FL-24 to FL-25. One county map
   layer still shows the old lines, even though it lists the current representatives' names.
2. **Who is on my ballot?** The answer depends on the address, and the lists are spread across
   several government sites.
3. **What do the candidates actually say about the things I care about?** Candidate websites
   are long, and a young voter should not have to read 100 pages to find out.

## What it does

1. **Find your district.** Type an address or share your phone's location. The app shows your
   congressional district on the old and new maps and says if it changed.
2. **Answer 10 Miami questions.** Right after the address, the app asks about flooding, home
   insurance, the Everglades, housing, college costs, a path to legal status, hurricane relief,
   health-care costs, immigration enforcement and transit. Type an answer in your own words, or
   tap Yes / No / Not sure. "Talk instead" switches to a voice interview.
3. **See your ballot, with your closest match in each race.** Every race for your address, from
   Congress to judges and ballot questions, with a match percentage for each scored candidate.
   The closest candidate gets a **star only when the match rests on 4 or more of their own
   positions** (votes or published words) on questions you answered; otherwise the race says
   "Closest, on thin evidence (n)". Ties within 3 points say "Too close to call". Legislative
   seats filled without a contest say so ("elected unopposed").
4. **Open the evidence.** Tap a race to see each candidate's position on each question, with a
   **word-for-word quote and a link** to the page it came from, or their recorded vote in
   Congress. Where we found nothing, it says so.
5. **Make your voting plan.** Two lanes, because Florida has two rules:
   - **Vote early** (Mon Oct 19 – Sun Nov 1, 7 AM – 7 PM): **any** early-voting site in
     Miami-Dade works; the two closest are shown with directions.
   - **Vote on Election Day** (Tue Nov 3): **only** your precinct's polling place.
6. **Take my choices to the polls.** One tap makes a one-page PDF on your phone: your plan, then
   a table of every race with your closest match and how strong the evidence is. Nothing is
   sent anywhere.
7. **Share it.** LinkedIn, Facebook, Instagram, WhatsApp, X, text, copy link or a QR code. Only
   the app's address is shared, never anything about you.

The app suggests a closest match and shows what it is based on. It is a match, not an
endorsement; the choice stays with the voter.

## How it works

```
address / phone location
   -> U.S. Census Geocoder: new district, state districts, county, city           (lib/census.ts)
   -> Miami-Dade ArcGIS: old-map district, precinct, polling place, early voting  (lib/arcgis.ts)
      + corrections from the Supervisor of Elections' official 10/15 list          (data/polling-overrides.json)
   -> ballot for that address from data/candidates.json                           (lib/ballot.ts)
   -> 10-question interview, typed or by voice                                    (components/InterviewStep.tsx, VoiceInterview.tsx, lib/liveVoice.ts)
   -> Gemma 4 places the voter on a left-right line                               (app/api/place, lib/usePlacement.ts)
   -> match per race: agreement + line closeness, star rule                       (lib/match.ts, lib/raceMatch.ts)
   -> ballot, evidence, voting plan                                               (components/BallotStep.tsx, MatchStep.tsx, PollingStep.tsx)
   -> one-page PDF built in the browser (jsPDF)                                   (lib/votingPlanPdf.ts)
```

**Where each model sits.** Three models, three jobs. They are not interchangeable.

| Model | Job in the product | Where |
|---|---|---|
| **Gemma 4** (`gemma-4-31b-it`, open-weight, via the Gemini API) | Does all the reading. Reads each candidate's passages and decides yes / no / none with an exact quote. Reads the voter's typed or spoken answers. Places the voter on the left–right line from the whole conversation, and estimates a position for candidates with no record. Writes the comparisons. | `scripts/build-stances.mjs`, `scripts/estimate-scores.mjs`, `app/api/interview`, `app/api/place`, `app/api/explain` |
| **Gemini Live** (`gemini-3.8-live`, closed-weight) | Voice only. Speaks the questions and hears the answers. | `lib/liveVoice.ts`, `app/api/voice-token` |
| **`gemini-embedding-2`** (closed-weight) | Finds candidate passages for Gemma 4 to read when positions are built. Decides nothing. | `scripts/embed-positions.mjs` |

The product code reads the model name only from the `GEMMA_MODEL` variable, and
[`lib/gemma.ts`](lib/gemma.ts) refuses to run unless it starts with `gemma-`.

**The quote guardrail.** A candidate's position is kept only if the quote Gemma 4 gives is found
**word for word** in the passage it came from (ignoring curly quotes, dashes and spacing).
Otherwise it is recorded as "none". `scripts/verify-stances.mjs` re-checks every shown quote,
and a person reviewed the readings and removed the weak ones (`data/positions/reviewed-out.json`).
"Closest thing they've said" passages that turned out to quote someone else are hidden after
review (`data/positions/closest-review.json`, checked by `scripts/verify-closest.mjs`).

**Where a candidate's position comes from**, strongest first: a recorded vote in Congress on a
matching bill; their own words, stated; their own words, a leaning; and, only to fill a gap, their
party's usual position, drawn dashed and counted half.

**One left–right line per race.** Everyone in a race is drawn on one line, each from the best
source we hold for them ([`lib/match.ts`](lib/match.ts), `placeCandidate`):

| Order | Source | Who |
|---|---|---|
| 1 | DW-NOMINATE first dimension, from votes in Congress (Voteview) | 6 sitting members |
| 2 | CFscore, from who funded their past campaigns (Bonica's DIME), converted with a straight line fitted on the people here who have both scores | 21 candidates |
| 3 | **Gemma 4's estimate from the candidate's own published words** | 5 candidates with neither |
| 4 | An index from their yes/no positions, which may be mostly party guess | Everyone else |

The Gemma 4 estimate is checked before it is used: `scripts/estimate-scores.mjs` first has
Gemma 4 place sitting members from their websites alone, never seeing their real scores, and
writes estimates only if every member lands on the correct side and the average miss is under
0.25.

**The voter's own dot comes from the conversation.** `app/api/place` gives Gemma 4 each question
and what the voter said, and gets back a position with a range. It takes about 25–30 seconds,
so the ballot opens with a rough spot from the yes/no answers and updates when Gemma 4 answers
(it gives up after 45 seconds and keeps the rough spot). `scripts/smoke-place.mjs` checks that
five made-up voters come out in order and that a second run gives the same numbers. There is no
true answer to compare a voter's placement with, so "ordered and repeatable" is all we claim.

**The match percentage** averages how often the voter and candidate agree (a party guess counts
half) and how near they sit on the line. It is plain arithmetic in `lib/match.ts`; Gemma 4 places
people but never picks anyone, and the prompts forbid recommending, praising or criticising
anyone. A score needs at least two compared answers or a place on the line, so one answer never
shows as 100% or 0%.

**Privacy.** `app/api/lookup` uses the address for that one request only; it is not stored or
logged. The PDF is built on the voter's device. Share links carry only the app's address. The
browser gets a single-use, short-lived voice token, so the API key stays on the server.

## Track and challenges entered

- **Track 04 — Data to Action.** The question: what does a young Miami-Dade voter's ballot look
  like on the new map, and where do the candidates stand on what they care about?
- **MLH Best Open-Source AI Project.** Open-weight Gemma 4 makes every decision. Repo is public
  and MIT-licensed.
- **MLH Best Use of Gemma 4.** Gemma 4 via the Gemini API, named above and in the code.

## Data sources

Every source the app or its build scripts read.

**Where the voter is and where they vote**

| Source | Used for | Link |
|---|---|---|
| U.S. Census Geocoder | Address or point to current congressional, state senate, state house, county, city | [Geocoding Services API](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) |
| Miami-Dade County open data (ArcGIS), `CongressionalDistrict_gdb` | District on the **old** (pre-2026) map, shown only to say whether it changed | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/CongressionalDistrict_gdb/FeatureServer/0) |
| Miami-Dade ArcGIS, `Precinct_gdb` | Precinct for the address | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/Precinct_gdb/FeatureServer/0) |
| Miami-Dade ArcGIS, `PollingPlace_gdb` | Polling place for the precinct (the layer's mapped point is used; its typed LAT/LON fields are wrong for 21 rows) | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/PollingPlace_gdb/FeatureServer/0) |
| Miami-Dade Supervisor of Elections, official polling place list for Nov 3, 2026 (dated 10/15/2026) | Corrections for sites that moved after the county layer's last edit, and temporary sites; `scripts/verify-polling-places.mjs` checks all 756 precincts against it | [PDF](https://www.miamidade.gov/elections/library/2026-11-03-general-election-polling-place-list.pdf) |
| Miami-Dade ArcGIS, `ElectionGeography_public` | Early-voting sites and dates | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/ElectionGeography_public/FeatureServer/0) |
| Miami-Dade Supervisor of Elections, early-voting schedule | Early-voting hours (7 AM – 7 PM daily) and a check of all 28 sites and dates | [PDF](https://www.miamidade.gov/elections/library/early-voting/2026-11-03-general-election-early-voting-schedule.pdf) |
| Miami-Dade Supervisor of Elections | Official lookup the app links to | [votemiamidade.gov](https://www.votemiamidade.gov/elections/home.page) |

**Who is on the ballot** — [`data/candidates/*.csv`](data/candidates) (federal 16 rows, state 54,
local 38; 108 rows merged into `data/candidates.csv`). Every row carries its own `source_url`;
`scripts/verify-candidates.mjs` fails on any row without one. Every contested race was checked
against the Division of Elections listing on Oct 22 ([`docs/qa-roster-2026-10-22.md`](docs/qa-roster-2026-10-22.md)).

- Florida Division of Elections, 2026 General Election candidate listings:
  [federal](https://dos.elections.myflorida.com/candidates/CanList.asp?elecid=20261103-GEN) ·
  [Cabinet](https://dos.elections.myflorida.com/candidates/canlist.asp?elecid=20261103-GEN&OfficeGroup=CAB) ·
  [Legislature](https://dos.elections.myflorida.com/candidates/canlist.asp?elecid=20261103-GEN&OfficeGroup=LEG)
- Florida Division of Elections, [Constitutional Initiatives](https://constitutionalinitiatives.dos.fl.gov/)
  (statewide ballot measures)
- Miami-Dade Supervisor of Elections:
  [official sample ballot, Nov 3, 2026](https://www.miamidade.gov/elections/library/2026-11-03-general-election-sample-ballot.pdf) ·
  [elected officials list](https://www.miamidade.gov/elections/library/reports/elected-officials.pdf)
- Miami-Dade County Commission pages:
  [District 2](https://www.miamidade.gov/global/government/commission/district02/home.page) ·
  [District 3](https://www.miamidade.gov/global/government/commission/district03/home.page) ·
  [District 4](https://www.miamidade.gov/global/government/commission/district04/home.page)
- News, for a few rows marked `secondary`:
  [WLRN, school board runoff](https://www.wlrn.org/education/2026-08-19/two-candidates-advance-to-runoff-in-miami-dade-school-board-district-1-election) ·
  [WLRN, municipal elections](https://www.wlrn.org/government-politics/2025-11-05/south-florida-municipal-elections-meiner-re-elected-in-miami-beach-upset-in-homestead-council-race) ·
  [NBC Miami, mayor sworn in](https://www.nbcmiami.com/news/politics/local-politics/eileen-higgins-miami-mayor-sworn-in/3737130/)

**Where candidates sit on the left–right line** — [`data/positions/records.json`](data/positions/records.json)

| Source | Used for | Link |
|---|---|---|
| Voteview, 119th Congress | DW-NOMINATE scores and recorded votes of sitting members | [voteview.com](https://voteview.com/data) |
| DIME v4.0 (Bonica), recipients 1979–2024 | CFscores, per row in [`data/positions/cfscores.csv`](data/positions/cfscores.csv) | [data.stanford.edu/dime](https://data.stanford.edu/dime) |

**Candidates' own words** — campaign sites, official government sites, press releases,
interviews and questionnaires, listed page by page in
[`data/candidates/sites/*.csv`](data/candidates/sites) with each page's type and how it was
found. `scripts/scrape-positions.mjs` saved **335 pages** as **2,917 passages** for **44
candidates** (federal, statewide, state legislature and local), word for word, in
[`data/positions/chunks.json`](data/positions/chunks.json). Gemma 4's 528 readings of those
passages yield **157 positions** shown in the app, every quote checked against its page. News
articles are left out on purpose, because they quote several people.

**Interview questions** — written by the team: [`data/questions.json`](data/questions.json). Ten
are active; they are marked `"reviewed": false`.

## Models used

**Running in the product**

| Model | Open or closed | Terms |
|---|---|---|
| Gemma 4, `gemma-4-31b-it`, via the Gemini API | Open-weight | [Gemma terms of use](https://ai.google.dev/gemma/terms) |
| Gemini Live, `gemini-3.8-live` | Closed-weight | [Gemini API terms](https://ai.google.dev/gemini-api/terms) |
| `gemini-embedding-2` | Closed-weight | [Gemini API terms](https://ai.google.dev/gemini-api/terms) |

Gemma 4 does all the deciding. Gemini Live only speaks and listens. The embedding model only
finds passages. See [How it works](#how-it-works).

**Used to build it (not in the product)**

- **Claude Code** (Anthropic), a coding agent, wrote and edited code and documentation with the
  team. Terms: [Anthropic commercial terms](https://www.anthropic.com/legal/commercial-terms).

## Running it locally

You need Node.js, [pnpm](https://pnpm.io) and a Gemini API key (https://mlh.link/gemma).

```bash
pnpm install
cp .env.example .env     # then fill in the two variables below
pnpm dev                 # http://localhost:3000
```

Required environment variables (names only):

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini API: Gemma 4, Gemini Live token, embeddings |
| `GEMMA_MODEL` | Model the product uses. Set to `gemma-4-31b-it`. Must start with `gemma-`. |

`.env.example` also lists Supabase and Census ACS variables. Nothing in the code reads them.

Other commands: `pnpm build` (runs `pnpm data` first), `pnpm start`, `pnpm lint`, and
`pnpm data` (merges the candidate CSVs and writes `data/candidates.json`).

**Rebuild the candidate-position data.** Run in this order. Details are in
[`data/positions/_README.md`](data/positions/_README.md).

```bash
node scripts/scrape-positions.mjs                      # pages in data/candidates/sites -> chunks.json
node --env-file=.env scripts/embed-positions.mjs       # passages + questions -> embeddings.json
node --env-file=.env scripts/build-stances.mjs         # Gemma 4 reads passages -> stances.json
node scripts/verify-stances.mjs                        # fails if any quote is not on its page
node scripts/verify-closest.mjs                        # fails if a flagged "closest" passage is unreviewed
node scripts/build-records.mjs                         # Voteview scores + votes, DIME CFscores -> records.json
node --env-file=.env --experimental-strip-types scripts/estimate-scores.mjs   # Gemma 4 estimates + member check
```

**Checks against a running site** (each prints PASS or FAIL; see [`scripts/_README.md`](scripts/_README.md)):

```bash
node scripts/verify-address-mapping.mjs [--base URL]   # 17 addresses: districts, ballot races, polling place
node scripts/verify-polling-places.mjs                 # all 756 precincts vs the official list (needs pdftotext)
node --experimental-strip-types scripts/verify-share.mjs [--base URL]   # link preview + share links
node scripts/smoke-concurrency.mjs --base URL --n 10   # 10 voters finishing at once
node scripts/smoke-place.mjs                           # voter placement: ordered and repeatable
```

Deploys go through `node scripts/deploy-clean.mjs`, which ships only what is committed.

## Limits and honesty

- **A suggested pick is a closest match on thin data, not advice.** The star needs 4 positions
  from votes or the candidate's own words; many races, especially statewide ones, do not reach
  it and say "thin evidence". Percentages there lean on the left–right line and on party
  guesses, which are labelled.
- **The left–right line is rough.** It mixes votes, donors and a model's reading of a website,
  which are not the same measurement. A donors score describes who funded a campaign, not how
  the candidate would vote.
- **The voter's placement cannot be checked against a true answer.** It is ordered and
  repeatable on test voters; that is all.
- **"No public position found" does not mean "no view."** It means nothing in the pages we read
  clearly answers the question.
- **Ballot questions and judges are not scored.** They are listed so the ballot is complete.
- **County Commissioner and School Board races are not matched to an address** yet, so they are
  not shown as "on your ballot."
- **Polling places** match the Supervisor of Elections' 10/15/2026 list for every precinct, but
  sites can still change. Confirm before you go; the app links to the official lookup.
- **The questions are written for Congress.** Statewide and local candidates often discuss other
  issues, which is why their evidence is thin. A rework of the questions is planned (ROADMAP row 6.28).
- **Free talk ("I'll tell you what I care about") is switched off.** In testing it was slow and
  found too little; why, and how to turn it back on, are in [`CLAUDE.md`](CLAUDE.md).
- **Miami-Dade only.** Addresses outside the county are turned away.
- **Question wording is an unreviewed draft** (`"reviewed": false` in `data/questions.json`).
- **Voice** needs a microphone and a browser that allows it. Typing and the buttons always work.

## Team

![The team in front of the Hack for Humanity: Miami banner at The LAB Miami](docs/images/team-grand-champion.jpg)

*Grand Champion, Hack for Humanity: Miami — The LAB Miami, Saturday, Oct 10, 2026.*

- Sharif Amlani — [LinkedIn](https://www.linkedin.com/in/sharif-amlani-a7a28a21b/)
- Sandy Denis — [LinkedIn](https://www.linkedin.com/in/sandy-denis-643138257/)
- Vania Arredondo — [LinkedIn](https://www.linkedin.com/in/vaav/)
- Schneur Werde — [LinkedIn](https://www.linkedin.com/in/schneur-werde/)

## License

[MIT](LICENSE) — an OSI-approved license, satisfying the hackathon's open-source submission
requirement and eligibility for the MLH Best Open-Source AI Project prize.
