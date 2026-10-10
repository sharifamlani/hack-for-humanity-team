# Idea evaluation — GOTV Miami + voter ideal-point scaling

**Status:** evaluated 2026-10-10, pre-build. Every data path below was probed with a real
request. No code written.

**The idea as proposed:** enter phone number + address → get your representative info
(from congress.gov) → find your voting location → take a policy battery scaled by an IRT
model (Bafumi et al.) that reports your political ideology.

**Verdict: the core is strong and the data exists — but one stated data path doesn't work,
one input should be dropped, and as scoped this is three products instead of one.**

---

## 1. The factual correction: congress.gov cannot do address → representative

Verified against `api.congress.gov/v3` — the `member`, `bill`, and `house-vote` endpoints all
return HTTP 200. But the API serves **legislative data**: bills, members, committees, roll
calls. It has **no geocoding and no district lookup.** You cannot hand it an address.

**The working path instead — Census Geocoder, keyless, verified:**

```
https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress
  ?address=<address>&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json
```

Probed with the venue's own address (2750 NW 3rd Ave) and it returned, in one call:

| Geography | Value |
|---|---|
| **120th Congressional District** | **FL-24** |
| State Senate District | 36 |
| State House District | 108 |
| Plus | county, place, tract, block, ZCTA, school district |

That's better than the original plan: one keyless call gives you **federal *and* state**
districts, which matters because downballot races are where GOTV effort is usually most
decisive.

Then join district → member via either `api.congress.gov/v3/member` (needs a free
api.data.gov key) or the keyless `unitedstates.github.io/congress-legislators/legislators-current.json`
(verified: 539 members, 27 current FL House members).

**Do not build on the Google Civic Information API.** Its endpoints still route but reject
without a valid key, and Google announced deprecation of the representatives endpoint — the
thing most GOTV tools were built on. Census Geocoder is verified, keyless, and not going away.

---

## 2. The upgrade: your IRT model doesn't need to estimate item parameters

This is the most important finding, and it makes the hardest feature the *easiest* one.

**Voteview publishes DW-NOMINATE cutpoints for every roll call.** Verified:
`voteview.com/static/data/out/rollcalls/H119_rollcalls.csv` — 674 House roll calls of the
119th Congress, through 2026-09-16, and **all 674 carry `nominate_mid_1` (the cutpoint) and
`nominate_spread_1`.** The member file (`H119_members.csv`, 453 rows, 29 Florida) carries
`nominate_dim1` — each member's ideal point **in the same space.**

So the design becomes:

> Ask the respondent how they would have voted on ~10 **real, recent, named bills**. Each has
> a known cutpoint. Place the respondent on the **same DW-NOMINATE scale as members of
> Congress.** Then compare their score directly to their own representative's `nominate_dim1`.

This is not an approximation of the literature — it *is* the literature's design. Bridging
voters into legislator space via shared roll-call items is **Bafumi & Herron (2010),
"Leapfrog Representation and Extremism," APSR**, and the same move appears in
**Jessee (2009), APSR**. If "Bafumi et al." meant **Bafumi, Gelman, Park & Kaplan (2005),
"Practical Issues in Implementing and Understanding Bayesian Ideal Point Estimation,"
Political Analysis** — that paper's central warning is about **identification and anchoring**,
and this approach sidesteps it entirely: you are not estimating a new latent space, you are
**projecting one respondent into an already-identified one.** The scale is fixed by DW-NOMINATE
before the respondent answers anything.

### Why this is feasible in under five hours

**No MCMC. No Stan. No sampler.** With cutpoints fixed, estimating one respondent's θ is a
one-dimensional likelihood maximization — a grid search over a few hundred θ values. It runs
in milliseconds, is fully deterministic, and has no convergence diagnostics to babysit. A
full Bayesian ideal-point estimation would be the wrong tool here and would not finish.

### The trap: most roll calls carry no information

Of the 674 votes, **101 have `nominate_spread_1` exactly 0** — near-unanimous votes that
discriminate between nobody. Building the battery from those produces a confident-looking
score that means nothing.

