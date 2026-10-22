# QA: polling place data, Nov 3 2026 General (run 2026-10-22)

## Verdict
**PARTLY CONFIRMED.**
- CONFIRMED: precinct list (756 IDs identical to the official 10/01/2026 list) and the 28-site early-voting list, dates and hours (match the official schedule PDF, 28 of 28).
- NOT CONFIRMED: which polling place serves which precinct. No official precinct-to-polling-place list is published online, so no precinct (including 535) could be compared against an official source.

## Precinct 535
- Layer: Paul Laurence Dunbar K-8 Center, 505 NW 20 St, Miami 33127, phone 305-576-3521.
- Official 2026 polling place for 535: **not found online.** Not checked against any official source.
- Venue 2750 NW 3rd Ave, via Census geocoder (-80.2012, 25.8023): both Precinct_gdb and Precinct2023_gdb return 535. The official cross-reference PDF (10/01/2026) lists 535 in Cong. District 24, consistent with the FL-24 finding in CLAUDE.md.
- Census geocoder matches "505 NW 20TH ST, MIAMI 33127" exactly, 143 m from the layer's mapped point.

## Freshness
| Layer | Last data edit (UTC) | Notes |
|---|---|---|
| Precinct_gdb (757 polygons) | 2025-01-14 (item modified 2025-06-02) | Description says "Updated: Every 10 yrs" |
| Precinct2023_gdb (750) | 2024-04-30 data edit | Older version; not used |
| PollingPlace_gdb (756 rows) | **2026-08-03** | Description only "Voters Polling Places"; no election or date field. Edited before the Aug 18 primary, so any later change is not captured. |
| ElectionGeography_public (28) | 2026-10-19 (FIU row edited 10-19; others 2026-08-26) | `nextelect` = 2026-11-03 on all rows, so this layer is explicitly for this election |
| VotingLocations_currentwait (28) | 2026-10-19 | Same 28 sites plus `waittime`; unused |

## Official sources
| Source | URL | Result |
|---|---|---|
| Early voting schedule | https://www.miamidade.gov//elections/library/early-voting/2026-11-03-general-election-early-voting-schedule.pdf | Found. 28 sites, Oct 19 to Nov 1, 7:00 AM to 7:00 PM every day. Footer "MR 8/24/2026" |
| Sample ballot | https://www.miamidade.gov/elections/library/2026-11-03-general-election-sample-ballot.pdf | Found. Same 28 sites and hours. No polling-place list |
| Precinct cross reference | https://www.miamidade.gov/elections/library/reports/precincts-district-cross-reference.pdf | Found, printed 10/01/2026. 756 precincts, districts only, no polling places |
| Polling place by precinct list | none | **Not found.** Pages searched: election-day, three-ways-to-vote, information, current-precincts-districts-municipalities, election detail page. Guessed 7 PDF names (all 404). The Voter Information Guide has no list |
| Official lookup | https://www.voterfocus.com/VoterInformationLookup/vflookup.html?county=DAD | Needs a registered voter's first name, last name, DOB, house number and CAPTCHA. Not scriptable and not an address-only check, so not used |
| Contacts | pollplaces@votemiamidade.gov, 305-499-8683 | Not contacted |

## Precinct set comparison
- Official 756 IDs vs PollingPlace_gdb 756 IDs: identical, one row per precinct, no duplicates, none blank.
- Precinct_gdb has 757 polygons: one extra, ID 100, absent from the official list and from PollingPlace_gdb. Not checked further.
- 517 distinct sites serve the 756 precincts (shared sites are normal).

## Sample of 26 precincts (every 30th by ID, plus 535)
The only independent check possible was address vs Census geocoder.

| Precinct | Layer name | Layer address | Census address check | Official comparison |
|---|---|---|---|---|
| 1 | Sunny Isles Beach Government Center | 18070 Collins Ave, Sunny Isles Beach | Match (Exact) | not checked |
| 43 | Miami Beach Police Department | 1100 Washington Ave, Miami Beach | Match (Exact) | not checked |
| 123 | Marjorie/William McDonald Center | 17051 NE 19 Ave, North Miami Beach | Match (Exact) | not checked |
| 153 | First Church of North Miami | 1200 NE 135 St, North Miami | Match (Exact) | not checked |
| 186 | Ojus Elementary School | 18600 W Dixie Hwy, Miami | Match (Exact) | not checked |
| 233 | Florida Memorial University | 15800 NW 42 Ave, Miami Gardens | Match (Exact) | not checked |
| 264 | Kelsey L. Pharr Elementary School | 2000 NW 46 St, Miami | Match (Exact) | not checked |
| 309 | Carl F. Slade Park | 2501 W 74 St, Hialeah | Match (Exact) | not checked |
| 340 | Benny Babcock Park | 651 E 4 Ave, Hialeah | Match (Exact) | not checked |
| 373 | West Lakes Preparatory Academy | 8435 W 36 Ave, Hialeah | No_Match | not checked |
| 413 | Greenglade Elementary School | 3060 SW 127 Ave, Miami | Match (Exact) | not checked |
| 446 | Firefighter's Memorial Building | 8000 NW 21 St, Doral | Match (Exact) | not checked |
| 505 | St. Matthew Freewill Baptist Church | 6700 NW 2 Ave, Miami | Match (Exact) | not checked |
| 535 | Paul Laurence Dunbar K-8 Center | 505 NW 20 St, Miami | Match (Exact) | not checked |
| 565 | Riverside Elementary School | 1190 SW 2 St, Miami | Match (Exact) | not checked |
| 595 | Jack Orr Senior Center | 550 NW 5 St, Miami | Match (Exact) | not checked |
| 625 | Coral Pine Park | 6955 SW 104 St, Pinecrest | Match (Exact) | not checked |
| 656 | Southside Preparatory Academy | 45 SW 13 St, Miami | Match (Exact) | not checked |
| 711 | Devon Aire K-8 Center | 10501 SW 122 Ave, Miami | Match (Exact) | not checked |
| 743 | Devon Aire Park | 10411 SW 122 Ave, Miami | Match (Exact) | not checked |
| 775 | Westwind Lakes Park | 6805 SW 152 Ave, Miami | Tie | not checked |
| 806 | Coral Reef Elementary School | 7955 SW 152 St, Palmetto Bay | Match (Exact) | not checked |
| 837 | Southwood Middle School | 16301 SW 80 Ave, Palmetto Bay | Match (Exact) | not checked |
| 890 | Air Base K-8 Center | 12829 SW 272 St, Homestead | Match (Exact) | not checked |
| 930 | Phichol Williams Community Center | 951 SW 4 St, Homestead | Match (Exact) | not checked |
| 982 | Alfred I. DuPont Building | 169 E Flagler St, Miami | Match (Exact) | not checked |

