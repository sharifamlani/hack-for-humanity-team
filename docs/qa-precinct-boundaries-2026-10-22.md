# QA: Precinct_gdb boundary currency for Nov 3, 2026 (run 2026-10-22)

## Verdict
**MOSTLY CURRENT for assigning a voter to a precinct; NOT exact.** No newer precinct layer exists, so Precinct_gdb is the best public polygon source. Against the official 10/01/2026 cross-reference, 700 of 756 polygons (92%) sit wholly inside the official congressional, senate and house districts. 53 cross a district line by more than 2% of their area but remain dominantly in the official district. 3 disagree outright. Two structural gaps: (1) the layer holds one polygon per integer ID, so it cannot represent the 11 precincts the county split into ".1" sub-precincts; (2) precinct 100 is in the layer but not in the official list. Polygon data was last edited 2025-01-14, before the May 2026 redistricting; the county's 2026 reprecincting shows up as the split sub-precincts, not as new polygons.

## Counts (Precinct_gdb 757 polygons vs official xref)
| Measure | Count |
|---|---|
| Polygons in layer | 757 |
| Official integer precinct IDs (756 IDs; 767 rows incl. 11 ".1" sub-precincts) | 756 |
| Layer polygon not on official list | 1 (ID 100) |
| Official precinct with no polygon | 0 |
| Fully consistent (C, S, H each wholly within official set, overlaps under 2%) | 700 |
| Straddle a district line over 2%, dominant district matches official | 53 |
| Dominant district disagrees with official, or an official district has zero overlap | 3 |

Of the 56 problem precincts, 0 are split precincts (an official ".1" sub-precinct exists), which the layer cannot represent.

## Method
Official: xref PDF parsed by word coordinates with PyMuPDF (pdftotext -layout puts the House column on the wrong row; do not use it for House). Sub-precincts .0 and .1 are unioned per integer ID. Layer: Precinct_gdb, SenateDistrict_gdb, HouseDistrict_gdb, CongressionalDistrictReDist2026_gdb downloaded as GeoJSON (outSR 4326); areas computed in a local equirectangular projection; overlaps below 0.5% dropped. Shares include water area, so coastal precincts can show small overlaps that are artifacts. SenateDistrict_gdb and HouseDistrict_gdb are 2022 vintage (last data edit 2022-12-14); the legislature was not redrawn in 2026, so they should be valid, but this was not independently confirmed.

## Layer freshness (editingInfo)
| Layer | Features | Last data edit UTC |
|---|---|---|
| Precinct_gdb | 757 | 2025-01-14 |
| Precinct2023_gdb | 750 | 2024-04-30 |
| PrecinctGroup_gdb | 812 | data 2025-01-14 (metadata edit 2026-08-22) |
| CongressionalDistrictReDist2026_gdb | 5 | 2026-05-15 |
| SenateDistrict_gdb | 6 | 2022-12-14 |
| HouseDistrict_gdb | 16 | 2022-12-14 |

Precinct_gdb vs Precinct2023_gdb: 8 IDs added (396, 638, 647, 649, 650, 651, 653, 656), 1 dropped (661), 38 polygons changed by more than 1% (largest 394, 528, 981, 983). All of this predates the May 2026 law.

## Newer layer?
**None found.** Searched the org services list, ArcGIS Online (orgid 8Pc9XBTAsYuxx9Ny, query "precinct") and the Miami-Dade open data hub search (precinct, redistricting). Only Precinct_gdb, Precinct2023_gdb, PrecinctGroup_gdb and a "Precinct 2014-2015" link turn up. The SOE site offers no precinct shapefile; it publishes the PDF tables below. Not checked: the county redistricting ArcGIS apps linked from the redistricting page (redistricting.maps.arcgis.com), which might hold a reprecincting layer.

## Official sources found
| Source | URL |
|---|---|
| Precinct/district cross-reference (10/01/2026) | https://www.miamidade.gov/elections/library/reports/precincts-district-cross-reference.pdf |
| 2026 congressional reprecincting impact list: 115 precincts changed congressional district (24 to 25: 64; 26 to 24: 37; 27 to 28: 8; 28 to 27: 4; 26 to 28: 1; 103.0 old district N/A), including ".1" splits | https://www.miamidade.gov/elections/library/2026-congressional-reprecincting-precinct-district-assignment-impacts-filtered.pdf |
| Reprecincting page | https://www.miamidade.gov/elections/data/reprecincting.page |
| Redistricting page | https://www.miamidade.gov/elections/data/redistricting.page |
| Congressional districts with precincts and ZIPs | https://www.miamidade.gov/elections/library/reports/congressional-districts-with-precincts-and-zip-codes.pdf |

