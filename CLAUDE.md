# CLAUDE.md — Hack for Humanity: Miami

## What this repo is

This repo is our competition entry for **Hack for Humanity: Miami (Hacktoberfest 2026)** —
an MLH-hosted civic-innovation hackathon presented by The AI Collective at The LAB Miami.

**The mandate:** build an AI-powered solution to a real Miami community problem, and
demo it working in two minutes.

The repo exists to satisfy three things at once, in this order of priority:

1. **A working demo** — something that runs on screen, live, in under two minutes.
2. **A credible civic case** — a judge should understand who in Miami is better off and why.
3. **A compliant open-source submission** — public GitHub repo, MIT licensed, code written during the event.

Anything that does not serve one of those three is out of scope for the event window.

---

## Event facts (from the official organizer repo, 2026-10-10)

| | |
|---|---|
| **Event** | Hack for Humanity: Miami — Hacktoberfest 2026 |
| **Date** | Saturday **Oct 10, 2026**, 10:00 AM – 5:00 PM ET |
| **Venue** | The LAB Miami, Wynwood |
| **Team size** | 1–4. **Teams LOCK at 10:45 AM** |
| **Check-in** | **OrganizerHQ, at the door — required to submit AND to win** |
| **Submission** | **OrganizerHQ, 3:45 PM sharp** |
| **Demo** | **2 minutes + 1 minute of questions** |
| **Hosts** | The AI Collective (presenter), MLH, The LAB Miami, DeepStation |

### Saturday run of show

| Time (EDT) | What |
|---|---|
| 10:00–10:20 | Check-in |
| 10:20–10:45 | Opening remarks |
| 10:45–15:30 | **Build time — ~4h45m total** |
| 15:30–15:45 | **Submissions due (hard stop 3:45 PM)** |
| 15:45–16:30 | Demos (2 min + 1 min Q&A) |
| 16:30–16:45 | Judging |
| 16:45–17:00 | Winners |

> The real budget is **under five hours of build time**, and the last 45 minutes of it
> belong to the demo, not the code. Scope every decision against that.

---

## The four challenge tracks (official wording)

Enter **exactly one**. The tracks came from problems the community named at Humans in AI Week,
and they are narrower than the listing pages implied.

| Track | The question judges are scoring against |
|---|---|
| **01 Four Forces, One City** | How does Miami stay safe and livable as water, air, land and fire push back? |
| **02 Wild Miami** | How do we protect the animals we share Miami with, and keep neighbors safe too? |
| **03 Brain Gain** | How does Miami keep the talent it attracts? |
| **04 Data to Action** | What does the data say, and what should Miami do about it? |

Two things to internalize:

- **Track 01 says "start from a person, not a technology."** *"Construction crews in Brickell
  on a heat-advisory day" beats "a heat app."*
- **Track 04 is an ANALYSIS track, not an app track.** *"You don't need a full app — a sharp
  analysis, a clear visual and a recommended action is a complete submission."* It wants five
  things: the question, the insight (one sentence with the number that matters), the visual
  (readable in 10 seconds), the action (who should do what), and the pipeline (reproducible).
- **There is no civic-participation / voting track.** Anything in that space has to enter
  through Data to Action and earn its community-impact score on a named group of people.

Track selection happens at kickoff. See `docs/idea-shortlist.md`.

---

## Judging rubric — WEIGHTED. Optimize against the weights, not the list.

| Criterion | Weight | What judges look for |
|---|---|---|
| **Community impact** | **30%** | A real Miami problem, **a specific group of people**, a **believable path** to helping them |
| **Working build** | **25%** | Runs live, core flow end to end. *Data to Action: reproducible analysis + a visual that answers the question* |
| **Use of AI and data** | **20%** | Real work, **not decoration**, and judges can **verify how** |
| **Originality and craft** | **15%** | A fresh angle or thoughtful technical work, **built today** |
| **Demo clarity** | **10%** | Problem, solution, proof in 2 minutes |

**Ties break on Community impact.**

What the weights mean in practice:

- **Impact + working build = 55%.** A simple thing that runs, serving named people, beats a
  clever thing that half-runs.
- **Originality is only 15%** — second lowest. Never trade a working core flow for an
  impressive-but-fragile method.
- **"A specific group of people"** appears twice in the guide. "Miamians" or "residents"
  forfeits most of the largest category.

## THREE challenges — and they stack

One build can win all three. This is the single biggest strategic fact about the event.