Census batch geocode of all 756 addresses: 698 Match, 52 No_Match, 6 Tie. For the 698 matches, the layer's mapped point (POINT_X/Y) agrees with the Census point within 150 m for 629 and within 850 m for all 698. This shows addresses and coordinates are internally consistent. It does not show the site is the official one.

## Mismatches
Against an official list: none could be computed.

Layer internal defects (seen in this run, and reported by the main session as 21 of 756 rows):
- LAT/LON fields disagree with the layer's own geometry and POINT_X/Y. Worst: 628 (LON equals LAT, 25.66116), 127/183/184 (42 km), 300/302/463 (20.6 km), 825/836 South Dade Government Center (17 km, about 10.6 mi), 227 (10 km). POINT_X/Y and the Census geocode agree with the geometry. The app already uses geometry (lib/arcgis.ts lines 59 to 69). I did not re-check the 21 count independently; my own >100 m count was 25 rows because it included a few 100 to 150 m differences.
- NAME values carry trailing spaces on some rows (e.g. 127, 300, 825). The app trims them.

## Early voting: layer vs official PDF
- Site count: 28 vs 28.
- Dates: layer 2026-10-19 07:00 to 2026-11-01 18:59 vs PDF Oct 19 to Nov 1. Match.
- Hours: PDF 7:00 AM to 7:00 PM daily. Layer `operdays` = "Varies", with no hours field, so hours come only from the PDF.
- Addresses: 27 of 28 match. Westchester Regional Library is "9445 Coral Way" in the layer vs "9445 SW 24TH Street" in the PDF. Same road, same zip 33165.
- Name differences only: "Elections Department (SOE Main Office)" vs "Office of the Supervisor of Elections"; "Stephen P. Clark Gov. Center" vs "Government Center".
- Trap: layer date epochs are local clock times stored as UTC (07:00 and 18:59). The app formats them with America/New_York, so the calendar date is unchanged (Nov 1 18:59 UTC is 2:59 PM EDT, still Nov 1). Do not render the time portion.
- The PDF notes South Dade Government Center is a temporary move replacing South Dade Regional Library. The layer comment says the same.
- Weekday check: Oct 19 2026 Monday, Nov 1 Sunday, Nov 3 Tuesday. Matches the PDF.

## Wording for the app
Say "Your polling place according to Miami-Dade County GIS data, last updated Aug 3, 2026. Confirm with your voter information card or at votemiamidade.gov/elections/voters/information.page, or call 305-499-8683." Do not say "official" or "confirmed" for the Election Day place. Early voting can be stated as matching the Supervisor of Elections' published schedule (7 AM to 7 PM daily, Oct 19 to Nov 1).

## Not checked
- Any official per-precinct polling place (none online).
- Whether any polling place moved after the Aug 18 primary or for the general.
- Precinct ID 100 extra polygon.
- Contacting pollplaces@votemiamidade.gov.
- A Wayback or prior-election comparison.

## Reproduce
```
B=https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services
curl -s "$B/PollingPlace_gdb/FeatureServer/0?f=json"   # editingInfo
curl -s "$B/PollingPlace_gdb/FeatureServer/0/query?where=PRECINCT%3D535&outFields=*&returnGeometry=false&f=json"
curl -s "$B/ElectionGeography_public/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json"
curl -sL -o ev.pdf "https://www.miamidade.gov//elections/library/early-voting/2026-11-03-general-election-early-voting-schedule.pdf" && pdftotext -layout ev.pdf -
curl -sL -o x.pdf https://www.miamidade.gov/elections/library/reports/precincts-district-cross-reference.pdf && pdftotext -layout x.pdf - | grep -E '^535'
curl -s --form addressFile=@batch.csv --form benchmark=Public_AR_Current https://geocoding.geo.census.gov/geocoder/locations/addressbatch
```
Note: votemiamidade.gov fails TLS verification from curl on this machine (exit 60); use -k for reads.
