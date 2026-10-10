# Verified data sources — probed 2026-10-09 (night before the event)

**Every row below was hit with a real request and the response inspected.** "The docs say it
exists" is not verification. This file exists so nobody spends build-day hours on a dataset
that turns out to be dead, private, or empty.

Probing ran from a scratch directory outside this repo, and only these findings were
committed — keeping every pre-event commit documentation-only, so the "all code written
during the event" rule stays unambiguous in the commit history.

---

## Live and usable, no API key needed

| Source | Endpoint | Evidence |
|---|---|---|
| **Miami-Dade 311 (2023)** | `services.arcgis.com/8Pc9XBTAsYuxx9Ny/.../data_311_2023/FeatureServer/0` | **343,851 records** (exact, via `returnCountOnly`), 26 fields, `CORS: *` |
| NWS gridpoint forecast | `api.weather.gov/points/25.7617,-80.1918` | HTTP 200, GeoJSON Feature |
| NWS active alerts (FL) | `api.weather.gov/alerts/active?area=FL` | **105 active alert features** |
| Open-Meteo (heat) | `api.open-meteo.com/v1/forecast?...hourly=temperature_2m,apparent_temperature` | 72 hourly points |
| NHC current storms | `nhc.noaa.gov/CurrentStorms.json` | **3 active storms** |
| NOAA tides (Virginia Key, stn 8723214) | `api.tidesandcurrents.noaa.gov/api/prod/datagetter` | latest water level returned |
| USGS gage height (FL) | `waterservices.usgs.gov/nwis/iv/?format=json&stateCd=fl&parameterCd=00065` | 906 KB active-site payload |
| FEMA NFHL (flood zones) | `hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer?f=json` | HTTP 200 — **note the `/arcgis/` path**; the `/gis/nfhl/` path 404s |
| FEMA disaster declarations | `fema.gov/api/open/v2/DisasterDeclarationsSummaries` | HTTP 200 |
| iNaturalist (40 km of Miami) | `api.inaturalist.org/v1/observations?lat=25.7617&lng=-80.1918&radius=40` | **729,237 total observations** |
| GBIF (South FL bbox) | `api.gbif.org/v1/occurrence/search` | 7,437,130 total |
| Miami-Dade flood zone changes | `.../Flood_Zone_Changes_Since_Last_Firm_Layer/FeatureServer` | 59,033 records |
| Miami-Dade preliminary flood line | `.../Preliminary_Flood_Zone_Line/FeatureServer/0` | 43,549 records |

## Needs a free API key — get it before the build starts

| Source | Issue | Fix |
|---|---|---|
| **Census / ACS** | Returns an HTML **"Missing Key"** page with **HTTP 200** — it does not fail loudly | Free instant key at `api.census.gov/data/key_signup.html`, then put it in `.env` |

> Internalize this failure mode: **HTTP 200 with an HTML error body.** Any code that checks
> only the status code will believe it succeeded, then explode on parse. Check the body.

## Not available

| Source | Finding |
|---|---|
| **`CongressionalDistrict_gdb`** (Miami-Dade) | **STALE — pre-redistricting map.** Agrees with the federal Census Geocoder on only **4 of 7** test addresses, vs **7 of 7** for `CongressionalDistrictReDist2026_gdb`. Dangerous because it carries *current* representatives' names, so it looks authoritative. **Do not use it for district lookup** — use the Census Geocoder. See `idea-gotv-miami.md` |
| Miami-Dade 311 **2024** | Layer exists but returns **"Token Required"** — private. **2023 is the newest public year.** |
| Miami-Dade 311 2025 / 2026 | Not published |

---

## The standout: Miami-Dade 311, 343,851 records

The strongest civic dataset available for this event, and it is ready to build on.

**Why it is strong:**
- **`Access-Control-Allow-Origin: *`** — callable straight from the browser. No proxy, no
  server route, no CORS debugging. That is real build time saved.
- Real server-side querying: `where`, `outFields`, `orderByFields`, `returnCountOnly`,
  `resultRecordCount` — so you never download 343k rows.
