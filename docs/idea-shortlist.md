# Idea shortlist

**Purpose:** go into Saturday with 2–3 pre-vetted candidates per track so that the 10:20–10:45
window is spent *choosing*, not *brainstorming*. Also gives us a #2 idea to fall back to when
a data source turns out to be dead (see `ROADMAP.md` §5, smoke S5).

**Status:** data sources verified (see `data-sources-verified.md`); **track + ideas still unchosen.**
Ideas are allowed before the event; code is not.

---

## Scoring rubric (mirrors the judges' criteria)

Score each candidate 1–5 per column. The **Feasibility** column is the tiebreaker, because a
4h45m build punishes ambition far more than it rewards it.

| Criterion | Question |
|---|---|
| **Impact** | Who in Miami is measurably better off, and can we name them? |
| **AI load-bearing** | If the LLM were removed, would the demo still work? (It must not.) |
| **Originality** | Would a judge have seen three of these today? |
| **Demo clarity** | Can it be understood in 2 minutes with no setup? |
| **Feasibility** | Can a thin end-to-end slice run by 12:30 PM? |
| **Data ready** | Does a real, live, verified data source exist — checked, not assumed? |

---

## Candidates

### Track 1 — Four Forces, One City (flooding, hurricanes, housing, extreme heat)

| Idea | Impact | AI | Orig | Demo | Feas | Data | Notes / data source |
|---|---|---|---|---|---|---|---|
| _TBD_ | | | | | | | |

### Track 2 — Wild Miami (animal welfare)

| Idea | Impact | AI | Orig | Demo | Feas | Data | Notes / data source |
|---|---|---|---|---|---|---|---|
| _TBD_ | | | | | | | |

### Track 3 — Brain Gain (talent retention)

| Idea | Impact | AI | Orig | Demo | Feas | Data | Notes / data source |
|---|---|---|---|---|---|---|---|
| _TBD_ | | | | | | | |

### Track 4 — Data to Action (open-data visualization)

| Idea | Impact | AI | Orig | Demo | Feas | Data | Notes / data source |
|---|---|---|---|---|---|---|---|
| _TBD_ | | | | | | | |

---

## Candidate data sources to verify Friday night

Reading API docs and curling an endpoint is research, not writing code — allowed pre-event.
For each source actually used, record: endpoint, auth needed, record count, recency of the
newest record, and whether CORS blocks browser-side calls.

| Source | What it has | Verified? |
|---|---|---|
| Miami-Dade County Open Data Hub | County-wide datasets (ArcGIS-based) | ✅ ArcGIS Hub search live |
| City of Miami Open Data Portal | City-level datasets | ✅ portal reachable |
| NOAA / National Hurricane Center APIs | Storm tracks, surge, advisories | ✅ **3 active storms** + tides |
| NWS api.weather.gov | Forecasts, heat and flood alerts (keyless) | ✅ **105 active FL alerts** |
| USGS water services | Gauge and flood-stage data | ✅ 906 KB active-site payload |
| FEMA National Flood Hazard Layer | Flood zone geometry | ✅ via `/arcgis/` path (not `/gis/nfhl/`) |
| Census / ACS API | Demographics, migration, income | ⚠️ **needs free key** (HTTP 200 + HTML error without one) |
| BLS / Census LEHD | Jobs, wages, in/out-migration (Brain Gain) | ⏸ not probed |
| Miami-Dade Animal Services | Shelter intake/outcome data (Wild Miami) | 🚨 **no shelter data** — layer is `ASD - Dangerous Dogs` w/ owner names + home addresses. Do not display |
| iNaturalist / GBIF APIs | Species observations (Wild Miami) | ✅ 729,237 obs near Miami |
| Miami-Dade 311 service requests | Citizen-reported issues | ✅ **343,851 rows, CORS `*`** — strongest source. 2023 is newest public year |

> **Rule for this table:** a row only flips to ✅ after an actual request returned actual
> records. "The docs say it exists" is not verification — that is exactly the assumption that
> kills hackathon projects at 1 PM.
>
> Probed 2026-10-09. Full evidence, field lists, and copy-paste queries: `data-sources-verified.md`.

---

## Decision log

| Time | Decision | Why |
|---|---|---|
| | | |
