# Hackathon brief — Hack for Humanity: Miami (Hacktoberfest 2026)

**Source of truth.** Rewritten 2026-10-10 from the **official organizer repo**, which
supersedes the MLH and Luma listing pages this file was first built from:

- https://github.com/AI-Collective-Hackathons/hack-for-humanity-miami
- `README.md` and `Challenge Guide.md` (both read in full)

If `CLAUDE.md` and this file disagree, this file wins and `CLAUDE.md` gets corrected.

---

## Logistics

| Field | Value |
|---|---|
| Event | Hack for Humanity: Miami — an official MLH **Hacktoberfest Hack Day** |
| Presented by | The AI Collective (120 chapters, 50 countries this fall) |
| Hosted with | MLH, The LAB Miami, DeepStation |
| Date | **Saturday, October 10, 2026**, 10:00 AM – 5:00 PM ET |
| Venue | The LAB Miami, Wynwood |
| Teams | **Solo to 4.** Teams **lock at 10:45 AM** |
| Check-in | **Through OrganizerHQ at the door — required to submit AND to win** |
| Build window | **10:45 AM – 3:30 PM** (4h45m) |
| Submission | **OrganizerHQ, deadline 3:45 PM sharp** |
| Demo | **2 minutes + 1 minute of questions.** Working product, not slides |

### Schedule

| Time (ET) | What |
|---|---|
| 10:00–10:20 | Check-in through OrganizerHQ, swag, team matching |
| 10:20–10:45 | Welcome, challenge briefing, MLH Hacktoberfest intro |
| **10:45** | **Build starts · teams lock** |
| 12:30–2:00 | Food available |
| **3:30** | **Build ends** |
| 3:30–3:45 | Submit in OrganizerHQ (**3:45 hard deadline**) |
| 3:45–4:30 | Demos |
| 4:30–4:45 | Judging |
| 4:45–5:00 | Winners |

---

## THREE challenges, and they stack

This is the biggest thing the listing pages did not convey. **One build can win all three.**

| # | Challenge | Requirement | Prize |
|---|---|---|---|
| **1** | **Build for Miami** (theme — pick **one** of 4 tracks) | Scored on the weighted rubric below | Grand Champion + 4 Track Champions |
| **2** | **Best Open-Source AI Project** (MLH Hacktoberfest) | **Open-source or open-weight AI** must be an important part of how it works | Hacktoberfest 2026 Winner DEV Badge + MLH Swag Bag |
| **3** | **Best Use of Gemma 4** (Google DeepMind) | **Gemma 4 via the Gemini API**, named in README, shown in code + demo | MLH partner prize |

Every team enters Challenge 1 with one primary track. Challenges 2 and 3 are judged
separately on their own requirements and stack with any Build for Miami prize.

### The model decision is a prize-eligibility decision

**Gemma 4 through the Gemini API is open-weight, so a single integration qualifies for BOTH
Challenge 2 and Challenge 3.** That is two extra prize categories for one piece of work.

A closed-weight model (Claude, GPT) **disqualifies the project from Challenge 2 and 3** —
it can still win Build for Miami, but it leaves two prizes on the table.

Separately and importantly: **coding agents are explicitly allowed.** *"Any AI tools,
including coding agents: yes. List the ones you used."* So using Claude Code to build is
fine and must be disclosed — the distinction is between the tool that writes the code and
the model that runs inside the product. **Gemma 4 should be the model in the product.**