- Geocoded (`latitude`, `longitude`) and pre-bucketed by `neighborhood_district` and `zip_code`.

**The fields that contain an actual story:**

| Field | Why it matters |
|---|---|
| `issue_type`, `issue_description` | Messy category text — **a genuine job for an LLM**: clustering, classifying, summarizing themes |
| `neighborhood_district`, `zip_code`, `latitude`, `longitude` | Lets you compare *across* neighborhoods |
| `goal_days` vs `actual_completed_days` | **Promised service time vs. delivered service time** |
| `ticket_status`, `ticket_closed_date_time` | What never got closed |
| `sr_priority`, `method_received` | Who reports how (phone vs. app) — an access-equity angle |

**The civic question this dataset can actually answer:**

> *Does Miami-Dade fix the same problem faster in some neighborhoods than others?*

`goal_days` vs `actual_completed_days`, grouped by `neighborhood_district`, is a
service-equity *measurement* — not just a map of complaints. That lands squarely on the
"community impact" criterion instead of being another dots-on-a-map dashboard, which is what
several teams will build.

**Verified sample records** (newest by OBJECTID): illegal dumping, bulky trash complaints,
downed traffic signs. Real operational data, not placeholders.

**The honest weakness:** the newest public data is **2023**. Expect a judge to ask. The answer
is to frame the project around *patterns and equity*, where 2023 is perfectly valid evidence —
not *real-time response*, where it is not. Do not claim live data.

---

## Privacy warning — Wild Miami / Animal Services

The Miami-Dade "Animal Services" layer in the open-data catalog is **`ASD - Dangerous Dogs`**,
193 records, and its fields are:

`OWNER`, `ADDRESS`, `FOLIO`, `DOGNAME`, `PRIMARYBREED`, `PHOTOGRAPH`, ...

It contains **named private individuals and their home addresses.** Verified directly.

**Do not build a public demo that maps or displays these records.** It is published data, but
putting named residents' home addresses on a screen at an event called *Hack for Humanity*
is the wrong call ethically and would read badly in front of judges. For anything in the
animal-welfare direction, use **iNaturalist** or **GBIF** instead — 729k+ observations near
Miami, no personal data.

There is **no public Miami-Dade shelter intake/outcome dataset** in the catalog, which makes
Wild Miami the weakest-supported track on local open data. Worth knowing before picking it.

---

## Track readiness, based on what is actually live

| Track | Data readiness | Notes |
|---|---|---|
| **Data to Action** | **Strongest** | 311 at 343k rows, CORS-open, rich fields, real equity story |
| **Four Forces, One City** | Strong | NWS + Open-Meteo + NHC (3 live storms) + USGS + FEMA + county flood layers — all keyless |
| **Brain Gain** | Workable | Census ACS is the backbone, but **needs a key first** |
| **Wild Miami** | Weakest locally | No shelter data; the one county layer is a privacy hazard. iNaturalist/GBIF only |

## Copy-paste starting points

```bash
# 311: exact record count
curl -s "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/data_311_2023/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json"

# 311: 5 newest records, all fields
curl -s "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/data_311_2023/FeatureServer/0/query?where=1%3D1&outFields=*&resultRecordCount=5&orderByFields=OBJECTID%20DESC&f=json"

# 311: the service-equity query — promised vs actual, by neighborhood
curl -s "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/data_311_2023/FeatureServer/0/query?where=actual_completed_days%3E0&outFields=neighborhood_district,issue_type,goal_days,actual_completed_days&resultRecordCount=20&f=json"

# Live storms + Florida alerts
curl -s "https://www.nhc.noaa.gov/CurrentStorms.json"
curl -s "https://api.weather.gov/alerts/active?area=FL"
```

> ArcGIS `FeatureServer` notes: always pass `f=json`, and page with `resultOffset` +
> `resultRecordCount`. `maxRecordCount` caps a single response, so a naive "fetch everything"
> silently truncates.