Filtering to `|spread_1| > 0.3` **and** both sides over 40 votes leaves **443 usable items.**
The strongest recent ones are the close party-line votes — verified examples:

| Date | Bill | Cutpoint | Spread | Margin | Subject |
|---|---|---|---|---|---|
| 2026-09-15 | HRES1530 | −0.221 | −0.512 | 214–211 | Rule for H.R. 9576 |
| 2026-09-15 | HR2140 | +0.316 | +0.727 | 343–79 | Diesel Emissions Reduction Act |
| 2026-09-15 | HJRES210 | +0.098 | −0.542 | 216–211 | CRA disapproval |
| 2026-09-15 | HCONRES93 | −0.111 | +0.639 | 220–204 | War Powers directive |
| 2026-09-16 | HR10326 | −0.117 | −0.517 | 217–207 | PROOF Act |
| 2026-09-16 | HJRES213 | +0.098 | −0.541 | 214–208 | CRA disapproval |

Item selection **is** the methodology here. Pick items spanning a range of cutpoints, not ten
items that all cut at the same place — otherwise θ is only identified in one narrow region.

---

## 3. Polling locations: solved, and richer than expected

A catalog search for "miami dade polling place" returns a trap — a 98-row "Polling Place
Locater" layer that is **actually in Ireland** (Eircodes, County Meath schoolhouses, Irish
Transverse Mercator projection). Verified and discarded.

Miami-Dade's own ArcGIS org (942 public services) has the real thing. All verified live, all
`CORS: *`:

| Service | Records | Contents |
|---|---|---|
| **`PollingPlace_gdb`** | **756** | `PRECINCT`, `NAME`, `ADDRESS`, `CITY`, `ZIPCODE`, `PHONE`, `LAT`, `LON` |
| **`Precinct_gdb`** | **757** | Precinct **polygons** (join key `ID`) |
| **`ElectionGeography_public`** | **28** | "Voting Locations" — **early voting centers**, with `earlyvoting`, `operdays`, `handicap`, `agencyurl`, `phone` |
| `CongressionalDistrictReDist2026_gdb` | 5 | Miami-Dade districts **as redrawn for 2026** |

The lookup chain needs no client-side geometry: ArcGIS does **server-side point-in-polygon**
(`geometry=lon,lat&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects`), so
address → lat/lon → precinct polygon → join to polling place by `PRECINCT`.

`ElectionGeography_public` is the sleeper. It carries **`handicap` (accessibility) and
`operdays` (hours)** for the 28 early-voting centers — and Florida early voting for Nov 3
opens in roughly a week. "Which nearby early-voting site is accessible and open Saturday"
is a real question no mainstream tool answers well.

### The ethical constraint — do not skip this

**Wrong polling-place information is voter suppression, even when accidental.** The county
layer carries no freshness guarantee, and precinct assignments move.

**Always render the official lookup as the authoritative source** next to whatever you
compute: Miami-Dade Supervisor of Elections (`miamidade.gov/global/elections/home.page`,
verified HTTP 200) and the state's voter lookup
(`registration.elections.myflorida.com/CheckVoterStatus`, verified HTTP 200). Present your
own result as "most likely, confirm here." That is both the right call and the right answer
when a judge asks.

---

## 4. Drop the phone number

Collecting a phone number buys nothing for this demo and costs real exposure:

- **TCPA.** Political texts to mobile numbers require prior express consent. Statutory damages
  run $500–$1,500 *per message*. A hackathon demo with no consent record is not where you
  want to start a calling list.
- **PII with no infrastructure.** No retention policy, no deletion path, no encryption story.
- **Zero demo value.** The address drives everything — district, precinct, polling place. The
  phone number drives nothing on screen.
- **Judge optics.** At an event named *Hack for Humanity*, a form that harvests phone numbers
  reads badly, and someone will ask what you do with them.

If a follow-up channel is part of the pitch, say it as roadmap — don't collect in the demo.
Better still: keep the address **client-side only** and store nothing. "We don't keep your
address" is a strong line in a civic demo.

---