Get started: https://mlh.link/gemma · [quickstart](https://mlh.link/gemma-quickstart) ·
[API docs](https://mlh.link/gemma-docs). Needs a **Gemini API key**.

---

## Judging rubric — WEIGHTED

| Criterion | Weight | What judges look for |
|---|---|---|
| **Community impact** | **30%** | A real Miami problem, **a specific group of people**, and a **believable path** to helping them |
| **Working build** | **25%** | Runs live, core flow works end to end. *For Data to Action: a reproducible analysis + a visual that answers the question* |
| **Use of AI and data** | **20%** | AI and data do real work, **not decoration**, and judges can **verify how** |
| **Originality and craft** | **15%** | A fresh angle or thoughtful technical work, **built today** |
| **Demo clarity** | **10%** | Problem, solution and proof in 2 minutes |

**Ties break on Community impact.** Organizers verify submissions before demos, and rule or
Code of Conduct breaches can mean disqualification.

### What the weights actually mean for strategy

- **Community impact + Working build = 55%.** A simple thing that runs, serving a named group
  of people, beats a clever thing that half-runs.
- **Originality is only 15%** — second lowest. Technical sophistication is *not* where the
  points are. Do not trade a working core flow for an impressive-but-fragile method.
- **"A specific group of people"** is stated twice in the guide. Vague beneficiaries
  ("Miamians", "voters", "residents") lose 30% of the available score.
- **"Judges can verify how"** — the AI/data work must be inspectable, not asserted.

**Winner selection:** Grand Champion is the highest weighted score overall. Track Champions
are the top score in each track *excluding* the Grand Champion, so **five different teams
win** Build for Miami.

---

## The four tracks (Challenge 1) — pick exactly one

Tracks came from problems the community named during Humans in AI Week. They are narrower
than the listing pages suggested.

### 01 — Four Forces, One City
*How does Miami stay safe and livable as water, air, land and fire push back?*

Guidance is explicit: **"Start from a person, not a technology"** — *"construction crews in
Brickell on a heat-advisory day" beats "a heat app."*

| Force | Build ideas given |
|---|---|
| **Water** | Street-level flood alerts from tide/rain data; flood-safe routing for commuters and ambulances; water-quality checker for beaches and canals |
| **Air** | Hurricane-prep copilot in English/Spanish/Haitian Creole; offline-first info hub for network outages; air-quality alerts for people with asthma |
| **Land** | **Benefits navigator** matching families to programs they qualify for; live shelter-bed and food-pantry finder; traffic-and-flood commute planner |
| **Fire** | Heat-risk alerts for outdoor/construction crews; cooling-center finder; climate-risk and home-insurance explainer |

Requires: name your force and the specific people served, in README *and* demo; ground it in
local data, real neighborhoods, the languages spoken here; show the moment of use.

### 02 — Wild Miami
*How do we protect the animals we share Miami with, and keep neighbors safe too?*

Ideas: photo-to-species agent (iguanas, pythons); roadkill hotspot map; Everglades
sighting/injury routing (panthers, manatees, sea turtles); lost-pet matcher; foster/adoption
matchmaker; hurricane pet-evacuation planner; anonymous cruelty reporting.

Hard guidance: **never encourage people to handle wild animals — route to professionals.**
Know who acts on your output and design that handoff.

### 03 — Brain Gain
*How does Miami keep the talent it attracts?*

Ideas: career pathway navigator (skills → Miami employers/internships/mentors); reskilling
coach for AI-displaced workers; **affordability planner weighing salary, rent, commute and
flood risk by neighborhood**; newcomer onboarding guide; access for non-English speakers,
people with disabilities, people without a degree.

**"Skip generic job boards"** — the value is Miami-specific matching.

### 04 — Data to Action
*What does the data say, and what should Miami do about it?*

**This is an analysis track, not an app track.** *"You don't need a full app — a sharp
analysis, a clear visual and a recommended action is a complete submission."*

A complete entry shows exactly five things:
1. **The question** — one Miami problem, stated plainly
2. **The insight** — one sentence with **the number that matters**
3. **The visual** — a chart/map/dashboard readable **in 10 seconds**
4. **The action** — who should do what, based on the finding
5. **The pipeline** — data sources and code in the repo, **so judges can reproduce it**

Any topic works. **Cite every dataset in the README.**

---

## Build requirements

### What you can bring

| Allowed | Not allowed |
|---|---|
| **Ideas, research and sketches** from before the event | **Code or project materials written before the event** |
| Libraries, frameworks, APIs, open-source code | — |
| Any AI tools, including coding agents (**list them**) | — |

*"All project work happens during build time,"* per the
[MLH Standard Hackathon Rules](https://github.com/MLH/mlh-policies/blob/main/standard-hackathon-rules.md).

> **Note the wording: "code **or project materials**."** That is broader than code alone.
> Research and data verification are explicitly allowed, but a pre-written README or app
> scaffold is arguably a "project material." Since organizers verify submissions before demos
> and breaches can mean disqualification, the risk is asymmetric — see the repo-strategy note
> in `CLAUDE.md`.

### Open source

- Public GitHub repo with an open-source license — **MIT or Apache-2.0 named as fine.**
  Our MIT choice is confirmed correct.
- **The repo must stay public after the event to remain prize-eligible.**
- Name **every model used** in the README.

### Submission checklist (OrganizerHQ, by 3:45 PM)

- [ ] **Checked in through OrganizerHQ at the door** — required to submit and to win
- [ ] Project name + short description: the problem, who it helps, how it works
- [ ] Public GitHub repo link with an open-source license
- [ ] Technologies used, **including AI models**
- [ ] Build for Miami **track** selected, plus any MLH challenges qualified for
- [ ] Demo URL or video (optional)
- [ ] **README with: track, data sources, models used, how to run it, team members**

### Required README contents

The guide specifies these five, so the README is a graded artifact, not an afterthought:

1. Track
2. Data sources (cite **every** dataset)
3. Models used (name each one, link license/terms for Challenge 2)
4. How to run it
5. Team members

---

## Prizes

| Prize | What you get |
|---|---|
| Build for Miami — **Grand Champion** | Arduino boards for the team |
| Build for Miami — **Track Champion** (×4) | MLH Hacktoberfest swag + spotlight on community channels |
| **Best Open-Source AI Project** | Hacktoberfest 2026 Winner DEV Badge + MLH Swag Bag |
| **Best Use of Gemma 4** | MLH partner prize |
| Every builder | Hacktoberfest swag + an "I Demoed" sticker |

All winning teams **may be invited to join a grant-funded project to commercialize what they
built**, and may be showcased in The AI Collective's newsletter to 300k+ subscribers. That
is the real prize; the Arduino boards are not.

---

## Organizer-recommended tools and data

**AI:** [Gemma 4 on the Gemini API](https://mlh.link/gemma) ·
[Hugging Face](https://huggingface.co/models) · [Ollama](https://ollama.com/) ·
[Agent Skills standard](https://agentskills.io/) ·
[Snowflake CoCo](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code) (Track 04,
[free trial](https://signup.snowflake.com/cortex-code/))

**Miami data:** [Miami-Dade Open Data Hub](https://gis-mdc.opendata.arcgis.com) ·
[City of Miami Data Explorer](https://www.miami.gov/Data-Explorer)

**Climate/hazards:** [NOAA Tides & Currents](https://tidesandcurrents.noaa.gov/) ·
[NHC](https://www.nhc.noaa.gov/) · [AirNow API](https://docs.airnowapi.org/) ·
[OpenFEMA](https://www.fema.gov/about/openfema/data-sets)

**People/jobs:** [Census](https://data.census.gov/) · [BLS](https://www.bls.gov/data/) ·
[O*NET](https://www.onetonline.org/)

**Wildlife:** [iNaturalist](https://www.inaturalist.org/) · [GBIF](https://www.gbif.org/)

> Our own probe results for most of these — with record counts, CORS status and traps — are in
> `data-sources-verified.md`. **AirNow** is the one organizer-recommended source we have not
> probed; it requires a free API key.

## Resolved — no longer open questions

| Question | Answer |
|---|---|
| Submission mechanism | **OrganizerHQ** (not Devpost). Check-in there at the door is mandatory |
| Deployed URL required? | **No** — "Demo URL or video (optional)." But the build must run live in the demo |
| Pre-existing boilerplate permitted? | **No.** "Code or project materials written before the event: no" |
| Sponsor prizes? | **Yes** — Gemma 4 (Google DeepMind), plus MLH Best Open-Source AI Project |
| Demo length | **2 minutes + 1 minute Q&A** |
| License | MIT or Apache-2.0 explicitly fine; must **stay public** after the event |