| # | Challenge | Requirement |
|---|---|---|
| **1** | **Build for Miami** | Pick **one** of four tracks; scored on the rubric above |
| **2** | **Best Open-Source AI Project** | **Open-source or open-weight AI** must be an important part of how it works |
| **3** | **Best Use of Gemma 4** | **Gemma 4 via the Gemini API**, named in README, shown in code + demo |

### The model choice is a prize-eligibility decision

**Gemma 4 through the Gemini API is open-weight, so ONE integration qualifies for both
Challenge 2 and Challenge 3.** A closed-weight model forfeits both.

**Coding agents are explicitly allowed** — *"Any AI tools, including coding agents: yes. List
the ones you used."* So building with Claude Code is fine and must be disclosed in the README.
The distinction is between the tool that writes the code and **the model that runs inside the
product** — that one should be Gemma 4.

Prizes: Grand Champion (Arduino boards) + 4 Track Champions + the two MLH challenges. The
real prize is the **grant-funded commercialization invitation** and the 300k+ newsletter.

---

## Florida redistricting — verified, and it governs any civic build

**Carry this forward. It is the kind of fact that silently makes a correct-looking build
wrong.**

Florida ran a **mid-decade redistricting**: special session April 20–24, 2026, signed into law
**May 4, 2026**, **21 of Florida's 28 congressional districts reworked** (districts 1–7
unchanged), effective with the **2026 election cycle**. The Florida Supreme Court rejected the
challenge, so the new lines are in use for Nov 3, 2026.

### 1. One Miami-Dade district layer is stale, and it looks authoritative

| Layer | Verdict |
|---|---|
| `CongressionalDistrict_gdb` | 🚨 **STALE — pre-redistricting.** Matches the federal Census Geocoder on only **4 of 7** geocoded test addresses |
| `CongressionalDistrictReDist2026_gdb` | ✅ Matches the federal geocoder **7 of 7** — this is the live map |
| **Census Geocoder** | ✅ **Use this.** Returns 120th-Congress districts natively, keyless, and adjudicated the two layers above |

The stale layer is dangerous precisely because it carries the **current** representatives'
names — Wilson, Díaz-Balart, Salazar, Giménez — so it reads as current. It is an office
directory with every name updated and the floor plan never changed: it sends you confidently
to the wrong room.

**3 of 7 sampled addresses change district**, including the venue itself:

| Address | Old lines | New lines |
|---|---|---|
| **2750 NW 3rd Ave (the venue), Wynwood** | FL-26 | **FL-24** |
| Miami Beach (Convention Center Dr) | FL-24 | **FL-25** |
| Sunny Isles Beach (Collins Ave) | FL-24 | **FL-25** |

Miami Beach and Sunny Isles move into **FL-25, currently held by a Broward representative.**

### 2. "Your representative" now has two answers — pick one deliberately

Any build that looks up a representative by address, or compares a constituent to a member's
voting record, hits this. The two answers diverge across much of Miami-Dade:

| Framing | Compare against | The honest claim |
|---|---|---|
| **Accountability** | The member under the **old** lines | "Here is how the person who represented you actually voted" |
| **Ballot** | The **new** district's incumbent / candidates | "Here is who you will be voting on" |

Where a redrawn district has **no incumbent running**, a voting-record comparison has no
target at all. **Never let the code pick silently** — state which framing is in use, on screen.
Showing both is usually strongest.

Detail, evidence and sources: `docs/idea-gotv-miami.md`.

---

## How we work fast: parallel agents

**One builder, 4h45m.** Full detail in `docs/parallel-build-playbook.md`; skills in
`.claude/skills/parallel-agent-orchestration` and `.claude/skills/solo-sprint-dispatch`.

### The doctrine

**Parallelize the periphery. Serialize the spine.**

The **spine** is the chain where each step needs the previous one to exist: input → data call →
model → output on screen. Agents added there wait on each other — coordination cost, zero
concurrency. The **periphery** needs only the spine's *interface*: research, verification, docs,
fixtures, deploy, styling, a second opinion on a bug. That is where agents win.

The instinct under deadline pressure is to parallelize the part that feels slowest — the core
build. That is exactly the wrong half.

### The real constraint is attention, not tokens

One builder reads one transcript, makes one decision, approves one permission prompt at a time.
Dispatching agents is not about more code per minute — it is about **keeping attention on the
spine while the periphery gets done anyway.**

> **If it will need steering, Sharif does it. If it returns a deliverable, an agent does it.**

### Three tracks, disjoint files, three agents max

| Track | Owns | Who |
|---|---|---|
| **Spine** | the end-to-end demo path | **Sharif + main session, serially** |
| **Periphery** | the one screen that must look finished, styling, fixtures, deploy | `screen-builder` |
| **Record** | README (graded — 5 required sections), citations, model disclosure | `submission-scribe` |