## 5. The real problem: this is three products

Rep lookup, polling-place finder, and an ideology scaler are each a standalone demo. In
~4h45m, three features means three half-features — and "working build" is a scored criterion.

There's also an originality asymmetry worth naming plainly:

| Piece | Useful? | Original? |
|---|---|---|
| Rep lookup + polling place | Very | **No** — Vote.org, BallotReady, Vote411 all do this. A judge may say "this exists" |
| IRT ideal-point scaling | Indirectly | **Yes** — nobody ships psychometrically-grounded voter placement in a GOTV tool |

The useful part is unoriginal; the original part isn't obviously useful. Shipping both as
separate features gets you dinged on both.

### The synthesis that makes it one product

Use the ideal point to answer a question the voter actually has:

> **"How well does the person representing you actually represent you?"**

One flow: address → your district and representative → ten real bills → your θ on the
DW-NOMINATE scale → **your representative's θ on the same scale** → the specific roll calls
where you two diverged → that seat is on the ballot Nov 3 → here's your polling place.

That is one narrative, not three features. And it scores on every criterion at once:
**community impact** (a representation gap is a concrete finding), **AI/data utilization**
(the scaling is load-bearing — remove it and there's no product), **originality** (the
comparison is the novel part), **working build** (one path, end to end), **demo clarity** (one
sentence of setup).

**The demo line:**
> *"You scored −0.4. Your representative votes at +1.2. On seven of these ten bills, you'd
> have voted differently. That seat is on the ballot November 3rd — and here's where you vote."*

### Where the LLM is genuinely load-bearing

Not in the scaling — that's deterministic psychometrics, and it should be. Use the model for:
- **Translating roll calls into plain language.** "Providing for consideration of the bills
  H.R. 9576 and H.R. 9497" is unanswerable by a normal person. Turning 443 procedural vote
  descriptions into neutral, answerable questions is real work, hard to fake, and visible.
- **Neutrality is the hard part.** The question wording must not telegraph a side. Say so in
  the demo — judges notice teams that name their own failure modes.

---

## 6. Two wrinkles to handle deliberately

**Redistricting — verified, and it breaks the core comparison.**

Florida ran a **mid-decade redistricting**. Special session April 20–24, 2026; signed into law
**May 4, 2026**; **21 of Florida's 28 congressional districts reworked**; effective with the
**2026 election cycle**; the Florida Supreme Court rejected the challenge, so the new lines
are in use. Districts 1–7 unchanged.

Confirmed in the data, not just the news. Geocoding real addresses and running
point-in-polygon against both county layers, with the federal Census Geocoder as adjudicator:

| Address | Old lines (`CongressionalDistrict_gdb`) | New lines (`ReDist2026`) | Census (120th) |
|---|---|---|---|
| **2750 NW 3rd Ave (the venue), Wynwood** | **FL-26** | **FL-24** | FL-24 |
| 1700 Convention Center Dr, **Miami Beach** | **FL-24** | **FL-25** | FL-25 |
| 18070 Collins Ave, **Sunny Isles Beach** | **FL-24** | **FL-25** | FL-25 |
| 111 NW 1st St, Downtown Miami | FL-27 | FL-27 | FL-27 |
| 501 Palm Ave, Hialeah | FL-26 | FL-26 | FL-26 |
| 1 Alhambra Plz, Coral Gables | FL-27 | FL-27 | FL-27 |
| 790 NW 1st Ave, Homestead | FL-28 | FL-28 | FL-28 |

**`ReDist2026` agrees with the federal geocoder on 7 of 7; the county's other layer agrees on
only 4 of 7.** So `CongressionalDistrict_gdb` is the **stale, pre-redistricting map** despite
carrying current representatives' names, and **3 of 7 sampled addresses changed district.**

> Correction on method: the original basis for this claim was the `REPNAME` placeholder
> string, which only means the *winner* is not yet known and says nothing about boundaries.
> Right conclusion, weak evidence. The actual proof is the May 2026 statute plus the
> point-in-polygon disagreement above.

### Why this is a problem, not just a framing opportunity

