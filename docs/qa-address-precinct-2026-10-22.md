# QA: address to precinct accuracy (run 2026-10-22)

## Verdict
**ACCURATE, WITH A SMALL NEAR-BOUNDARY ERROR RATE.** The app's precinct (and so polling place) matched the county's own address-point precinct for **288 of 290** Census-matched residential addresses (99.3%). Both misses sit within 21 m of a precinct line and both are real wrong-polling-place results. Production `/api/lookup` returned exactly the precinct implied by the Census point in **39 of 39** matched spot checks, so the app does what the code says; the errors come from the Census point, not from the app.

## Method
- Independent source: Miami-Dade `GeoAddress_gdb` (org 8Pc9XBTAsYuxx9Ny, 614,279 county address points, `outSR=4326`). Read real rows: house number, street, ZIP, municipality, FOLIO, point. This is the county's own address-point layer, not a geocoder. Pulled a 15,357-point pool (`MOD(OBJECTID,40)=7`).
- Residential filter: joined to `PaParcelView_gdb` by FOLIO and kept `DOR_CODE_CUR = '0101'` (single family). Only FOLIO, DOR_CODE_CUR and parcel geometry were requested; owner and mailing fields in that layer were never pulled (privacy).
- Truth for each address: the Precinct_gdb precinct containing the county address point (live ArcGIS point query; identical to a local polygon test for 294 of 294).
- App path: Census `addressbatch` (benchmark Public_AR_Current, same locator as the app's `onelineaddress`) point, then the same Precinct_gdb point query the app uses (lib/arcgis.ts).
- Distance to precinct boundary computed locally (UTM 17N) from the Precinct_gdb polygons.
- Sample, 294 addresses:
  - **Random stratum: 200**, one per precinct (200 distinct precincts), drawn without regard to boundary. 56 of them happen to be within 100 m of a line (28%).
  - **Near-boundary stratum: 94** extra, deliberately within 100 m of a line (about 50 within 30 m), disjoint from the random set.
  - Precinct lines are close to almost everyone: in the 15,357-point pool, 32% of addresses are within 100 m of a line and 7.7% within 30 m.
- Pacing: Census batch is one POST. About 590 ArcGIS point queries. Production at 1 request per second.

## Results (Census-matched only, n = 290)
| Group | Agree | n | Rate |
|---|---|---|---|
| All | 288 | 290 | 99.3% |
| Random stratum | 197 | 197 | 100.0% |
| **Near boundary (<=100 m), both strata pooled** | **145** | **147** | **98.6%** (95% Wilson about 95.2% to 99.6%) |
| Within 30 m of a line | 65 | 67 | 97.0% |
| 30 to 100 m | 80 | 80 | 100.0% |
| More than 100 m | 143 | 143 | 100.0% |

Census point vs county address point: median 24 m apart, 90th percentile about 41 m, max 133 m. Match type: 288 Exact, 2 Non_Exact (street-name spelling variants; both landed in the correct precinct).

Rough extrapolation, not measured: wrong-precinct rate across all matched addresses is on the order of 0.3% to 1%, concentrated in the roughly 8% of addresses within 30 m of a line.

## Every disagreement (2 of 290)
Both are **wrong polling place in the app**. The county address point is the better truth in both: the parcel (PaParcelView_gdb polygon) lies 100% inside the county-point precinct, and the Census point falls outside the parcel.

| # | Address | County point (lat, lon) | Census point (lat, lon) | Apart | County pt to nearest line | Truth precinct (polling place) | App shows (polling place) | Parcel share in truth precinct |
|---|---|---|---|---|---|---|---|---|
| 1 | 9350 SW 136TH ST, Miami 33176 | 25.64323, -80.34620 | 25.64344, -80.34545 | **78.3 m** (Census pt 56.7 m outside the parcel) | 21.1 m | **844** Palmetto Golf Course, 9300 SW 152 St, Palmetto Bay | 760 Suniland Park, 12855 S Dixie Hwy, Pinecrest | 100% |
| 2 | 200 NE 110TH TER, Miami 33161 | 25.87666, -80.19373 | 25.87671, -80.19394 | 21.5 m (Census pt 7.2 m outside the parcel) | 16.2 m | **152** New Generation SDA Church, 12800 North Miami Ave, North Miami | 154 Hubert O. Sibley K-8 Academy, 255 NW 115 St, Miami | 100% |

**Worst example: #1**, 9350 SW 136 St. Census interpolates 78 m east along the street range; the app sends the voter to Suniland Park in Pinecrest instead of Palmetto Golf Course in Palmetto Bay (a different municipality).

Caveat: county address points are a proxy for where a voter is registered. In these two cases the parcel is not split by any precinct line, so the proxy is reliable here.

## Census No_Match / Tie
- Residential sample (county-listed addresses): **4 No_Match of 294 (1.4%), 0 Tie.** Two sampled near a boundary, two random. Retrying one as a one-line address (766 SE 15TH AVE) also returned zero matches.
- For comparison, the earlier polling-place QA saw 52 No_Match + 6 Tie of 756 on polling sites (7.7%). Sites are non-residential, so that is not a fair rate for homes.
- Real addresses from a county list are friendlier than what voters type (typos, missing ZIP), so 1.4% is a floor. Not measured.
- App behavior on no match (production, all 4 tried): **HTTP 404** with `{"error":"We couldn't find that address. Try adding the city and ZIP."}`. No polling place and no guess (app/api/lookup/route.ts lines 25 to 29). There is no fallback geocoder.

## Production spot check (43 requests, 1 per second, https://hack-for-humanity-team.vercel.app)
Set: both disagreements, all 4 No_Match, 3 addresses where Census normalised the street name, 24 random within 30 m of a line, 10 random more than 100 m from a line.
- 39 matched addresses: **39 of 39** `polling.precinct` equals the precinct from the Census batch point, and `geo.lat/lon` equals the batch point (0.0 m difference in every case).
- Against the county address point: 37 of 39 (the 2 disagreements above).
- The 4 No_Match returned 404 as described.

| Address | HTTP | App precinct | Census-pt precinct | County-pt precinct |
|---|---|---|---|---|
| 9350 SW 136TH ST, MIAMI, FL 33176 | 200 | 760 | 760 | **844** |
| 200 NE 110TH TER, MIAMI, FL 33161 | 200 | 154 | 154 | **152** |
| 14751 NW S RIVER DR, MIAMI 33167 | 200 | 239 | 239 | 239 |
| 19626 SW 130TH AVENUE RD, MIAMI 33177 | 200 | 845 | 845 | 845 |
| 1201 MEADOWLARK AVE, MIAMI SPRINGS 33166 | 200 | 346 | 346 | 346 |
| 4 No_Match: 766 SE 15TH AVE Homestead; 28 NE 13TH CIR Homestead; 6255 SW 124TH ST Pinecrest; 5310 NW 183RD ST Miami Gardens | 404 | none | none | 897, 949, 628, 231 |
| 34 other near-boundary and random addresses | 200 | all equal | all equal | all equal |

The per-address output of all 43 requests was kept in the session scratchpad only, not in the repo.

## Traps and notes
- Privacy: addresses come from a public county address layer, with no names. PaParcelView_gdb contains owner names and mailing addresses; do not request those fields.
- This measures only the Census-vs-county-point difference against the Precinct_gdb polygons. It does not test whether Precinct_gdb or the PollingPlace_gdb assignment matches the official 2026 voter file (see docs/qa-polling-2026-10-22.md: no official precinct-to-site list is published).
- The voter's real registered address may differ from a geocoded point. About 8% of addresses are within 30 m of a line and 32% within 100 m, so a "near a precinct line? confirm with the county" note would be accurate.
- Failure mode is the one predicted: interpolated points near street-line boundaries. Both misses were inside the 30 m band. No miss was seen farther than 21.1 m from a line.

## Reproduce
```bash
B=https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services
# 1. County address layer: count and real rows
curl -s "$B/GeoAddress_gdb/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json"
curl -s "$B/GeoAddress_gdb/FeatureServer/0/query?where=OBJECTID%3C%3D3&outFields=HSE_NUM,PRE_DIR,ST_NAME,ST_TYPE,ZIP,MUNIC_NAME,FOLIO&outSR=4326&f=json"
# 2. Land-use filter (only FOLIO and DOR_CODE_CUR; never owner fields)
curl -s "$B/PaParcelView_gdb/FeatureServer/0/query?where=FOLIO%3D%273050210180100%27&outFields=FOLIO,DOR_CODE_CUR,DOR_DESC&returnGeometry=false&f=json"
# 3. Disagreement 1: precinct at county point, Census one-line, precinct at Census point
curl -s "$B/Precinct_gdb/FeatureServer/0/query?geometry=-80.34620051137031,25.64323207176395&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnGeometry=false&outFields=ID&f=json"
curl -s "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=9350+SW+136TH+ST%2C+MIAMI%2C+FL+33176&benchmark=Public_AR_Current&format=json"
curl -s "$B/Precinct_gdb/FeatureServer/0/query?geometry=-80.345454935289,25.643439449496&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnGeometry=false&outFields=ID&f=json"
# 4. Production (expect 760 and 154; truth is 844 and 152)
curl -s "https://hack-for-humanity-team.vercel.app/api/lookup?address=9350+SW+136TH+ST%2C+MIAMI%2C+FL+33176" | python -c "import json,sys;print(json.load(sys.stdin)['polling']['precinct'])"
curl -s "https://hack-for-humanity-team.vercel.app/api/lookup?address=200+NE+110TH+TER%2C+MIAMI%2C+FL+33161" | python -c "import json,sys;print(json.load(sys.stdin)['polling']['precinct'])"
# 5. No_Match behaviour (expect HTTP 404)
curl -s -w "\n%{http_code}\n" "https://hack-for-humanity-team.vercel.app/api/lookup?address=766+SE+15TH+AVE%2C+HOMESTEAD%2C+FL+33033"
```
Pipeline used (scratch scripts, not committed): page `GeoAddress_gdb` with `where=MOD(OBJECTID,40)=7`; download all 757 Precinct_gdb polygons and compute point-in-polygon and distance to boundary in EPSG:32617 (shapely, pyproj); filter DOR 0101; POST a CSV (id, street, city, FL, zip) to `https://geocoding.geo.census.gov/geocoder/locations/addressbatch` with `benchmark=Public_AR_Current`; run the Precinct_gdb point query for both the Census point and the county point; compare. Sample draw seed 20261022. Another `MOD(OBJECTID,40)=k` offset gives a fresh sample.