## Split precincts (the structural gap)
The cross-reference lists these as two rows (e.g. 116.0 in FL-24 and 116.1 in FL-25): [116, 281, 283, 285, 462, 489, 708, 710, 730, 745, 765]. Precinct_gdb has one polygon per integer ID, so a point lookup cannot tell .0 from .1. Congressional district differs between halves (and House for 745); the polling place may too. Not checked: whether PollingPlace_gdb has separate rows for these.

## Precinct ID 100
- Polygon about 25,000 m2 (roughly 0.3 km by 0.1 km), centre -80.3386, 25.8002 (near Miami Springs / airport). Touches only precinct 371. Present in both Precinct_gdb and Precinct2023_gdb.
- Not in the official 10/01/2026 cross-reference (099.0 then 101.0). No PollingPlace_gdb row for 100 (none for 661 either). PrecinctGroup_gdb does list PRECINCT=100.
- Overlay puts it in FL-26 / Senate 39 / House 111. The reprecincting impact PDF has one row "100.6" (FL-25, was FL-24) between 099.0 and 101.0; probably a typo or county-internal ID, and its district does not match where the polygon sits. Not resolvable from public data.
- Practical rule: treat 100 as retired or non-voting. A point landing in it should return "no precinct found", not a polling place. SOE contact: 305-499-8683 (not contacted).

## Problem precincts: hard disagreements (3)
Layer overlap shares by district vs official districts (union of sub-precincts).

| Precinct | Note | Layer shares vs official |
|---|---|---|
| 42 |  | S {34: 0.514, 36: 0.486} vs [36] |
| 43 |  | S {34: 0.585, 36: 0.415} vs [36] |
| 47 |  | S {38: 0.848, 36: 0.151} vs [36]<br>H {113: 0.85, 106: 0.15} vs [106] |

## Problem precincts: straddle over 2%, dominant district matches (53)

