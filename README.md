# Hack for Humanity: Miami — Hacktoberfest 2026

**Your Ballot, Your Block** — an entry for
**[Hack for Humanity: Miami](https://events.mlh.com/events/14790-hack-for-humanity-miami)**,
an MLH-hosted civic-innovation hackathon presented by The AI Collective at The LAB Miami.

- **Live app:** https://hack-for-humanity-team.vercel.app
- **Code:** https://github.com/sharifamlani/hack-for-humanity-team (public, [MIT](LICENSE))
- **Built:** all code was written during the build window on Saturday, Oct 10, 2026.

## The problem

**Voters aged 18–25 in Miami-Dade County, especially in neighbourhoods whose congressional
district changed in 2026.**

Florida redrew 21 of its 28 congressional districts in May 2026. The new lines are in use for
the election on **Tuesday, Nov 3, 2026**. For a young voter who has just moved, or who has
never voted, three things are hard at once:

1. **Which district am I in now?** Some addresses moved. The venue of this event (Wynwood)
   went from FL-26 to FL-24. Miami Beach and Sunny Isles Beach went from FL-24 to FL-25.
   One county map layer still shows the old lines, even though it lists the current
   representatives' names.
2. **Who is on my ballot?** The answer depends on the address, and the lists are spread
   across several government sites.
3. **What do the candidates actually say about the things I care about?** Candidate
   websites are long, and a young voter should not have to read 100 pages to find out.

## What we built

Your Ballot, Your Block takes a voter from an address to a ballot, a conversation, and a polling place.
It suggests a closest match and shows what the match is based on; the choice stays with the voter.

1. **Find your district.** Type an address or share your phone's location. The app shows your
   congressional district on the old map and the new map, and says if it changed.
2. **See your ballot.** The races and candidates for that address, from Congress down to
   judges and ballot questions.
3. **Talk it through.** A voice interview, with two modes:
   - **Ask me** — the AI speaks ten Miami questions (flooding, insurance, heat, housing,
     wages, student debt and others) from [`data/questions.json`](data/questions.json).
   - **I'll tell you what I care about** — you speak or type freely about what matters to you.
   Typing and tapping Yes / No / Not sure work if you do not want to use a microphone.
4. **Compare with the candidates' own words.** For each candidate, the match screen shows
   where they line up with you and where they differ, with a **word-for-word quote and a
   link** to the page it came from. If we found nothing, it says so.
5. **Plan your vote.** Your most likely polling place and the two nearest early-voting sites.

## How it works

```
address / phone location
   -> U.S. Census Geocoder: new district, state districts, county, city      (lib/census.ts)
   -> Miami-Dade ArcGIS: old-map district, precinct, polling place, early voting (lib/arcgis.ts)
   -> ballot filter over data/candidates.json                                (lib/ballot.ts)
   -> voice interview                                                        (components/VoiceInterview.tsx, OpenTalk.tsx, lib/liveVoice.ts)
   -> match screen                                                           (components/MatchStep.tsx, lib/match.ts)
   -> polling place and early voting                                         (components/PollingStep.tsx)
```

**Where each model sits.** Three models, three jobs. They are not interchangeable.

| Model | Job in the product | Where |
|---|---|---|
| **Gemma 4** (`gemma-4-31b-it`, open-weight, via the Gemini API) | Does all the reading. Reads each candidate's passages and decides yes / no / none with an exact quote. Reads the voter's spoken or typed answers. Places the voter on the left–right line from the whole conversation, and estimates a position for candidates who have no record. Writes the comparisons. | `scripts/build-stances.mjs`, `scripts/estimate-scores.mjs`, `app/api/interview`, `app/api/place`, `app/api/explain`, `app/api/ask` |
| **Gemini Live** (`gemini-3.8-live`, closed-weight) | Voice only. Speaks the questions and hears the answers. | `lib/liveVoice.ts`, `app/api/voice-token` |
| **`gemini-embedding-2`** (closed-weight) | Finds passages only, by cosine similarity. Decides nothing. | `scripts/embed-positions.mjs`, `app/api/ask` |

The product code reads the model name only from the `GEMMA_MODEL` variable, and
[`lib/gemma.ts`](lib/gemma.ts) refuses to run unless it starts with `gemma-`.

**The quote guardrail.** A candidate's position is kept only if the quote Gemma 4 gives is
found **word for word** in the passage it came from (ignoring curly quotes, dashes and
spacing). Otherwise it is recorded as "none". This runs when positions are built
(`build-stances.mjs`), in the open mode at request time (`app/api/ask`), and is re-checked by
`scripts/verify-stances.mjs`.

**One left–right line per race.** Everyone in a race is drawn on one line, each from the best
source we hold for them ([`lib/match.ts`](lib/match.ts), `placeCandidate`):

| Order | Source | Who | Shown as |
|---|---|---|---|
| 1 | DW-NOMINATE first dimension, from votes in Congress (Voteview) | Sitting members | Dark square |
| 2 | CFscore, from who funded their past campaigns (Bonica's DIME), converted with a straight line fitted on the five people here who have both scores (average miss 0.07) | 16 candidates | Blue square |
| 3 | **Gemma 4's estimate from the candidate's own published words** | Candidates with neither of the above | Red outline |
| 4 | An index from their yes/no positions, which may be mostly party guess | Everyone else | Outline, dashed if mostly guess |

The Gemma 4 estimate is checked before it is used: `scripts/estimate-scores.mjs` first has
Gemma 4 place the sitting members from their websites alone, never seeing their real scores,
and writes estimates only if every member lands on the correct side and the average miss is
under 0.25. The result of that check is stored in `data/positions/estimates.json` and printed
under the line in the app.

**The voter's own dot comes from the conversation.** `app/api/place` gives Gemma 4 each
question and what the voter said in their own words, and gets back a position with a range on
the same scale. `scripts/smoke-place.mjs` checks it on five made-up voters: they come out in
order from left to right, and a second run gives the same numbers. It takes about 20 seconds,
so the match screen opens with a rough spot from the yes/no answers and swaps it when Gemma 4
answers. There is no true answer to compare a voter's placement with, so "ordered and
repeatable" is all we claim for it.

**Suggested picks, with their basis shown.** In each race the app shows a match percentage
and names the closest candidate: the average of how often the voter and candidate agree (a
party guess counts half) and how near they sit on the line. Gemma 4 places people; it never
picks anyone — the percentage is plain arithmetic in [`lib/match.ts`](lib/match.ts). The
prompts in `app/api/explain`, `app/api/ask` and `app/api/interview` still forbid recommending,
praising or criticising anyone.

**Privacy.** `app/api/lookup` uses the address for that one request only. It is not stored or
logged. The browser gets a single-use, short-lived voice token, so the API key stays on the
server.

## Track and challenges entered

- **Track 04 — Data to Action.** The question: what does a young Miami-Dade voter's ballot
  look like on the new map, and where do the candidates stand on what they care about?
- **MLH Best Open-Source AI Project.** Open-weight Gemma 4 makes every decision. Repo is
  public and MIT-licensed.
- **MLH Best Use of Gemma 4.** Gemma 4 via the Gemini API, named above and in the code.

## Data sources

Every source the app or its build scripts read.

**Where the voter is and what is on the ballot**

| Source | Used for | Link |
|---|---|---|
| U.S. Census Geocoder | Address or point to current congressional, state senate, state house, county, city | [Geocoding Services API](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html) |
| Miami-Dade County open data (ArcGIS), `CongressionalDistrict_gdb` | District on the **old** (pre-2026) map, shown only for comparison | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/CongressionalDistrict_gdb/FeatureServer/0) |
| Miami-Dade ArcGIS, `Precinct_gdb` | Precinct for the address | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/Precinct_gdb/FeatureServer/0) |
| Miami-Dade ArcGIS, `PollingPlace_gdb` | Polling place for the precinct | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/PollingPlace_gdb/FeatureServer/0) |
| Miami-Dade ArcGIS, `ElectionGeography_public` | Early-voting sites | [layer](https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/ElectionGeography_public/FeatureServer/0) |
| Miami-Dade Supervisor of Elections | Official lookup the app links to | [votemiamidade.gov](https://www.votemiamidade.gov/elections/home.page) |

**Where candidates sit on the left–right line** — [`data/positions/records.json`](data/positions/records.json)

| Source | Used for | Link |
|---|---|---|
| Voteview, 119th Congress | DW-NOMINATE scores and recorded votes of sitting members | [voteview.com](https://voteview.com/data) |
| DIME v4.0 (Bonica), recipients 1979–2024 | CFscores for 16 candidates, per row in [`data/positions/cfscores.csv`](data/positions/cfscores.csv) | [data.stanford.edu/dime](https://data.stanford.edu/dime) |

**Candidate roster** — [`data/candidates/*.csv`](data/candidates) (federal 16 rows, state 41,
local 38; 95 rows merged into `data/candidates.csv`). Every row carries its own `source_url`.
These are the distinct sources:

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
- News, used for 4 rows marked `secondary`:
  [WLRN, school board runoff](https://www.wlrn.org/education/2026-08-19/two-candidates-advance-to-runoff-in-miami-dade-school-board-district-1-election) ·
  [WLRN, municipal elections](https://www.wlrn.org/government-politics/2025-11-05/south-florida-municipal-elections-meiner-re-elected-in-miami-beach-upset-in-homestead-council-race) ·
  [NBC Miami, mayor sworn in](https://www.nbcmiami.com/news/politics/local-politics/eileen-higgins-miami-mayor-sworn-in/3737130/)

**Candidates' own words** — 109 pages are listed in
[`data/candidates/sites/*.csv`](data/candidates/sites) for the 16 federal candidates (U.S.
Senate and U.S. House FL-24 to FL-28). 106 returned HTTP 200. They are campaign sites,
official government sites, press releases, interviews and one questionnaire. Pages per
candidate (see the CSVs for every URL, its type, and how it was found):

| Candidate | Pages | Candidate | Pages |
|---|---|---|---|
| Carlos A. Gimenez | 13 | Eliott Rodriguez | 4 |
| Mario Diaz-Balart | 12 | Eddy Rojas | 3 |
| Nicole Locklin | 11 | Neil J. Gillespie | 3 |
| Maria Elvira Salazar | 11 | Te Mayonna Brown | 5 |
| Jared Moskowitz | 9 | Oliver G. Gilbert III | 8 |
| Ashley Moody | 8 | Scott Singer | 6 |
| Angie Nixon | 8 | Phil "Felipe" Ehr | 6 |
| Peter Jassenoff | 1 (nothing found) | Deborah Ann Meidinger Hosey | 1 (nothing found) |

The scraper (`scripts/scrape-positions.mjs`) turned 100 distinct pages into **880 passages**
for 14 candidates, saved word for word in
[`data/positions/chunks.json`](data/positions/chunks.json).

**Interview questions** — ten yes / no questions written by the team during the event:
[`data/questions.json`](data/questions.json). They are marked `"reviewed": false`.

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

- **Claude Code** (Anthropic), a coding agent, wrote and edited code and documentation with
  the team. Terms: [Anthropic commercial terms](https://www.anthropic.com/legal/commercial-terms).

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
```

```bash
node scripts/build-records.mjs                         # Voteview scores + votes, DIME CFscores -> records.json
node --env-file=.env --experimental-strip-types scripts/estimate-scores.mjs   # Gemma 4 estimates + member check -> estimates.json
node scripts/smoke-place.mjs                           # voter placement: ordered and repeatable (needs the dev server)
```

As built on Oct 10: 320 candidate-by-question cells for 20 candidates — 99 "yes", 8 "no",
213 "nothing found" (`data/positions/stances.json` and `stances-state.json`).

## Limits and honesty

- **The left–right line is rough.** It mixes three kinds of score (votes, donors, a model's
  reading of a website) that are not the same measurement. A donors score describes who funded
  a campaign, not how the candidate would vote. The Gemma 4 estimate was checked on only a
  handful of sitting members, whose websites also reveal their party.
- **The voter's placement cannot be checked against a true answer.** It is ordered and
  repeatable on test voters; that is all.
- **A suggested pick is a closest match on thin data, not advice.** In most races the
  candidates' own words disagree on very little, so the percentage leans on the line and on
  party guesses, which are labelled.

- **Federal and some state-legislature candidates only.** Candidate words are collected for
  31 candidates (U.S. Senate, U.S. House, and the state legislative districts covering the
  areas we tested). Governor, Cabinet, county, judicial and local candidates are on the
  ballot screen but have no positions, and ballot questions are never scored.
- **Two candidates have no website we could find** (Meidinger Hosey, Jassenoff), so they have
  no positions.
- **"No public position found" does not mean "no view."** It means we found nothing in the
  pages we read that clearly answers the question. News articles are left out on purpose,
  because they quote several people.
- **Polling places** come from county open data. Precincts can move. Confirm with the
  [Supervisor of Elections](https://www.votemiamidade.gov/elections/home.page) before you go.
- **County Commissioner and School Board races are not matched to an address** yet, so they
  are not shown as "on your ballot."
- **Miami-Dade only.** Addresses outside the county are turned away.
- **Question wording is an unreviewed draft** (`"reviewed": false` in `data/questions.json`).
- **Old-map district** comes from a county layer that predates the 2026 lines. We show it
  only to say whether your district changed. The "new" district comes from the Census Geocoder.
- **Voice** needs a microphone and a browser that allows it. Without one, use the buttons.

## Team

- Sharif Amlani
- ADD TEAMMATE NAMES (three more members)

## License

[MIT](LICENSE) — an OSI-approved license, satisfying the hackathon's open-source submission
requirement and eligibility for the MLH Best Open-Source AI Project prize.