Plus `data-prober` before building on any source, `demo-verifier` before claiming anything works,
and parallel `bug-hypothesis` agents when a root cause is unclear.

**Cap at three concurrent.** Not a cost rule — an attention rule.

### Dispatch template — all five fields, every time

A subagent inherits **no conversation history**. It loads this file and project context, nothing
that was just discussed.

```
CONTEXT:   <the 3 facts the agent cannot discover on its own>
OWNS:      <exact file paths. "Do not modify anything else.">
TASK:      <the deliverable, as a noun>
DONE WHEN: <a condition the agent can check itself>
RETURN:    <the exact shape you want back>
```

Missing `OWNS` causes overwrites. Missing `DONE WHEN` causes an agent that never stops.
**Send independent dispatches in one message** — concurrent; separate messages run serially.

### Deliberately NOT used on build day

- **Agent teams.** Experimental and off by default; the docs exclude our case outright
  (*"for sequential tasks, same-file edits, or work with many dependencies, a single session or
  subagents are more effective"*); split panes don't work in VS Code or Windows Terminal; teams
  don't isolate teammates in worktrees. Enabling it also silently converts named subagents into
  teammates.
- **`ultracode` / automatic workflow orchestration.** Turns every substantive request into a
  multi-agent run. Ruinous with one shot and four hours of quota.

### Quota is the real risk

Running out of model quota at hour three with the demo unbuilt is the worst available outcome,
and parallelism causes it. Configured: subagents on **sonnet**, permissions pre-approved so
agents don't queue at the keyboard, `worktree.baseRef: "head"` so worktree agents see current
work. **If a limit is hit, stop dispatching and finish the spine by hand** — the spine is what
gets scored.

### Never dispatched

The idea decision · the demo narration · the final integration step · anything not yet verified
once by hand (delegating an unverified assumption parallelizes the error).

---

## Hard rules — do not violate these

### 1. All code must be written during the event

This is an MLH requirement and it governs how this repo may be populated.

- **Allowed before the build window:** this file, `README.md`, `LICENSE`, `.gitignore`,
  `.env.example`, planning docs under `docs/`, idea research, reading API documentation.
- **NOT allowed before the build window:** application source, components, schema,
  API routes, agent code, scaffolding generated by `create-next-app`, installed lockfiles.
- Consequence: **there is intentionally no `src/`, no `package.json`, and no framework
  scaffold in this repo yet.** That is not an oversight. The first commit of application
  code happens after opening remarks on Saturday.
- The official guide is stricter than the listing pages: **"Code or project materials
  written before the event: no."** Note "project materials" — broader than code alone.
  Research, ideas and sketches are explicitly allowed; a pre-written README or scaffold is
  arguably not.

**Repo strategy, because the risk is asymmetric.** Organizers *verify submissions before
demos* and rule breaks *can mean disqualification*. Everything committed here before 10:45 AM
is documentation and research only — the commit history shows `docs:` commits and zero
application code, which is exactly what "ideas and research" permits. Still, the cheapest
possible insurance is to **create a fresh repo for the submission at 10:45 AM** and treat
this one as the pre-event research notebook, carrying over only the LICENSE and the dataset
citations. Ninety seconds of work removes the entire argument.

### 2. Public repo + open-source license

Required for submission, and required for the MLH Best Open-Source AI Project prize.

- License is **MIT** (`LICENSE`). The guide names **MIT or Apache-2.0** as good choices, so
  this is confirmed correct. Do not change it, do not add a second conflicting license, and
  do not remove the copyright line.
- **The repo must STAY public after the event to remain prize-eligible.** Do not flip it
  private afterwards.
- The repo must be **public on GitHub before the 3:45 PM submission deadline.**
  See `ROADMAP.md` — this is a tracked row, not an assumption.

### 3. Secrets never get committed

`.env` is gitignored; `.env.example` is the tracked template. If a key is ever pasted into
a tracked file, rotate it — do not just amend the commit.

---

## Working agreements for this repo

- **Commit early and commit often. Commit frequently.** This is the first working
  agreement because it is the one that matters most here. Every meaningful unit of work is
  its own commit, pushed immediately — never batched into an end-of-day cleanup commit.
  A unit of work is anything worth describing in one sentence: a page renders, a route
  returns data, a prompt lands, a bug dies, a doc decision gets recorded.
  During this event, committing frequently does double duty: besides being the only
  recovery path when something breaks at hour four, a granular commit history timestamped
  inside the build window is the cleanest possible answer to any "was this pre-built?"
  question from the judges. Never leave the working tree dirty at the end of a work block.
- **Demo-first scoping.** Before building a feature, say the sentence the demo will use to
  show it. If there is no sentence, there is no feature.
- **One idea, cut ruthlessly.** With under five hours, the failure mode is three
  half-features instead of one that runs. Prefer a narrow thing that works end-to-end.
- **AI must be load-bearing.** "AI / data utilization" is a scored criterion. If the LLM
  could be removed and the demo would still work, the judges will notice.
- **Keep `docs/hackathon-brief.md` as the source of truth** on rules and schedule. If this
  file and the brief ever disagree, the brief wins and this file gets corrected.
- **Use Gemma 4 via the Gemini API as the model inside the product.** Not a preference — it
  is what makes the project eligible for Challenges 2 and 3. Name it in the README and show
  the integration in the demo. (Claude Code as a *coding agent* is allowed and disclosed.)
- **Name every model and cite every dataset in the README.** Both are explicit requirements,
  and "judges can verify how" is 20% of the score.
- **Verify against primary data, never against a name or a label.** The redistricting finding
  above was first inferred from a layer name (`...ReDist2026...`) and a placeholder string
  (`REPNAME = "Pending 11/03/2026 Election"`). Both were suggestive and neither was evidence —
  the placeholder only means the election has not happened yet. The conclusion survived only
  because it was then checked by geocoding real addresses and running point-in-polygon against
  both layers with a federal source as adjudicator. **A dataset's name, field label, or
  record count is not proof of what it contains.** Query it, read actual rows, and find a
  second source that can disagree with the first.
- **When a claim is challenged, re-derive it — do not defend it.** The fastest way to be
  wrong in front of judges is to have won an argument with your own collaborator.
- **ROADMAP.md is the north star.** Flip status cells as work lands, in the same step as
  the work. During a five-hour build this is the only shared view of where we are.

## Deferred feature: "I'll tell you what I care about" (decision 2026-10-22)

The free-talk interview mode is **switched off**, not deleted. Decided by Sharif before DeepStation
AI Demo Night after a production test at 1:15 PM:

- `/api/ask` took **51 s** and returned **no quotes** for either FL-24 candidate on rent and
  flooding, although Gilbert has positions on both through the 10 questions.
- Placing the voter from free talk alone took 21 s and gave a wide range (-0.5 to +0.1).
- With no yes/no answers, every race showed "Closest, on thin evidence (0)", in the ballot and the PDF.

**Where it lives:** `components/OpenTalk.tsx` (voice UI), `app/api/ask/route.ts` (search + Gemma 4
reading), the `openMode` / `openSaid` branches in `app/page.tsx`, and the "You talked about" section
in `components/MatchStep.tsx`. All untouched.

**How to turn it back on:** set `OPEN_TALK = true` in `app/page.tsx`. That restores the
"I'll tell you what I care about" button on the voice start screen (`VoiceInterview` shows it only
when `onOpen` is passed). Note that the default is now the typed 10 questions straight after the
address, so the chooser screen only appears via "Talk instead".

**The recommended redesign before re-enabling** (not a separate pipeline): Gemma 4 turns what the
person said into answers to the 10 interview questions ("you said rent is crushing you, so Yes on
housing, right?"), the person confirms, and everything downstream reuses the scoring, star rule,
PDF and share card that already work. Fix the `/api/ask` latency (51 s) either way. See
ROADMAP.md row 6.26.

## Repo layout

```
.
├── CLAUDE.md                   # this file — repo purpose + event rules
├── README.md                   # public-facing project README (judges read this)
├── LICENSE                     # MIT (OSI-approved; submission requirement)
├── ROADMAP.md                  # execution checklist for the build day
├── .env.example                # tracked template; real .env is gitignored
├── docs/
│   ├── hackathon-brief.md         # official rules, schedule, tracks, judging — SOURCE OF TRUTH
│   ├── data-sources-verified.md   # 13 Miami sources probed; live vs keyed vs stale vs hazard
│   ├── idea-gotv-miami.md         # GOTV idea evaluation + the redistricting evidence
│   ├── pre-event-checklist.md     # P0–P3 prep that is legal under "all code on the day"
│   ├── idea-shortlist.md          # candidate ideas per track; chosen at kickoff
│   └── demo-script.md             # the 2-minute demo, written before the code
└── scripts/                       # any command run more than once lives here
```

Application code lands here on Saturday, in a structure chosen once the idea is picked.