| Precinct | Note | Layer shares vs official |
|---|---|---|
| 3 |  | H {106: 0.948, 107: 0.052} vs [106] |
| 4 |  | H {106: 0.967, 107: 0.033} vs [106] |
| 10 |  | H {106: 0.979, 108: 0.021} vs [106] |
| 15 |  | H {106: 0.874, 108: 0.126} vs [106] |
| 33 |  | S {36: 0.702, 34: 0.298} vs [36] |
| 41 |  | S {36: 0.771, 34: 0.229} vs [36] |
| 48 |  | S {36: 0.53, 34: 0.469} vs [36] |
| 68 |  | S {34: 0.827, 37: 0.173} vs [34] |
| 101 |  | C {25: 0.954, 24: 0.045} vs [25]<br>S {37: 0.954, 34: 0.046} vs [37] |
| 125 |  | H {107: 0.98, 106: 0.02} vs [107] |
| 145 |  | C {24: 0.971, 25: 0.029} vs [24] |
| 151 |  | C {24: 0.974, 25: 0.026} vs [24] |
| 157 |  | C {24: 0.966, 25: 0.034} vs [24] |
| 168 |  | S {34: 0.944, 37: 0.056} vs [34] |
| 175 |  | C {25: 0.975, 24: 0.025} vs [25]<br>H {107: 0.956, 108: 0.026, 106: 0.018} vs [107] |
| 299 |  | C {24: 0.953, 26: 0.047} vs [24] |
| 329 |  | C {26: 0.965, 24: 0.035} vs [26]<br>H {110: 0.965, 109: 0.035} vs [110] |
| 359 |  | H {111: 0.976, 110: 0.024} vs [111] |
| 373 |  | H {111: 0.974, 110: 0.026} vs [111] |
| 396 |  | H {112: 0.921, 111: 0.079} vs [112] |
| 397 |  | H {112: 0.925, 111: 0.075} vs [112] |
| 443 |  | H {114: 0.95, 111: 0.047} vs [114] |
| 447 |  | C {27: 0.826, 26: 0.174} vs [27]<br>S {36: 0.826, 39: 0.174} vs [36]<br>H {116: 0.72, 111: 0.28} vs [116] |
| 470 |  | C {27: 0.905, 26: 0.095} vs [27]<br>S {36: 0.905, 39: 0.095} vs [36]<br>H {116: 0.851, 111: 0.149} vs [116] |
| 488 |  | C {28: 0.964, 26: 0.036} vs [28] |
| 503 |  | C {24: 0.918, 27: 0.082} vs [24] |
| 533 |  | C {24: 0.965, 27: 0.035} vs [24] |
| 534 |  | C {24: 0.978, 27: 0.022} vs [24] |
| 551 |  | H {114: 0.975, 112: 0.025} vs [114] |
| 552 |  | H {114: 0.973, 115: 0.028} vs [114] |
| 555 |  | C {26: 0.975, 24: 0.025} vs [26] |
| 589 |  | C {24: 0.975, 26: 0.025} vs [24] |
| 595 |  | H {109: 0.956, 113: 0.044} vs [109] |
| 605 |  | H {114: 0.952, 115: 0.049} vs [114] |
| 617 |  | H {114: 0.951, 113: 0.041, 120: 0.008} vs [114] |
| 629 |  | H {113: 0.96, 109: 0.04} vs [113] |
| 637 |  | S {39: 0.98, 36: 0.02} vs [39] |
| 642 |  | H {114: 0.978, 115: 0.022} vs [114] |
| 646 |  | H {114: 0.965, 115: 0.035} vs [114] |
| 657 |  | S {38: 0.941, 36: 0.059} vs [38] |
| 698 |  | S {34: 0.967, 36: 0.033} vs [34] |
| 707 |  | H {118: 0.975, 116: 0.025} vs [118] |
| 731 |  | C {27: 0.974, 28: 0.026} vs [27] |
| 749 |  | H {115: 0.961, 116: 0.039} vs [115] |
| 805 |  | C {28: 0.968, 27: 0.032} vs [28] |
| 808 |  | H {115: 0.499, 114: 0.266, 120: 0.235} vs [115] |
| 833 |  | H {115: 0.906, 117: 0.089} vs [115] |
| 882 |  | H {120: 0.781, 115: 0.185, 114: 0.035} vs [120] |
| 887 |  | H {120: 0.971, 117: 0.029} vs [120] |
| 908 |  | H {120: 0.954, 117: 0.046} vs [120] |
| 910 |  | S {38: 0.974, 40: 0.026} vs [38]<br>H {117: 0.976, 120: 0.024} vs [117] |
| 938 |  | C {28: 0.673, 27: 0.236} vs [28]<br>S {40: 0.673, 38: 0.236} vs [40] |
| 975 |  | C {24: 0.968, 27: 0.032} vs [24] |

## Traps
- One polygon per integer ID versus 11 official sub-precincts.
- Hard Senate disagreements (42, 43, 47) are not explained by reprecincting. Unresolved; may be boundary-edge differences between the county Senate layer and the SOE table.
- Shares include water area; shoreline precincts overstate straddles.
- Overlap shares only bound the risk; a point near a district line is the exposure.
- pdftotext -layout misaligns the House column. Use coordinates.

## Verdict per source
- Precinct_gdb: USE WITH CAVEAT (split precincts, ID 100, boundary straddles above). Show a "confirm at the official lookup" note.
- Official xref PDF: USE as the adjudicator for district assignment.
- Do not derive the congressional district from the precinct polygon for the problem precincts; use the Census geocoder district.

## Reproduce
```
B=https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services
for L in Precinct_gdb CongressionalDistrictReDist2026_gdb SenateDistrict_gdb HouseDistrict_gdb; do
  curl -sk "$B/$L/FeatureServer/0?f=json" | python -c "import json,sys;print(json.load(sys.stdin)['editingInfo'])"
  curl -sk "$B/$L/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson&resultRecordCount=2000" -o $L.geojson
done
curl -skL -o xref.pdf https://www.miamidade.gov/elections/library/reports/precincts-district-cross-reference.pdf
curl -skL -o impacts.pdf https://www.miamidade.gov/elections/library/2026-congressional-reprecincting-precinct-district-assignment-impacts-filtered.pdf
curl -sk "https://www.arcgis.com/sharing/rest/search?q=orgid:8Pc9XBTAsYuxx9Ny%20precinct&num=50&f=json"
```
Then: shapely overlay (area share of each precinct polygon per district polygon) and a PyMuPDF coordinate parse of xref.pdf (precinct x<60, congressional x~89, senate x~133, house x~181, same row within 4 pt of y). Scripts lived in the session scratchpad, not the repo.