The plan was: look up "your representative," then compare the voter's ideal point to that
member's `nominate_dim1`. Redistricting makes **"your representative" ambiguous**, and the two
answers diverge for a large share of Miami-Dade addresses:

- **Who represents you today** (119th Congress, old lines) — a Wynwood voter is currently in
  Diaz-Balart's FL-26.
- **Which district you vote in on Nov 3** (new lines, 120th) — that same voter is in FL-24.

Those are different people, different parties, and different voting records. Comparing a
Wynwood voter's ideal point to FL-24's incumbent when FL-26's member is the one who has
actually been representing them is simply the wrong number. Miami Beach is starker: it moves
into **FL-25**, currently held by a **Broward** representative.

And where a redrawn district has no incumbent running, "your rep's voting record" does not
exist at all — so the DW-NOMINATE comparison has nothing to compare against.

**This has to be a deliberate design decision, stated out loud:**

| Framing | Compare against | Honest claim |
|---|---|---|
| **Accountability** | The member who represented you under the **old** lines | "Here is how the person who has represented you actually voted" |
| **Ballot** | The **new** district's incumbent / candidates | "Here is who you will be voting on" |

**Strongest version: show both.** *"You have been represented by X. On November 3 you vote in
district Y."* That turns the complication into the spine of the product — and it is a real,
specific, verifiable Miami problem affecting a nameable group of people, which is exactly what
the 30%-weighted community-impact criterion asks for.

### Hard data requirement

**Do not build on `CongressionalDistrict_gdb` — it is the stale map.** Use the **Census
Geocoder** (returns 120th-Congress districts natively, agreed 7/7, keyless) as the source of
truth, and `CongressionalDistrictReDist2026_gdb` only as a supplement.

Sources: [NBC News on passage](https://www.nbcnews.com/politics/2026-election/florida-legislature-passes-redistricting-plan-creating-four-additional-rcna342656) ·
[Florida Supreme Court ruling](https://www.nbcnews.com/politics/2026-election/florida-supreme-court-rejects-challenge-new-gop-drawn-congressional-ma-rcna349602) ·
[WGCU on the changes](https://www.wgcu.org/2026-05-05/breaking-down-the-changes-in-floridas-new-congressional-districts)

**Nonpartisanship.** A tool that scores ideology and then compares it to an incumbent can be
read as oppositional. Keep it **descriptive, never persuasive**: show the gap, cite the roll
calls, link official sources, never recommend a candidate or a party. State the nonpartisan
framing out loud in the demo.

---

## Verified data paths, summary

| Need | Source | Status |
|---|---|---|
| Address → congressional + state districts | Census Geocoder | ✅ keyless, FL-24 / SD36 / HD108 returned |
| District → member details | `congress-legislators` JSON | ✅ keyless, 27 FL House members |
| Member details, bills, roll calls | `api.congress.gov/v3` | ✅ 200 on member / bill / house-vote (needs free api.data.gov key) |
| Member ideal points | Voteview `H119_members.csv` | ✅ 453 rows, `nominate_dim1` |
| Roll-call cutpoints (the IRT anchor) | Voteview `H119_rollcalls.csv` | ✅ 674 rolls, 100% have cutpoints; **443 usable after filtering** |
| Polling places | `PollingPlace_gdb` | ✅ 756 records, CORS `*` |
| Precinct polygons | `Precinct_gdb` | ✅ 757 polygons, server-side point-in-polygon |
| Early voting + accessibility | `ElectionGeography_public` | ✅ 28 centers, `handicap` + `operdays` |
| Authoritative voter lookup (to link) | Miami-Dade SOE / FL DOE | ✅ both HTTP 200 |
| Address → representative | ~~congress.gov~~ | ❌ **API has no geocoding** — use Census Geocoder |
| Representatives by address | ~~Google Civic~~ | ❌ deprecation announced — do not build on it |

## Track fit

**Data to Action** is the natural fit — this is open data turned into individual civic action,
and it was already the strongest-supported track. It also touches **Brain Gain** (civic
attachment and retention) if that framing is preferred.
