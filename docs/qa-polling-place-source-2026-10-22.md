# QA: independent confirmation of PollingPlace_gdb precinct -> polling place (run 2026-10-22)

## Verdict
**CONFIRMED for 751 of 756 precincts; 4 precincts are WRONG in the layer and 1 has a stale name.** An official county "Precinct / Polling Place List" for the 11/03/2026 General exists (generated 10/15/2026); the prior QA missed it. Layer is stale for precincts **99, 253, 801, 805** (sites changed after the layer's 2026-08-03 edit) and 389 (name only). **Precinct 535 MATCHES** (Paul Laurence Dunbar K-8 Center, 505 NW 20 St).

## Source-by-source
| # | Source / URL | Worked? | Why |
|---|---|---|---|
| 1 | Google Civic Info `https://www.googleapis.com/civicinfo/v2/elections` and `/voterinfo` with the .env key | FAILED | HTTP 400 `API key not valid. Please pass a valid API key.` (API_KEY_INVALID, service civicinfo.googleapis.com). Same key returns HTTP 200 on the Gemini models list. Did not try to enable it. |
| 2a | **Official 11/03/2026 list** `https://www.miamidade.gov/elections/library/2026-11-03-general-election-polling-place-list.pdf` | **WORKED (authoritative)** | HTTP 200 PDF, 23 pages, header "10/15/2026 ... 914 2026 General Election - 11/03/2026", footer 767 precincts / 516 boards / 515 polling places. 753 distinct integer precinct IDs. Live only, not in Wayback CDX. |
| 2b | Primary list `.../2026-08-18-primary-election-polling-place-list.pdf` | WORKED | Layer matches it 751/756 (see mismatches). |
| 2c | Aug 18 permanent and temporary change notices (`...-permanent-polling-place-changes.pdf`, `...-temporary-polling-place-changes.pdf`) | WORKED | 200; 26 permanent + 12 temporary rows. Layer already reflects them. |
| 2d | Nov 3 permanent/temporary change notices (guessed names) | FAILED | no response / not in CDX. Unknown if they exist. The 2a list marks temporary sites with "T" (17 rows). |
| 2e | Wayback CDX `web.archive.org/cdx/search/cdx?url=miamidade.gov/elections/library/*` | WORKED | 2,157 URLs; lists every past `*polling-place-list.pdf`. No Nov 3 2026 snapshot. |
| 3 | Vote411, vote.org, BallotReady, Democracy Works | not checked | unnecessary once the official list was found |
| 4 | Prior list `.../2024-11-05-general-election-polling-place-list.pdf` | WORKED | used for moved-since-2024 list; indicative only (parser dropped some rows at page breaks) |

VoterFocus not used. No personal data touched.

## Method
All 756 layer rows compared (not a sample). PDF converted with `pdftotext -raw` (NOT `-layout`, which shifts names one row off the precinct IDs), wrapped names re-joined, page footers skipped. MATCH = normalised layer NAME and ADDRESS both appear in the official row. Precincts 545, 903, 988 were flagged missing by the parser only because a footer followed them; verified by grep, they match.

## Result: 751 / 756 MATCH
| Precinct | Layer says | Official 11/03/2026 says | Notes |
|---|---|---|---|
| **99** | Williams Island Club House, 4500 Island Blvd, Aventura | **Williams Island Building 2800**, 2800 Island Blvd, Aventura 33160 | different building; layer = primary list |
| **253** | Palm Court Apartments, 930 NW 95 St | **New Shiloh Missionary Baptist Church**, 1350 NW 95 St, Miami 33147 | different site |
| **801** | Sgt. Joseph Delancy Park, 14450 Boggs Dr | **Glendale Baptist Church (TEMPORARY)**, 14580 SW 117 Ave, Miami 33186 | different site |
| **805** | Sgt. Joseph Delancy Park, 14450 Boggs Dr | **Glendale Baptist Church (TEMPORARY)**, 14580 SW 117 Ave | same as 801 |
| 389 | Palm Springs North Elementary School, 17615 NW 82 Ave | Palm Springs North K-8 Center, same address | name only |

**Precinct 535:** official `535.0 Paul Laurence Dunbar K-8 Center 505 NW 20 St Miami 33127` = layer. MATCH.

### .0 / .1 sub-precincts
The official 2026 list has separate `.0` and `.1` lines for 116, 281, 283, 285, 462, 489, 708, 710, 730, 745, 765. In all 11, both halves list the SAME site (name and address identical), and it equals the layer's single row. One layer row per integer ID is therefore correct for site lookup.

### Temporary ("T") sites in official list (17 rows)
2, 127, 183, 184, 227, 300, 305, 372, 404, 424, 548, 670, 705, 801, 805, 825, 836. All but 801/805 match the layer (temporary since the primary). Consider showing "temporary location".

## Traps
- Layer is a pre-primary snapshot; 4 sites changed afterward. The list is dated 10/15/2026; more temporary changes could still be posted. Re-check before demo.
- `pdftotext -layout` silently mis-pairs names and precincts; use `-raw`.
- No coordinates in the PDF; geocode addresses.
- Civic Info key unusable.

## Recommended action
Patch 99, 253, 801, 805 (rename 389) from the official list, flag the 17 T rows as temporary, cite the PDF URL.

## Moved since the 2024 General (62 precincts: 50 site/address changes, 12 name only; informational, layer is current for these)
| Precinct | 2024 official | Layer | Change |
|---|---|---|---|
| 2 | St. Mary Magdalen Catholic Church 17775 N Bay Rd Sunny Isles Beach | Gateway Park, 151 Sunny Isles Blvd | SITE/ADDRESS CHANGED |
| 5 | Arlen House Condo West 500 Bayview Dr Sunny Isles Beach | Arlen House Condo West, 350 Bayview Dr | SITE/ADDRESS CHANGED |
| 68 | Arlen House Condo West 500 Bayview Dr Sunny Isles Beach | Arlen House Condo West, 350 Bayview Dr | SITE/ADDRESS CHANGED |
| 99 | T Williams Island 2800 Building 2800 Island Blvd Aventura | Williams Island Club House, 4500 Island Blvd | SITE/ADDRESS CHANGED |
| 127 | Washington Park Community Center 15290 NE 15 Ct North Miami Beach | Hazel Crawdford Neighborhood Resource Center, 1528 NE 152 Ter | SITE/ADDRESS CHANGED |
| 142 | Shalom Community Church 900 NE 132 St North Miami | Beree Seventh Day Adventist Church, 13018 NE 8 Ave | SITE/ADDRESS CHANGED |
| 183 | Washington Park Community Center 15290 NE 15 Ct North Miami Beach | Hazel Crawdford Neighborhood Resource Center, 1528 NE 152 Ter | SITE/ADDRESS CHANGED |
| 184 | Washington Park Community Center 15290 NE 15 Ct North Miami Beach | Hazel Crawdford Neighborhood Resource Center, 1528 NE 152 Ter | SITE/ADDRESS CHANGED |
| 206 | Norland United Methodist Church 885 NW 195 St Miami Gardens | Grace United Community Church, 901 NW 183 St | SITE/ADDRESS CHANGED |
| 227 | A. J. King Park 4250 NW 178 St Miami Gardens | Dr. Lester B. Brown Park, 19405 NW 32 Ave | SITE/ADDRESS CHANGED |
| 300 | Country Club of Miami 6801 NW 186 St Hialeah | Norman & Jean Reach Park, 7895 NW 176 St | SITE/ADDRESS CHANGED |
| 302 | Norman & Jean Reach Park 7901 NW 176 St Hialeah | Norman & Jean Reach Park, 7895 NW 176 St | SITE/ADDRESS CHANGED |
| 303 | Sunrise Presbyterian Church 18400 NW 68 Ave Hialeah | Country Club of Miami South Park, 6881 NW 179 St | SITE/ADDRESS CHANGED |
| 305 | Miami Lakes Branch Library 6699 Windmill Gate Rd Miami Lakes | Miami Lakes United Methodist Church, 14800 Ludlam Rd | SITE/ADDRESS CHANGED |
| 330 | Seduction Banquet Hall 4110 W 12 Ave Hialeah | Immaculate Conception Catholic Church, 4497 W 1 Ave | SITE/ADDRESS CHANGED |
| 338 | Revive Iglesia Adventista del Septimo Dia 1425 E 1 Ave Hialeah | Iglesia Adventista del Septimo Dia Revive, 1425 E 1 Ave | name only |
| 339 | Revive Iglesia Adventista del Septimo Dia 1425 E 1 Ave Hialeah | Iglesia Adventista del Septimo Dia Revive, 1425 E 1 Ave | name only |
| 343 | Miami Springs Middle School 150 S Royal Poinciana Blvd Miami Springs | Miami Springs Golf & Country Club, 650 Curtiss Pkwy | SITE/ADDRESS CHANGED |
| 372 | Miami Lakes Branch Library 6699 Windmill Gate Rd Miami Lakes | Miami Lakes United Methodist Church, 14800 Ludlam Rd | SITE/ADDRESS CHANGED |
| 404 | Tamiami Baptist Church 860 SW 76 Ct Miami | West Miami Middle School, 7525 SW 24 St | SITE/ADDRESS CHANGED |
| 407 | Mildred & Claude Pepper Senior Center 10600 SW 4 St Miami | City of Sweetwater Community Center, 10600 SW 4 St | name only |
| 410 | La Catedral Del Pueblo 190 NW 79 Ave Miami | Big Five Club, 600 SW 92 Ave | SITE/ADDRESS CHANGED |
| 411 | La Catedral Del Pueblo 190 NW 79 Ave Miami | Big Five Club, 600 SW 92 Ave | SITE/ADDRESS CHANGED |
| 415 | University Lakes Recreation Hall 12850 SW 14 St Miami | Zora Neale Hurston Elementary School, 13137 SW 26 St | SITE/ADDRESS CHANGED |
| 424 | Tamiami Baptist Church 860 SW 76 Ct Miami | West Miami Middle School, 7525 SW 24 St | SITE/ADDRESS CHANGED |
| 463 | Norman & Jean Reach Park 7901 NW 176 St Hialeah | Norman & Jean Reach Park, 7895 NW 176 St | SITE/ADDRESS CHANGED |
| 480 | Chinese Baptist Church 595 SW 124 Ave Miami | North Trail Park, 780 NW 127 Ave | SITE/ADDRESS CHANGED |
| 504 | T Little Haiti Cultural Complex 212 NE 59 Ter Miami | Legion Memorial Park, 6447 NE 7 Ave | SITE/ADDRESS CHANGED |
| 513 | T Tuscany Cove Apartments 5900 NW 7 Ave Miami | Edison Towers, 5821 NW 7 Ave | SITE/ADDRESS CHANGED |
| 520 | Carrie P. Meek Art Center 1350 NW 50 St Miami | Carrie P. Meek Sr. & Cultural Ctr., 1300 NW 50 St | SITE/ADDRESS CHANGED |
| 523 | Ebenezer United Methodist Church 2001 NW 35 St Miami | St. Paul Institutional AME Church, 1892 NW 51 Ter | SITE/ADDRESS CHANGED |
| 528 | Ebenezer United Methodist Church 2001 NW 35 St Miami | First Presbyterian Church, 609 Brickell Ave | SITE/ADDRESS CHANGED |
| 531 | Claude Pepper Community Center II 750 NW 18 Ter Miami | Culmer Neighborhood Service Center, 1600 NW 3 Ave | SITE/ADDRESS CHANGED |
| 538 | Temple Israel of Greater Miami 137 NE 19 St Miami | Charles L. Williams Community Center, 1717 NW 5 Ave | SITE/ADDRESS CHANGED |
| 552 | Robert King High Community House 7025 W Flagler St Miami | Armando Badia Community Center, 25 Tamiami Blvd | SITE/ADDRESS CHANGED |
| 557 | Sunlight Miami 4585 W Flagler St Miami | West Flagler Branch Library, 5050 W Flagler St | SITE/ADDRESS CHANGED |
| 575 | Central Christian Church of Dade County 222 Menores Ave Coral Gables | Smathers Plaza 2, 1025 SW 30 Ave | SITE/ADDRESS CHANGED |
| 583 | West End Park Community House 6030 SW 2 St Miami | Manolo "Abue" Reyes Park, 6030 SW 2 St | name only |
| 594 | West End Park Community House 6030 SW 2 St Miami | Manolo "Abue" Reyes Park, 6030 SW 2 St | name only |
| 625 | T Pinecrest Elementary School 10250 SW 57 Ave Pinecrest | Coral Pine Park, 6955 SW 104 St | SITE/ADDRESS CHANGED |
| 628 | Miami Palmetto Senior High Community School 7460 SW 118 St Pinecrest | Miami Palmetto Senior High Community School, 7431 SW 120 St | SITE/ADDRESS CHANGED |
| 639 | T Brickell Key Village Green 520 Brickell Key Blvd Miami | First Presbyterian Church, 609 Brickell Ave | SITE/ADDRESS CHANGED |
| 662 | Temple Israel of Greater Miami 137 NE 19 St Miami | Charles L. Williams Community Center, 1717 NW 5 Ave | SITE/ADDRESS CHANGED |
| 663 | Temple Israel of Greater Miami 137 NE 19 St Miami | Charles L. Williams Community Center, 1717 NW 5 Ave | SITE/ADDRESS CHANGED |
| 664 | Temple Israel of Greater Miami 137 NE 19 St Miami | Charles L. Williams Community Center, 1717 NW 5 Ave | SITE/ADDRESS CHANGED |
| 702 | Lake of the Meadows Recreation Center 4450 SW 152 Ave Miami | Lamar Louise Curry Middle School, 15750 SW 47 St | SITE/ADDRESS CHANGED |
| 705 | Miami-Dade County Fire Station #37 4200 SW 142 Ave Miami | Reception Palace Ballrooms, 14375 SW 42 St | SITE/ADDRESS CHANGED |
| 751 | Grace A Metro Life Church 8100 SW 104 St Miami | Metro Life Church - Dadeland Campus, 8100 SW 104 St | name only |
| 752 | Kings Creek Village Recreation Center 8333 SW 81 Ave Miami | Continental Park, 10000 SW 82 Ave | SITE/ADDRESS CHANGED |
| 758 | Miami First Church of the Nazarene 17569 SW 147 Ave Miami | Renew Church, 17569 SW 147 Ave | name only |
| 786 | Miami First Church of the Nazarene 17569 SW 147 Ave Miami | Renew Church, 17569 SW 147 Ave | name only |
| 810 | St. Richard Parish Center 7500 SW 152 St Palmetto Bay | St. Andrews Episcopal Church, 14260 Old Cutler Rd | SITE/ADDRESS CHANGED |
| 813 | Christ The King Catholic Church 16000 SW 112 Ave Miami | Wilbur B. Bell Park, 10301 SW 170 Ter | SITE/ADDRESS CHANGED |
| 824 | Pinelands Presbyterian Church 10201 Bahia Dr Cutler Bay | Cutler Bay Town Hall, 10720 Caribbean Blvd | SITE/ADDRESS CHANGED |
| 825 | South Dade Regional Library 10750 SW 211 St Cutler Bay | South Dade Government Center, 10710 SW 211 St | SITE/ADDRESS CHANGED |
| 836 | South Dade Regional Library 10750 SW 211 St Cutler Bay | South Dade Government Center, 10710 SW 211 St | SITE/ADDRESS CHANGED |
| 845 | Iglesia Metodista Unida Peace 12755 Quail Roost Dr Miami | Iglesia Cristiana Peace, 12755 Quail Roost Dr | name only |
| 848 | Iglesia Metodista Unida Peace 12755 Quail Roost Dr Miami | Iglesia Cristiana Peace, 12755 Quail Roost Dr | name only |
| 849 | Iglesia Metodista Unida Peace 12755 Quail Roost Dr Miami | Iglesia Cristiana Peace, 12755 Quail Roost Dr | name only |
| 857 | Ministerio Cristiano Exodo 13:21 15420 SW 136 St #57 Miami | Country Walk Park Recreation Center, 14601 Country Walk Dr | SITE/ADDRESS CHANGED |
| 922 | Florida City/Homestead Neighborhood Service Center 1600 NW 6 Ct Florida City | Florida City-Homestead Community Resource Center, 1600 NW 6 Ct | name only |
| 975 | Claude Pepper Community Center II 750 NW 18 Ter Miami | Culmer Neighborhood Service Center, 1600 NW 3 Ave | SITE/ADDRESS CHANGED |

## Per-precinct comparison, all 756 (layer vs official 11/03/2026)
| Precinct | Layer site | Independent (official) site | Match? |
|---|---|---|---|
| 1 | Sunny Isles Beach Government Center, 18070 Collins Ave | Sunny Isles Beach Government Center 18070 Collins Ave Sunny Isles Beach | MATCH |
| 2 | Gateway Park, 151 Sunny Isles Blvd | T Gateway Park 151 Sunny Isles Blvd Sunny Isles Beach | MATCH |
| 3 | Winston Towers Assoc - Bldg 100, 250 174 St | Winston Towers Assoc - Bldg 100 250 174 St Sunny Isles Beach | MATCH |
| 4 | Gateway Park, 151 Sunny Isles Blvd | Gateway Park 151 Sunny Isles Blvd Sunny Isles Beach | MATCH |
| 5 | Arlen House Condo West, 350 Bayview Dr | Arlen House Condo West 350 Bayview Dr Sunny Isles Beach | MATCH |
| 6 | Bal Harbour Waterfront Park, 18 Bal Bay Dr | Bal Harbour Waterfront Park 18 Bal Bay Dr Bal Harbour | MATCH |
| 7 | Morris N. Broad Community Center, 1175 95 St | Morris N. Broad Community Center 1175 95 St Bay Harbor Islands | MATCH |
| 9 | Town of Surfside, 9293 Harding Ave | Town of Surfside 9293 Harding Ave Surfside | MATCH |
| 10 | Town of Surfside, 9293 Harding Ave | Town of Surfside 9293 Harding Ave Surfside | MATCH |
| 11 | Biscayne Beach Elementary School, 800 77 St | Biscayne Beach Elementary School 800 77 St Miami Beach | MATCH |
| 13 | North Shore Branch Library, 7501 Collins Ave | North Shore Branch Library 7501 Collins Ave Miami Beach | MATCH |
| 14 | North Shore Park Youth Center, 501 72 St | North Shore Park Youth Center 501 72 St Miami Beach | MATCH |
| 15 | Normandy Shores Golf Club, 2401 Biarritz Dr | Normandy Shores Golf Club 2401 Biarritz Dr Miami Beach | MATCH |
| 16 | Pelican Harbor Marina, 1275 NE 79 St | Pelican Harbor Marina 1275 NE 79 St Miami | MATCH |
| 17 | Treasure Island Elementary School, 7540 E Treasure Dr | Treasure Island Elementary School 7540 E Treasure Dr North Bay Village | MATCH |
| 18 | Indian Creek Fire Station #4, 6860 Indian Creek Dr | Indian Creek Fire Station #4 6860 Indian Creek Dr Miami Beach | MATCH |
| 19 | Normandy Park & Pool, 7030 Trouville Esplanade | Normandy Park & Pool 7030 Trouville Esplanade Miami Beach | MATCH |
| 20 | Ronald W. Shane Center, 6500 Indian Creek Dr | Ronald W. Shane Center 6500 Indian Creek Dr Miami Beach | MATCH |
| 23 | Miami Beach Fire Station #3, 5303 Collins Ave | Miami Beach Fire Station #3 5303 Collins Ave Miami Beach | MATCH |
| 24 | Nautilus Middle School, 4301 N Michigan Ave | Nautilus Middle School 4301 N Michigan Ave Miami Beach | MATCH |
| 25 | St. Johns on the Lake Methodist Church, 4760 Pine Tree Dr | St. Johns on the Lake Methodist Church 4760 Pine Tree Dr Miami Beach | MATCH |
| 27 | Temple Beth Sholom, 4144 Chase Ave | Temple Beth Sholom 4144 Chase Ave Miami Beach | MATCH |
| 28 | Temple Beth Sholom, 4144 Chase Ave | Temple Beth Sholom 4144 Chase Ave Miami Beach | MATCH |
| 30 | Miami Beach City Hall, 1700 Convention Center Dr | Miami Beach City Hall 1700 Convention Center Dr Miami Beach | MATCH |
| 31 | Miami Beach Senior High School, 2231 Prairie Ave | Miami Beach Senior High School 2231 Prairie Ave Miami Beach | MATCH |
| 32 | Miami Beach Regional Library, 227  22  St | Miami Beach Regional Library 227 22 St Miami Beach | MATCH |
| 33 | Miami Beach City Hall, 1700 Convention Center Dr | Miami Beach City Hall 1700 Convention Center Dr Miami Beach | MATCH |
| 36 | Miami Beach Police Athletic League, 999 11 St | Miami Beach Police Athletic League 999 11 St Miami Beach | MATCH |
| 41 | South Shore Community Center, 833 6 St  #2 | South Shore Community Center 833 6 St #2 Miami Beach | MATCH |
| 42 | Fienberg Fisher K-8 Center, 601 14 Pl | Fienberg Fisher K-8 Center 601 14 Pl Miami Beach | MATCH |
| 43 | Miami Beach Police Department, 1100 Washington Ave | Miami Beach Police Department 1100 Washington Ave Miami Beach | MATCH |
| 47 | South Pointe Elementary School, 1050  4 St | South Pointe Elementary School 1050 4 St Miami Beach | MATCH |
| 48 | South Pointe Elementary School, 1050  4 St | South Pointe Elementary School 1050 4 St Miami Beach | MATCH |
| 51 | Key Biscayne Community Center, 10 Village Green Way | Key Biscayne Community Center 10 Village Green Way Key Biscayne | MATCH |
| 52 | Key Biscayne Community Center, 10 Village Green Way | Key Biscayne Community Center 10 Village Green Way Key Biscayne | MATCH |
| 53 | Key Biscayne Community Center, 10 Village Green Way | Key Biscayne Community Center 10 Village Green Way Key Biscayne | MATCH |
| 67 | Sunny Isles Beach Government Center, 18070 Collins Ave | Sunny Isles Beach Government Center 18070 Collins Ave Sunny Isles Beach | MATCH |
| 68 | Arlen House Condo West, 350 Bayview Dr | Arlen House Condo West 350 Bayview Dr Sunny Isles Beach | MATCH |
| 99 | Williams Island Club House, 4500 Island Blvd | Williams Island Building 2800 2800 Island Blvd Aventura | **MISMATCH** |
| 101 | Virginia A. Boone Highland Oaks Elementary School, 20500 NE 24 Ave | Virginia A. Boone Highland Oaks Elementary School 20500 NE 24 Ave Miami | MATCH |
| 102 | Aventura Community Recreation Center, 3375 NE 188 St | Aventura Community Recreation Center 3375 NE 188 St Aventura | MATCH |
| 103 | Aventura Government Center, 19200 W Country Club Dr | Aventura Government Center 19200 W Country Club Dr Aventura | MATCH |
| 104 | Highland Oaks Middle School, 2375 NE 203 St | Highland Oaks Middle School 2375 NE 203 St Miami | MATCH |
| 105 | Highland Oaks Middle School, 2375 NE 203 St | Highland Oaks Middle School 2375 NE 203 St Miami | MATCH |
| 106 | Greynolds Park Elementary School, 1536 NE 179 St | Greynolds Park Elementary School 1536 NE 179 St North Miami Beach | MATCH |
| 107 | Greynolds Park Elementary School, 1536 NE 179 St | Greynolds Park Elementary School 1536 NE 179 St North Miami Beach | MATCH |
| 108 | New Horizons Condominium Association, 1500 NE 191 St | New Horizons Condominium Association 1500 NE 191 St Miami | MATCH |
| 109 | Marjorie/William McDonald Center, 17051 NE 19 Ave | Marjorie/William McDonald Center 17051 NE 19 Ave North Miami Beach | MATCH |
| 110 | Ojus Elementary School, 18600 W Dixie Hwy | Ojus Elementary School 18600 W Dixie Hwy Miami | MATCH |
| 111 | Commodore Plaza Tower II, 2750 NE 183 St | Commodore Plaza Tower II 2750 NE 183 St Aventura | MATCH |
| 112 | Plaza Del Prado Condominium, 18051 Biscayne Blvd | Plaza Del Prado Condominium 18051 Biscayne Blvd Aventura | MATCH |
| 113 | Point East Condominium, 2895 Point East Dr | Point East Condominium 2895 Point East Dr Aventura | MATCH |
| 114 | Northeast Dade Aventura Branch Library, 2930 Aventura Blvd | Northeast Dade Aventura Branch Library 2930 Aventura Blvd Aventura | MATCH |
| 115 | Marjorie/William McDonald Center, 17051 NE 19 Ave | Marjorie/William McDonald Center 17051 NE 19 Ave North Miami Beach | MATCH |
| 116 | North Miami Beach Senior High School, 1247 NE 167 St | North Miami Beach Senior High School 1247 NE 167 St Miami || North Miami Beach Senior High School 1247 NE 167 St Miami | MATCH |
| 117 | Uleta Community Center, 386 NE 169 St | Uleta Community Center 386 NE 169 St North Miami Beach | MATCH |
| 118 | Point East Condominium, 2895 Point East Dr | Point East Condominium 2895 Point East Dr Aventura | MATCH |
| 119 | Gertrude K. Edelman/Sabal Palm Elementary School, 17101 NE 7 Ave | Gertrude K. Edelman/Sabal Palm Elementary School 17101 NE 7 Ave Miami | MATCH |
| 120 | North Miami Beach Senior High School, 1247 NE 167 St | North Miami Beach Senior High School 1247 NE 167 St Miami | MATCH |
| 121 | Fulford United Methodist Church, 1900 NE 164 St | Fulford United Methodist Church 1900 NE 164 St North Miami Beach | MATCH |
| 123 | Marjorie/William McDonald Center, 17051 NE 19 Ave | Marjorie/William McDonald Center 17051 NE 19 Ave North Miami Beach | MATCH |
| 124 | Eden Isles Condominium, 16975 NE 35 Ave | Eden Isles Condominium 16975 NE 35 Ave North Miami Beach | MATCH |
| 125 | Highland Village Community Center, 13621 NE 21 Ave | Highland Village Community Center 13621 NE 21 Ave North Miami Beach | MATCH |
| 126 | Allen Park Community Center, 1770 NE 162 St | Allen Park Community Center 1770 NE 162 St North Miami Beach | MATCH |
| 127 | Hazel Crawdford Neighborhood Resource Center, 1528 NE 152 Ter | T Hazel Crawdford Neighborhood Resource Center 1528 NE 152 Ter North Miami Beach | MATCH |
| 128 | Oak Grove Park, 680 NE 159 St | Oak Grove Park 680 NE 159 St Miami | MATCH |
| 129 | North Miami Beach Church Nazarene, 16450 NE 4 Ave | North Miami Beach Church Nazarene 16450 NE 4 Ave Miami | MATCH |
| 130 | First Baptist Church of Greater Miami, 15395 N Miami Ave | First Baptist Church of Greater Miami 15395 N Miami Ave Miami | MATCH |
| 131 | Thomas Jefferson Middle School, 525 NW 147 St | Thomas Jefferson Middle School 525 NW 147 St Miami | MATCH |
| 132 | First Baptist Church of Greater Miami, 15395 N Miami Ave | First Baptist Church of Greater Miami 15395 N Miami Ave Miami | MATCH |
| 133 | Miami-Dade County Fire Station #19, 650 NW 131 St | Miami-Dade County Fire Station #19 650 NW 131 St North Miami | MATCH |
| 134 | North Miami Church of the Nazarene, 1195 NW 124 St | North Miami Church of the Nazarene 1195 NW 124 St North Miami | MATCH |
| 135 | Sunkist Grove Community Center, 12500 NW 13 Ave | Sunkist Grove Community Center 12500 NW 13 Ave North Miami | MATCH |
| 136 | Miami Union Academy, 12600 NW 4 Ave | Miami Union Academy 12600 NW 4 Ave North Miami | MATCH |
| 137 | Griffing Senior Citizens Center, 12220 Griffing Blvd | Griffing Senior Citizens Center 12220 Griffing Blvd North Miami | MATCH |
| 138 | North Miami Elementary School, 655 NE 145 St | North Miami Elementary School 655 NE 145 St North Miami | MATCH |
| 139 | Griffing Senior Citizens Center, 12220 Griffing Blvd | Griffing Senior Citizens Center 12220 Griffing Blvd North Miami | MATCH |
| 140 | Haitian Evangelical Baptist Church, 14455 Memorial Hwy | Haitian Evangelical Baptist Church 14455 Memorial Hwy North Miami | MATCH |
| 141 | Oak Grove Park, 680 NE 159 St | Oak Grove Park 680 NE 159 St Miami | MATCH |
| 142 | Beree Seventh Day Adventist Church, 13018 NE 8 Ave | Beree Seventh Day Adventist Church 13018 NE 8 Ave North Miami | MATCH |
| 143 | First Church of North Miami, 1200 NE 135 St | First Church of North Miami 1200 NE 135 St North Miami | MATCH |
| 144 | Stanton Memorial Baptist Church, 50 NE 119 St | Stanton Memorial Baptist Church 50 NE 119 St Miami | MATCH |
| 145 | Natural Bridge Elementary School, 1650 NE 141 St | Natural Bridge Elementary School 1650 NE 141 St North Miami | MATCH |
| 146 | Keystone Park Community Center, 13050 Ixora Ct | Keystone Park Community Center 13050 Ixora Ct North Miami | MATCH |
| 147 | Keystone Park Community Center, 13050 Ixora Ct | Keystone Park Community Center 13050 Ixora Ct North Miami | MATCH |
| 148 | Miami-Dade County Fire Station #20, 13000 NE 16 Ave | Miami-Dade County Fire Station #20 13000 NE 16 Ave North Miami | MATCH |
| 149 | Biscayne Shores and Gardens Park, 1400 NE 116 St | Biscayne Shores and Gardens Park 1400 NE 116 St Miami | MATCH |
| 150 | Biscayne Shores and Gardens Park, 1400 NE 116 St | Biscayne Shores and Gardens Park 1400 NE 116 St Miami | MATCH |
| 151 | First Church of North Miami, 1200 NE 135 St | First Church of North Miami 1200 NE 135 St North Miami | MATCH |
| 152 | New Generation SDA Church, 12800 North Miami Ave | New Generation SDA Church 12800 North Miami Ave North Miami | MATCH |
| 153 | First Church of North Miami, 1200 NE 135 St | First Church of North Miami 1200 NE 135 St North Miami | MATCH |
| 154 | Hubert O. Sibley K-8 Academy, 255 NW 115 St | Hubert O. Sibley K-8 Academy 255 NW 115 St Miami | MATCH |
| 155 | Miami Shores Elementary School, 10351 NE 5 Ave | Miami Shores Elementary School 10351 NE 5 Ave Miami Shores | MATCH |
| 156 | Grace Church Miami, 370 Grand Concourse | Grace Church Miami 370 Grand Concourse Miami Shores | MATCH |
| 157 | C. Lawton McCall Community Center, 9617 Park Dr | C. Lawton McCall Community Center 9617 Park Dr Miami Shores | MATCH |
| 158 | Miami-Dade County Fire Station #20, 13000 NE 16 Ave | Miami-Dade County Fire Station #20 13000 NE 16 Ave North Miami | MATCH |
| 159 | El Portal Village Hall, 500 NE 87 St | El Portal Village Hall 500 NE 87 St El Portal | MATCH |
| 160 | Stanton Memorial Baptist Church, 50 NE 119 St | Stanton Memorial Baptist Church 50 NE 119 St Miami | MATCH |
| 161 | Dr. Marvin Dunn Academy for Community Education, 8950 NW 2 Ave | Dr. Marvin Dunn Academy for Community Education 8950 NW 2 Ave El Portal | MATCH |
| 162 | Edison West Little River Community Resource Center, 150 NW 79 St | Edison West Little River Community Resource Center 150 NW 79 St Miami | MATCH |
| 163 | Stanton Memorial Baptist Church, 50 NE 119 St | Stanton Memorial Baptist Church 50 NE 119 St Miami | MATCH |
| 164 | Biscayne Shores and Gardens Park, 1400 NE 116 St | Biscayne Shores and Gardens Park 1400 NE 116 St Miami | MATCH |
| 165 | W.J. Bryan Elementary School, 1201 NE 125 St | W.J. Bryan Elementary School 1201 NE 125 St North Miami | MATCH |
| 166 | Uleta Community Center, 386 NE 169 St | Uleta Community Center 386 NE 169 St North Miami Beach | MATCH |
| 168 | Keystone Park Community Center, 13050 Ixora Ct | Keystone Park Community Center 13050 Ixora Ct North Miami | MATCH |
| 169 | W.J. Bryan Elementary School, 1201 NE 125 St | W.J. Bryan Elementary School 1201 NE 125 St North Miami | MATCH |
| 172 | North Miami Public Library, 835 NE 132 St | North Miami Public Library 835 NE 132 St North Miami | MATCH |
| 173 | Greater Miami Church of God, 1695 Opa-Locka Blvd | Greater Miami Church of God 1695 Opa-Locka Blvd Miami | MATCH |
| 174 | New Generation SDA Church, 12800 North Miami Ave | New Generation SDA Church 12800 North Miami Ave North Miami | MATCH |
| 175 | Highland Village Community Center, 13621 NE 21 Ave | Highland Village Community Center 13621 NE 21 Ave North Miami Beach | MATCH |
| 176 | W.J. Bryan Elementary School, 1201 NE 125 St | W.J. Bryan Elementary School 1201 NE 125 St North Miami | MATCH |
| 177 | Ed Burke Recreation Center, 11400 NE 9 Ct | Ed Burke Recreation Center 11400 NE 9 Ct Biscayne Park | MATCH |
| 178 | Henry Reeves Elementary School, 2005 NW 111 St | Henry Reeves Elementary School 2005 NW 111 St Miami | MATCH |
| 179 | C. Lawton McCall Community Center, 9617 Park Dr | C. Lawton McCall Community Center 9617 Park Dr Miami Shores | MATCH |
| 180 | C. Lawton McCall Community Center, 9617 Park Dr | C. Lawton McCall Community Center 9617 Park Dr Miami Shores | MATCH |
| 181 | Phyllis R. Miller Elementary School, 840 NE 87 St | Phyllis R. Miller Elementary School 840 NE 87 St Miami | MATCH |
| 182 | North Miami Public Library, 835 NE 132 St | North Miami Public Library 835 NE 132 St North Miami | MATCH |
| 183 | Hazel Crawdford Neighborhood Resource Center, 1528 NE 152 Ter | T Hazel Crawdford Neighborhood Resource Center 1528 NE 152 Ter North Miami Beach | MATCH |
| 184 | Hazel Crawdford Neighborhood Resource Center, 1528 NE 152 Ter | T Hazel Crawdford Neighborhood Resource Center 1528 NE 152 Ter North Miami Beach | MATCH |
| 185 | Ojus Elementary School, 18600 W Dixie Hwy | Ojus Elementary School 18600 W Dixie Hwy Miami | MATCH |
| 186 | Ojus Elementary School, 18600 W Dixie Hwy | Ojus Elementary School 18600 W Dixie Hwy Miami | MATCH |
| 188 | Phyllis R. Miller Elementary School, 840 NE 87 St | Phyllis R. Miller Elementary School 840 NE 87 St Miami | MATCH |
| 196 | Universal Truth Center, 21310 NW 37 Ave | Universal Truth Center 21310 NW 37 Ave Miami Gardens | MATCH |
| 197 | Universal Truth Center, 21310 NW 37 Ave | Universal Truth Center 21310 NW 37 Ave Miami Gardens | MATCH |
| 201 | Royal Country Community - Sun Homes, 5546 NW 200 Ter | Royal Country Community - Sun Homes 5546 NW 200 Ter Miami Gardens | MATCH |
| 202 | Royal Country Community - Sun Homes, 5546 NW 200 Ter | Royal Country Community - Sun Homes 5546 NW 200 Ter Miami Gardens | MATCH |
| 203 | North County K-8 Center, 3250 NW 207 St | North County K-8 Center 3250 NW 207 St Miami Gardens | MATCH |
| 205 | Robert Renick Educational Center, 2201 NW 207 St | Robert Renick Educational Center 2201 NW 207 St Miami Gardens | MATCH |
| 206 | Grace United Community Church, 901 NW 183 St | Grace United Community Church 901 NW 183 St Miami Gardens | MATCH |
| 207 | Ro-Mont South Rec Hall, 20314 NE 2 Ave | Ro-Mont South Rec Hall 20314 NE 2 Ave Miami | MATCH |
| 208 | Lake Park Condominium, 900 NE 199 St | Lake Park Condominium 900 NE 199 St Miami | MATCH |
| 209 | Madie Ives K-8 Preparatory Academy, 20770 NE 14 Ave | Madie Ives K-8 Preparatory Academy 20770 NE 14 Ave Miami | MATCH |
| 210 | Dr. Michael M. Krop Senior High School, 1410 NE 215 St | Dr. Michael M. Krop Senior High School 1410 NE 215 St Miami | MATCH |
| 211 | Madie Ives K-8 Preparatory Academy, 20770 NE 14 Ave | Madie Ives K-8 Preparatory Academy 20770 NE 14 Ave Miami | MATCH |
| 212 | Visitation Catholic Church, 100 NE 191 St | Visitation Catholic Church 100 NE 191 St Miami | MATCH |
| 213 | Parkway Elementary School, 1320 NW 188 St | Parkway Elementary School 1320 NW 188 St Miami Gardens | MATCH |
| 214 | Sierra Norwood Calvary Baptist Church, 19101 NW 5 Ave | Sierra Norwood Calvary Baptist Church 19101 NW 5 Ave Miami Gardens | MATCH |
| 216 | Miami Norland Senior High School, 1193 NW 193 St | Miami Norland Senior High School 1193 NW 193 St Miami Gardens | MATCH |
| 218 | North Dade Middle School, 1840 NW 157 St | North Dade Middle School 1840 NW 157 St Miami Gardens | MATCH |
| 221 | Parkview Elementary School, 17631 NW 20 Ave | Parkview Elementary School 17631 NW 20 Ave Miami Gardens | MATCH |
| 222 | Scott Lake Elementary School, 1160 NW 175 St | Scott Lake Elementary School 1160 NW 175 St Miami Gardens | MATCH |
| 223 | Cosmopolitan Baptist Church, 3003 NW 207 St | Cosmopolitan Baptist Church 3003 NW 207 St Miami Gardens | MATCH |
| 225 | Myrtle Grove Presbyterian Church, 2961 NW 175 St | Myrtle Grove Presbyterian Church 2961 NW 175 St Miami Gardens | MATCH |
| 226 | Golden Glades Elementary School, 16520 NW 28 Ave | Golden Glades Elementary School 16520 NW 28 Ave Miami Gardens | MATCH |
| 227 | Dr. Lester B. Brown Park, 19405 NW 32 Ave | T Dr. Lester B. Brown Park 19405 NW 32 Ave Miami Gardens | MATCH |
| 228 | Carol City Middle School, 3737 NW 188 St | Carol City Middle School 3737 NW 188 St Miami Gardens | MATCH |
| 229 | Iglesia Adventista De Carol City, 4450 NW 183 St | Iglesia Adventista De Carol City 4450 NW 183 St Miami Gardens | MATCH |
| 230 | Lake Stevens Middle School, 18484 NW 48 Pl | Lake Stevens Middle School 18484 NW 48 Pl Miami | MATCH |
| 231 | Global Church, 17701 NW 57 Ave | Global Church 17701 NW 57 Ave Miami | MATCH |
| 232 | North Glade Elementary School, 5000 NW 177 St | North Glade Elementary School 5000 NW 177 St Miami | MATCH |
| 233 | Florida Memorial University, 15800 NW 42 Ave | Florida Memorial University 15800 NW 42 Ave Miami Gardens | MATCH |
| 234 | Henry E.S. Reeves K-8 Center Primary Academy, 2225 NW 103 St | Henry E.S. Reeves K-8 Center Primary Academy 2225 NW 103 St Miami | MATCH |
| 236 | Westview Baptist Church, 13301 NW 24 Ave | Westview Baptist Church 13301 NW 24 Ave Miami | MATCH |
| 237 | Nathan B. Young Elementary School, 14120 NW 24 Ave | Nathan B. Young Elementary School 14120 NW 24 Ave Opa Locka | MATCH |
| 238 | Faith Community Baptist Church, 10401 NW 8 Ave | Faith Community Baptist Church 10401 NW 8 Ave Miami | MATCH |
| 239 | Mount Olives Church of God, 13230 NW 7 Ave | Mount Olives Church of God 13230 NW 7 Ave North Miami | MATCH |
| 240 | Carrie P. Meek Elementary School, 2101 NW 127 St | Carrie P. Meek Elementary School 2101 NW 127 St Miami | MATCH |
| 241 | Henry E.S. Reeves K-8 Center Primary Academy, 2225 NW 103 St | Henry E.S. Reeves K-8 Center Primary Academy 2225 NW 103 St Miami | MATCH |
| 242 | Lakeview Elementary School, 1290 NW 115 St | Lakeview Elementary School 1290 NW 115 St Miami | MATCH |
| 243 | West Little River Park, 2326 NW 84 St | West Little River Park 2326 NW 84 St Miami | MATCH |
| 244 | Twin Lakes Apartments, 1221 NW 95 St | Twin Lakes Apartments 1221 NW 95 St Miami | MATCH |
| 245 | Bible Baptist Church, 9801 NW 24 Ave | Bible Baptist Church 9801 NW 24 Ave Miami | MATCH |
| 246 | Mount Zion Apostolic Temple, 9300 NW 32 Ave | Mount Zion Apostolic Temple 9300 NW 32 Ave Miami | MATCH |
| 247 | Madison Middle School, 3400 NW 87 St | Madison Middle School 3400 NW 87 St Miami | MATCH |
| 248 | North Central Branch Library, 9590 NW 27 Ave | North Central Branch Library 9590 NW 27 Ave Miami | MATCH |
| 249 | Arcola Lakes Community Park, 1301 NW 83 St | Arcola Lakes Community Park 1301 NW 83 St Miami | MATCH |
| 250 | Mt Carmel Missionary Baptist Church, 1745 NW 79 St | Mt Carmel Missionary Baptist Church 1745 NW 79 St Miami | MATCH |
| 251 | Arcola Lakes Community Park, 1301 NW 83 St | Arcola Lakes Community Park 1301 NW 83 St Miami | MATCH |
| 252 | Florida Memorial University, 15800 NW 42 Ave | Florida Memorial University 15800 NW 42 Ave Miami Gardens | MATCH |
| 253 | Palm Court Apartments, 930 NW 95 St | New Shiloh Missionary Baptist Church 1350 NW 95 St Miami | **MISMATCH** |
| 254 | The Highway Church of Apostle's Faith, 2141 NW 76 St | The Highway Church of Apostle's Faith 2141 NW 76 St Miami | MATCH |
| 255 | The Highway Church of Apostle's Faith, 2141 NW 76 St | The Highway Church of Apostle's Faith 2141 NW 76 St Miami | MATCH |
| 256 | Robert Sharp Towers #1, 103 NW 202 Ter | Robert Sharp Towers #1 103 NW 202 Ter Miami Gardens | MATCH |
| 257 | Saint James AME Church, 1845 NW 65 St | Saint James AME Church 1845 NW 65 St Miami | MATCH |
| 258 | NFL Yet Center/Gwen Cherry Park, 7090 NW 22 Ave | NFL Yet Center/Gwen Cherry Park 7090 NW 22 Ave Miami | MATCH |
| 259 | Dr. M. L. King Jr Memorial Park, 6000 NW 32 Ct | Dr. M. L. King Jr Memorial Park 6000 NW 32 Ct Miami | MATCH |
| 260 | Dayspring Missionary Baptist Church, 2991 NW 62 St | Dayspring Missionary Baptist Church 2991 NW 62 St Miami | MATCH |
| 261 | Agenoria S. Paschal/Olinda Elementary School, 5536 NW 21 Ave | Agenoria S. Paschal/Olinda Elementary School 5536 NW 21 Ave Miami | MATCH |
| 262 | Mildred & Claude Pepper Towers, 2350 NW 54 St | Mildred & Claude Pepper Towers 2350 NW 54 St Miami | MATCH |
| 263 | Kelsey L. Pharr Elementary School, 2000 NW 46 St | Kelsey L. Pharr Elementary School 2000 NW 46 St Miami | MATCH |
| 264 | Kelsey L. Pharr Elementary School, 2000 NW 46 St | Kelsey L. Pharr Elementary School 2000 NW 46 St Miami | MATCH |
| 267 | Universal Truth Center, 21310 NW 37 Ave | Universal Truth Center 21310 NW 37 Ave Miami Gardens | MATCH |
| 268 | Westview Baptist Church, 13301 NW 24 Ave | Westview Baptist Church 13301 NW 24 Ave Miami | MATCH |
| 269 | Mount Zion African Methodist Episcopal Church, 15250 NW 22 Ave | Mount Zion African Methodist Episcopal Church 15250 NW 22 Ave Miami Gardens | MATCH |
| 270 | City of Miami Gardens City Hall, 18605 NW 27 Ave Ste 317 | City of Miami Gardens City Hall 18605 NW 27 Ave Ste 317 Miami Gardens | MATCH |
| 272 | Charles David Wyche Jr Elementary School, 5241 NW 195 Dr | Charles David Wyche Jr Elementary School 5241 NW 195 Dr Miami | MATCH |
| 273 | Nathan B. Young Elementary School, 14120 NW 24 Ave | Nathan B. Young Elementary School 14120 NW 24 Ave Opa Locka | MATCH |
| 274 | Carol City Elementary School, 4375 NW 173 Dr | Carol City Elementary School 4375 NW 173 Dr Miami Gardens | MATCH |
| 276 | Greater Miami Church of God, 1695 Opa-Locka Blvd | Greater Miami Church of God 1695 Opa-Locka Blvd Miami | MATCH |
| 280 | Freeman Collins & Raymond Britton Senior Facility, 14295 NW 21 Ct | Freeman Collins & Raymond Britton Senior Facility 14295 NW 21 Ct Opa Locka | MATCH |
| 281 | Jefferson Reaves Sr. Park, 3090 NW 50 St | Jefferson Reaves Sr. Park 3090 NW 50 St Miami || Jefferson Reaves Sr. Park 3090 NW 50 St Miami | MATCH |
| 282 | Lorah Park Elementary School, 5160 NW 31 Ave | Lorah Park Elementary School 5160 NW 31 Ave Miami | MATCH |
| 283 | Lorah Park Elementary School, 5160 NW 31 Ave | Lorah Park Elementary School 5160 NW 31 Ave Miami || Lorah Park Elementary School 5160 NW 31 Ave Miami | MATCH |
| 284 | Melrose Elementary School, 3050 NW 35 St | Melrose Elementary School 3050 NW 35 St Miami | MATCH |
| 285 | Melrose Elementary School, 3050 NW 35 St | Melrose Elementary School 3050 NW 35 St Miami || Melrose Elementary School 3050 NW 35 St Miami | MATCH |
| 286 | Melrose Elementary School, 3050 NW 35 St | Melrose Elementary School 3050 NW 35 St Miami | MATCH |
| 288 | Jefferson Reaves Sr. Park, 3090 NW 50 St | Jefferson Reaves Sr. Park 3090 NW 50 St Miami | MATCH |
| 291 | Miami Gardens Elementary School, 4444 NW 195 St | Miami Gardens Elementary School 4444 NW 195 St Miami Gardens | MATCH |
| 295 | North Dade Regional Library, 2455 NW 183 St | North Dade Regional Library 2455 NW 183 St Miami Gardens | MATCH |
| 296 | Dr. Robert B. Ingram Elementary School, 600 Ahmad St | Dr. Robert B. Ingram Elementary School 600 Ahmad St Opa Locka | MATCH |
| 299 | Dr. Robert B. Ingram Elementary School, 600 Ahmad St | Dr. Robert B. Ingram Elementary School 600 Ahmad St Opa Locka | MATCH |
| 300 | Norman & Jean Reach Park, 7895 NW 176 St | T Norman & Jean Reach Park 7895 NW 176 St Hialeah | MATCH |
| 301 | North Palm Baptist Church, 7801 NW 178 St | North Palm Baptist Church 7801 NW 178 St Hialeah | MATCH |
| 302 | Norman & Jean Reach Park, 7895 NW 176 St | Norman & Jean Reach Park 7895 NW 176 St Hialeah | MATCH |
| 303 | Country Club of Miami South Park, 6881 NW 179 St | Country Club of Miami South Park 6881 NW 179 St Hialeah | MATCH |
| 304 | Country Village Park, 6550 NW 188 Ter | Country Village Park 6550 NW 188 Ter Hialeah | MATCH |
| 305 | Miami Lakes United Methodist Church, 14800 Ludlam Rd | T Miami Lakes United Methodist Church 14800 Ludlam Rd Miami Lakes | MATCH |
| 306 | Miami Lakes Middle School, 6425 Miami Lakeway North | Miami Lakes Middle School 6425 Miami Lakeway North Miami Lakes | MATCH |
| 307 | Miami Lakes United Methodist Church, 14800 Ludlam Rd | Miami Lakes United Methodist Church 14800 Ludlam Rd Miami Lakes | MATCH |
| 308 | Miami Lakes K-8 Center, 14250 NW 67 Ave | Miami Lakes K-8 Center 14250 NW 67 Ave Miami Lakes | MATCH |
| 309 | Carl F. Slade Park, 2501 W 74 St | Carl F. Slade Park 2501 W 74 St Hialeah | MATCH |
| 310 | Hialeah-Miami Lakes Senior High School, 7977 W 12 Ave | Hialeah-Miami Lakes Senior High School 7977 W 12 Ave Hialeah | MATCH |
| 311 | Iglesia Cristo Vive - Hermanos en Cristo, 500 W 78 St | Iglesia Cristo Vive - Hermanos en Cristo 500 W 78 St Hialeah | MATCH |
| 312 | Ministerio Unidos En Amor, 7665 W 12 Ave | Ministerio Unidos En Amor 7665 W 12 Ave Hialeah | MATCH |
| 313 | Iglesia Cristo Vive - Hermanos en Cristo, 500 W 78 St | Iglesia Cristo Vive - Hermanos en Cristo 500 W 78 St Hialeah | MATCH |
| 314 | Iglesia Cristo Vive - Hermanos en Cristo, 500 W 78 St | Iglesia Cristo Vive - Hermanos en Cristo 500 W 78 St Hialeah | MATCH |
| 315 | Palm Springs Elementary School, 6304 E 1 Ave | Palm Springs Elementary School 6304 E 1 Ave Hialeah | MATCH |
| 316 | O'Quinn Park, 6051 W 2 Ave | O'Quinn Park 6051 W 2 Ave Hialeah | MATCH |
| 317 | Hialeah Fire Station #5, 1197 W 74 St | Hialeah Fire Station #5 1197 W 74 St Hialeah | MATCH |
| 318 | John G. DuPuis Elementary School, 1150 W 59 Pl | John G. DuPuis Elementary School 1150 W 59 Pl Hialeah | MATCH |
| 319 | Hialeah Middle School, 6027 E 7 Ave | Hialeah Middle School 6027 E 7 Ave Hialeah | MATCH |
| 320 | Sparks Park, 1301 W 60 St | Sparks Park 1301 W 60 St Hialeah | MATCH |
| 321 | Victor Wilde Community Center, 1701 W 53 Ter | Victor Wilde Community Center 1701 W 53 Ter Hialeah | MATCH |
| 322 | Ben Sheppard Elementary School, 5700 W 24 Ave | Ben Sheppard Elementary School 5700 W 24 Ave Hialeah | MATCH |
| 323 | La Esperanza Senior Housing Project, 1770 W 44 Pl | La Esperanza Senior Housing Project 1770 W 44 Pl Hialeah | MATCH |
| 324 | Vivian Villas, 4650 W 12 Ave | Vivian Villas 4650 W 12 Ave Hialeah | MATCH |
| 325 | Goodlet Park, 4200 W 8 Ave | Goodlet Park 4200 W 8 Ave Hialeah | MATCH |
| 327 | Jose Marti MAST 6-12 Academy, 5701 W 24 Ave | Jose Marti MAST 6-12 Academy 5701 W 24 Ave Hialeah | MATCH |
| 328 | Immaculate Conception Catholic Church, 4497 W 1 Ave | Immaculate Conception Catholic Church 4497 W 1 Ave Hialeah | MATCH |
| 329 | Hialeah Middle School, 6027 E 7 Ave | Hialeah Middle School 6027 E 7 Ave Hialeah | MATCH |
| 330 | Immaculate Conception Catholic Church, 4497 W 1 Ave | Immaculate Conception Catholic Church 4497 W 1 Ave Hialeah | MATCH |
| 331 | John F. Kennedy Library, 190 W 49 St | John F. Kennedy Library 190 W 49 St Hialeah | MATCH |
| 332 | Twin Lakes Elementary School, 6735 W 5 Pl | Twin Lakes Elementary School 6735 W 5 Pl Hialeah | MATCH |
| 333 | James H. Bright Elementary School, 2530 W 10 Ave | James H. Bright Elementary School 2530 W 10 Ave Hialeah | MATCH |
| 334 | Bright Park Recreation Center, 750 E 35 St | Bright Park Recreation Center 750 E 35 St Hialeah | MATCH |
| 335 | Johnny L. Cotson Sr Park, 520 W 23 St | Johnny L. Cotson Sr Park 520 W 23 St Hialeah | MATCH |
| 336 | Johnny L. Cotson Sr Park, 520 W 23 St | Johnny L. Cotson Sr Park 520 W 23 St Hialeah | MATCH |
| 337 | Bright Park Recreation Center, 750 E 35 St | Bright Park Recreation Center 750 E 35 St Hialeah | MATCH |
| 338 | Iglesia Adventista del Septimo Dia Revive, 1425 E 1 Ave | Iglesia Adventista del Septimo Dia Revive 1425 E 1 Ave Hialeah | MATCH |
| 339 | Iglesia Adventista del Septimo Dia Revive, 1425 E 1 Ave | Iglesia Adventista del Septimo Dia Revive 1425 E 1 Ave Hialeah | MATCH |
| 340 | Benny Babcock Park, 651 E 4 Ave | Benny Babcock Park 651 E 4 Ave Hialeah | MATCH |
| 342 | South East Park, 1015 SE 9 Ave | South East Park 1015 SE 9 Ave Hialeah | MATCH |
| 343 | Miami Springs Golf & Country Club, 650 Curtiss Pkwy | Miami Springs Golf & Country Club 650 Curtiss Pkwy Miami Springs | MATCH |
| 344 | Miami Springs Community Center, 1401 Westward Dr | Miami Springs Community Center 1401 Westward Dr Miami Springs | MATCH |
| 345 | James H. Bright Elementary School, 2530 W 10 Ave | James H. Bright Elementary School 2530 W 10 Ave Hialeah | MATCH |
| 346 | Springview Elementary School, 1122 Bluebird Ave | Springview Elementary School 1122 Bluebird Ave Miami Springs | MATCH |
| 347 | Virginia Gardens Town Hall, 6498 NW 38 Ter | Virginia Gardens Town Hall 6498 NW 38 Ter Virginia Gardens | MATCH |
| 348 | Medley Town Hall, 7777 NW 72 Ave | Medley Town Hall 7777 NW 72 Ave Medley | MATCH |
| 349 | Hialeah Gardens Community Hall, 10003 NW 87 Ave | Hialeah Gardens Community Hall 10003 NW 87 Ave Hialeah Gardens | MATCH |
| 350 | Miami-Dade County Fire Rescue Honey Hill Station, 4775 NW 199 St | Miami-Dade County Fire Rescue Honey Hill Station 4775 NW 199 St Opa Locka | MATCH |
| 351 | The Moors Club Center, 17320 NW 65 Ave | The Moors Club Center 17320 NW 65 Ave Miami | MATCH |
| 352 | Mary Collins Community Center, 15151 NW 82 Ave | Mary Collins Community Center 15151 NW 82 Ave Miami Lakes | MATCH |
| 354 | Palm Springs Middle School, 1025 W 56 St | Palm Springs Middle School 1025 W 56 St Hialeah | MATCH |
| 355 | Joella C. Good Elementary School, 6350 NW 188 Ter | Joella C. Good Elementary School 6350 NW 188 Ter Hialeah | MATCH |
| 356 | American Senior High School, 18350 NW 67 Ave | American Senior High School 18350 NW 67 Ave Hialeah | MATCH |
| 357 | Palm Lakes Elementary School, 7450 W 16 Ave | Palm Lakes Elementary School 7450 W 16 Ave Hialeah | MATCH |
| 358 | Hialeah Gardens Middle School, 11690 NW 92 Ave | Hialeah Gardens Middle School 11690 NW 92 Ave Hialeah Gardens | MATCH |
| 359 | Senator Roberto Casas Park, 7900 W 32 Ave | Senator Roberto Casas Park 7900 W 32 Ave Hialeah | MATCH |
| 360 | Ernest R. Graham K-8 Academy, 7330 W 32 Ave | Ernest R. Graham K-8 Academy 7330 W 32 Ave Hialeah | MATCH |
| 361 | Miami-Dade County Fire Station #69, 11151 NW 74 St | Miami-Dade County Fire Station #69 11151 NW 74 St Doral | MATCH |
| 362 | Meadowlane Elementary School, 4280 W 8 Ave | Meadowlane Elementary School 4280 W 8 Ave Hialeah | MATCH |
| 363 | Russell Bucky Dent Park, 2250 W 60 St | Russell Bucky Dent Park 2250 W 60 St Hialeah | MATCH |
| 364 | Miami-Dade County Fire Station #44, 7700 NW 186 St | Miami-Dade County Fire Station #44 7700 NW 186 St Hialeah | MATCH |
| 365 | Lawton Chiles Middle School, 8190 NW 197 St | Lawton Chiles Middle School 8190 NW 197 St Hialeah | MATCH |
| 366 | Eugenia B. Thomas K-8 Center, 5950 NW 114 Ave | Eugenia B. Thomas K-8 Center 5950 NW 114 Ave Doral | MATCH |
| 368 | Westland Gardens Park, 13501 NW 107 Ave | Westland Gardens Park 13501 NW 107 Ave Hialeah Gardens | MATCH |
| 369 | North Palm Baptist Church, 7801 NW 178 St | North Palm Baptist Church 7801 NW 178 St Hialeah | MATCH |
| 370 | Doral Cultural Arts Center, 8363 NW 53 St | Doral Cultural Arts Center 8363 NW 53 St Doral | MATCH |
| 371 | Firefighter's Memorial Building, 8000 NW 21 St | Firefighter's Memorial Building 8000 NW 21 St Doral | MATCH |
| 372 | Miami Lakes United Methodist Church, 14800 Ludlam Rd | T Miami Lakes United Methodist Church 14800 Ludlam Rd Miami Lakes | MATCH |
| 373 | West Lakes Preparatory Academy, 8435 W 36 Ave | West Lakes Preparatory Academy 8435 W 36 Ave Hialeah | MATCH |
| 375 | Patterson Pavillion, 1875 W 44 Pl | Patterson Pavillion 1875 W 44 Pl Hialeah | MATCH |
| 377 | James S. Walker Community Center, 800 W 29 St | James S. Walker Community Center 800 W 29 St Hialeah | MATCH |
| 378 | James S. Walker Community Center, 800 W 29 St | James S. Walker Community Center 800 W 29 St Hialeah | MATCH |
| 379 | Immaculate Conception Catholic Church, 4497 W 1 Ave | Immaculate Conception Catholic Church 4497 W 1 Ave Hialeah | MATCH |
| 380 | Miami Springs Golf & Country Club, 650 Curtiss Pkwy | Miami Springs Golf & Country Club 650 Curtiss Pkwy Miami Springs | MATCH |
| 384 | St. Barbara Catholic Church, 6801 W 30 Ave | St. Barbara Catholic Church 6801 W 30 Ave Hialeah | MATCH |
| 385 | Barbara Goleman Senior High School, 14100 NW 89 Ave | Barbara Goleman Senior High School 14100 NW 89 Ave Miami Lakes | MATCH |
| 386 | Hialeah Fire Station #6, 780 W 25 St | Hialeah Fire Station #6 780 W 25 St Hialeah | MATCH |
| 387 | Ruth A. Tinsman Housing Authority, 6545 W 24 Ave | Ruth A. Tinsman Housing Authority 6545 W 24 Ave Hialeah | MATCH |
| 388 | West Hialeah Gardens Elementary School, 11990 NW 92 Ave | West Hialeah Gardens Elementary School 11990 NW 92 Ave Hialeah Gardens | MATCH |
| 389 | Palm Springs North Elementary School, 17615 NW 82 Ave | Palm Springs North K-8 Center 17615 NW 82 Ave Hialeah | ADDRESS matches, NAME differs |
| 390 | Bob Graham Education Center, 15901 NW 79 Ave | Bob Graham Education Center 15901 NW 79 Ave Miami Lakes | MATCH |
| 391 | Dr. Robert B. Ingram Elementary School, 600 Ahmad St | Dr. Robert B. Ingram Elementary School 600 Ahmad St Opa Locka | MATCH |
| 394 | Medley Town Hall, 7777 NW 72 Ave | Medley Town Hall 7777 NW 72 Ave Medley | MATCH |
| 396 | Firefighter's Memorial Building, 8000 NW 21 St | Firefighter's Memorial Building 8000 NW 21 St Doral | MATCH |
| 397 | Firefighter's Memorial Building, 8000 NW 21 St | Firefighter's Memorial Building 8000 NW 21 St Doral | MATCH |
| 400 | Benny Babcock Park, 651 E 4 Ave | Benny Babcock Park 651 E 4 Ave Hialeah | MATCH |
| 401 | Miami-Dade County Fire Station #61, 15155 SW 10 St | Miami-Dade County Fire Station #61 15155 SW 10 St Miami | MATCH |
| 402 | Turningpoint Baptist Church, 3350 SW 144 Ave | Turningpoint Baptist Church 3350 SW 144 Ave Miami | MATCH |
| 403 | Ebenezer Spanish SDA Church, 6566 SW 33 St | Ebenezer Spanish SDA Church 6566 SW 33 St Miami | MATCH |
| 404 | West Miami Middle School, 7525 SW 24 St | T West Miami Middle School 7525 SW 24 St Miami | MATCH |
| 405 | Ruben Dario Park, 9825 W Flagler St | Ruben Dario Park 9825 W Flagler St Miami | MATCH |
| 406 | Ruben Dario Park, 9825 W Flagler St | Ruben Dario Park 9825 W Flagler St Miami | MATCH |
| 407 | City of Sweetwater Community Center, 10600 SW 4 St | City of Sweetwater Community Center 10600 SW 4 St Miami | MATCH |
| 408 | Fontainebleau Milton Rental Apartments, 9517 Fontainebleau Blvd | Fontainebleau Milton Rental Apartments 9517 Fontainebleau Blvd Miami | MATCH |
| 409 | Sweetwater Elementary School, 10655 SW 4 St | Sweetwater Elementary School 10655 SW 4 St Miami | MATCH |
| 410 | Big Five Club, 600 SW 92 Ave | Big Five Club 600 SW 92 Ave Miami | MATCH |
| 411 | Big Five Club, 600 SW 92 Ave | Big Five Club 600 SW 92 Ave Miami | MATCH |
| 412 | Belen Jesuit Preparatory School, 500 SW 127 Ave | Belen Jesuit Preparatory School 500 SW 127 Ave Miami | MATCH |
| 413 | Greenglade Elementary School, 3060 SW 127 Ave | Greenglade Elementary School 3060 SW 127 Ave Miami | MATCH |
| 414 | Joe Hall Elementary School, 1901 SW 134 Ave | Joe Hall Elementary School 1901 SW 134 Ave Miami | MATCH |
| 415 | Zora Neale Hurston Elementary School, 13137 SW 26 St | Zora Neale Hurston Elementary School 13137 SW 26 St Miami | MATCH |
| 417 | Miami-Dade County Fair & Expo Center, 10901 SW 24 St | Miami-Dade County Fair & Expo Center 10901 SW 24 St Miami | MATCH |
| 419 | Westchester Regional Library, 9445 Coral Way | Westchester Regional Library 9445 Coral Way Miami | MATCH |
| 420 | Turningpoint Baptist Church, 3350 SW 144 Ave | Turningpoint Baptist Church 3350 SW 144 Ave Miami | MATCH |
| 421 | Iglesia Adventista del Septimo Dia Westchester, 9500 SW 16 St | Iglesia Adventista del Septimo Dia Westchester 9500 SW 16 St Miami | MATCH |
| 422 | Everglades K-8 Center, 8375 SW 16 St | Everglades K-8 Center 8375 SW 16 St Miami | MATCH |
| 423 | West Miami Middle School, 7525 SW 24 St | West Miami Middle School 7525 SW 24 St Miami | MATCH |
| 424 | West Miami Middle School, 7525 SW 24 St | T West Miami Middle School 7525 SW 24 St Miami | MATCH |
| 425 | El Camino Church, 6790 SW 12 St | El Camino Church 6790 SW 12 St Miami | MATCH |
| 426 | West Miami Recreation Center, 1700 SW 62 Ave | West Miami Recreation Center 1700 SW 62 Ave West Miami | MATCH |
| 427 | Rockway Park Recreation Bldg, 9460 SW 27 Dr | Rockway Park Recreation Bldg 9460 SW 27 Dr Miami | MATCH |
| 428 | Open Bible Temple, 5720 SW 17 St | Open Bible Temple 5720 SW 17 St Miami | MATCH |
| 429 | Biltmore Hotel, 1200 Anastasia Ave | Biltmore Hotel 1200 Anastasia Ave Coral Gables | MATCH |
| 430 | Sylvania Heights Elementary School, 5901 SW 16 St | Sylvania Heights Elementary School 5901 SW 16 St Miami | MATCH |
| 431 | Ebenezer Spanish SDA Church, 6566 SW 33 St | Ebenezer Spanish SDA Church 6566 SW 33 St Miami | MATCH |
| 432 | A. D. Barnes Park, 3401 SW 72 Ave | A. D. Barnes Park 3401 SW 72 Ave Miami | MATCH |
| 433 | Banyan Elementary School, 3060 SW 85 Ave | Banyan Elementary School 3060 SW 85 Ave Miami | MATCH |
| 434 | Emerson Elementary School, 8001 SW 36 St | Emerson Elementary School 8001 SW 36 St Miami | MATCH |
| 435 | Rockway Middle School, 9393 SW 29 Ter | Rockway Middle School 9393 SW 29 Ter Miami | MATCH |
| 436 | Iglesia El Redentor - Asamblea de Dios, 3000 SW 107 Ave | Iglesia El Redentor - Asamblea de Dios 3000 SW 107 Ave Miami | MATCH |
| 437 | Olympia Heights Elementary School, 9797 SW 40 St | Olympia Heights Elementary School 9797 SW 40 St Miami | MATCH |
| 438 | Iglesia El Redentor - Asamblea de Dios, 3000 SW 107 Ave | Iglesia El Redentor - Asamblea de Dios 3000 SW 107 Ave Miami | MATCH |
| 439 | St. Simons Episcopal Church, 10950 SW 34 St | St. Simons Episcopal Church 10950 SW 34 St Miami | MATCH |
| 440 | Village Green Elementary School, 12265 SW 34 St | Village Green Elementary School 12265 SW 34 St Miami | MATCH |
| 441 | Olympia Heights Elementary School, 9797 SW 40 St | Olympia Heights Elementary School 9797 SW 40 St Miami | MATCH |
| 443 | Charles R. Hadley Elementary School, 8400 NW 7 St | Charles R. Hadley Elementary School 8400 NW 7 St Miami | MATCH |
| 444 | Wesley Matthews Elementary School, 12345 SW 18 Ter | Wesley Matthews Elementary School 12345 SW 18 Ter Miami | MATCH |
| 445 | E.W.F. Stirrup Elementary School, 330 NW 97 Ave | E.W.F. Stirrup Elementary School 330 NW 97 Ave Miami | MATCH |
| 446 | Firefighter's Memorial Building, 8000 NW 21 St | Firefighter's Memorial Building 8000 NW 21 St Doral | MATCH |
| 447 | E.W.F. Stirrup Elementary School, 330 NW 97 Ave | E.W.F. Stirrup Elementary School 330 NW 97 Ave Miami | MATCH |
| 448 | Roxcy O'Neal Bolton Women's History Gallery, 10251 W Flagler St | Roxcy O'Neal Bolton Women's History Gallery 10251 W Flagler St Miami | MATCH |
| 450 | John I. Smith K-8 Center - Main Campus, 10415 NW 52 St | John I. Smith K-8 Center - Main Campus 10415 NW 52 St Doral | MATCH |
| 451 | G. Holmes Braddock Senior High School, 3601 SW 147 Ave | G. Holmes Braddock Senior High School 3601 SW 147 Ave Miami | MATCH |
| 452 | Imperial Lakes Club House, 12301 NW 7 Ln | Imperial Lakes Club House 12301 NW 7 Ln Miami | MATCH |
| 453 | Imperial Lakes Club House, 12301 NW 7 Ln | Imperial Lakes Club House 12301 NW 7 Ln Miami | MATCH |
| 455 | Paul W. Bell Middle School, 11800 NW 2 St | Paul W. Bell Middle School 11800 NW 2 St Miami | MATCH |
| 458 | Miami-Dade County Fair & Expo Center, 10901 SW 24 St | Miami-Dade County Fair & Expo Center 10901 SW 24 St Miami | MATCH |
| 459 | W.R. Thomas Middle School, 13001 SW 26 St | W.R. Thomas Middle School 13001 SW 26 St Miami | MATCH |
| 460 | W.R. Thomas Middle School, 13001 SW 26 St | W.R. Thomas Middle School 13001 SW 26 St Miami | MATCH |
| 461 | John A. Ferguson Senior High School, 15900 SW 56 St | John A. Ferguson Senior High School 15900 SW 56 St Miami | MATCH |
| 462 | Ronald W. Reagan/Doral Senior High School, 8600 NW 107 Ave | Ronald W. Reagan/Doral Senior High School 8600 NW 107 Ave Doral || Ronald W. Reagan/Doral Senior High School 8600 NW 107 Ave Doral | MATCH |
| 463 | Norman & Jean Reach Park, 7895 NW 176 St | Norman & Jean Reach Park 7895 NW 176 St Hialeah | MATCH |
| 464 | Sweetwater Elementary School, 10655 SW 4 St | Sweetwater Elementary School 10655 SW 4 St Miami | MATCH |
| 466 | MDC Herbert S. Saffir Permit & Inspection Ctr, 11805 SW 26 St | MDC Herbert S. Saffir Permit & Inspection Ctr 11805 SW 26 St Miami | MATCH |
| 467 | Miami Arts Studio 6-12 @ Zelda Glazer, 15015 SW 24 St | Miami Arts Studio 6-12 @ Zelda Glazer 15015 SW 24 St Miami | MATCH |
| 468 | Morgan Levy Park, 5300 NW 102 Ave | Morgan Levy Park 5300 NW 102 Ave Doral | MATCH |
| 469 | Miami Arts Studio 6-12 @ Zelda Glazer, 15015 SW 24 St | Miami Arts Studio 6-12 @ Zelda Glazer 15015 SW 24 St Miami | MATCH |
| 470 | Ruben Dario Middle School, 350 NW 97 Ave | Ruben Dario Middle School 350 NW 97 Ave Miami | MATCH |
| 471 | Royal Ballrooms Banquet Hall, 1405 SW 107 Ave #212C | Royal Ballrooms Banquet Hall 1405 SW 107 Ave #212C Miami | MATCH |
| 472 | Chinese Baptist Church, 595 SW 124 Ave | Chinese Baptist Church 595 SW 124 Ave Miami | MATCH |
| 480 | North Trail Park, 780 NW 127 Ave | North Trail Park 780 NW 127 Ave Miami | MATCH |
| 488 | Jorge Mas Canosa Youth Center, 250 SW 114 Ave | Jorge Mas Canosa Youth Center 250 SW 114 Ave Miami | MATCH |
| 489 | Jorge Mas Canosa Youth Center, 250 SW 114 Ave | Jorge Mas Canosa Youth Center 250 SW 114 Ave Miami || Jorge Mas Canosa Youth Center 250 SW 114 Ave Miami | MATCH |
| 500 | Seminole Elementary School, 121 SW 78 Pl | Seminole Elementary School 121 SW 78 Pl Miami | MATCH |
| 501 | Jesse J. McCrary Jr. Elementary School, 514 NW 77 St | Jesse J. McCrary Jr. Elementary School 514 NW 77 St Miami | MATCH |
| 502 | Legion Memorial Park, 6447 NE 7 Ave | Legion Memorial Park 6447 NE 7 Ave Miami | MATCH |
| 503 | Brisas Del Rio Community Center, 850 NW 13 Ct | Brisas Del Rio Community Center 850 NW 13 Ct Miami | MATCH |
| 504 | Legion Memorial Park, 6447 NE 7 Ave | Legion Memorial Park 6447 NE 7 Ave Miami | MATCH |
| 505 | St. Matthew Freewill Baptist Church, 6700 NW 2 Ave | St. Matthew Freewill Baptist Church 6700 NW 2 Ave Miami | MATCH |
| 506 | Edison Courts Community Center, 325 NW 62 St | Edison Courts Community Center 325 NW 62 St Miami | MATCH |
| 507 | Thena C. Crowder Early Learning Center, 757 NW 66 St | Thena C. Crowder Early Learning Center 757 NW 66 St Miami | MATCH |
| 508 | Liberty Square Community Center, 6304 NW 14 Ave | Liberty Square Community Center 6304 NW 14 Ave Miami | MATCH |
| 509 | Morningside K-8 Academy, 6620 NE 5 Ave | Morningside K-8 Academy 6620 NE 5 Ave Miami | MATCH |
| 510 | The Universal Church of The Kingdom of God, 3501 W Flagler St | The Universal Church of The Kingdom of God 3501 W Flagler St Miami | MATCH |
| 511 | Jordan Grove Baptist Church, 5946 NW 12 Ave | Jordan Grove Baptist Church 5946 NW 12 Ave Miami | MATCH |
| 512 | St. Paul Institutional AME Church, 1892 NW 51 Ter | St. Paul Institutional AME Church 1892 NW 51 Ter Miami | MATCH |
| 513 | Edison Towers, 5821 NW 7 Ave | Edison Towers 5821 NW 7 Ave Miami | MATCH |
| 514 | iTech @ Thomas A. Edison Educational Center, 6101 NW 2 Ave | iTech @ Thomas A. Edison Educational Center 6101 NW 2 Ave Miami | MATCH |
| 515 | Toussaint Louverture Elementary School, 120 NE 59 St | Toussaint Louverture Elementary School 120 NE 59 St Miami | MATCH |
| 516 | Morningside Park, 750 NE 55 Ter | Morningside Park 750 NE 55 Ter Miami | MATCH |
| 517 | Arthur E. Teele Jr Community Center, 6301 NE 2 Ave | Arthur E. Teele Jr Community Center 6301 NE 2 Ave Miami | MATCH |
| 518 | The Church of God of Prophecy Miami #1, 4528 NW 1 Ave | The Church of God of Prophecy Miami #1 4528 NW 1 Ave Miami | MATCH |
| 519 | Shadowlawn Elementary School, 149 NW 49 St | Shadowlawn Elementary School 149 NW 49 St Miami | MATCH |
| 520 | Carrie P. Meek Sr. & Cultural Ctr., 1300 NW 50 St | Carrie P. Meek Sr. & Cultural Ctr. 1300 NW 50 St Miami | MATCH |
| 521 | Edison Towers, 5821 NW 7 Ave | Edison Towers 5821 NW 7 Ave Miami | MATCH |
| 522 | Moore Park, 765 NW 36 St | Moore Park 765 NW 36 St Miami | MATCH |
| 523 | St. Paul Institutional AME Church, 1892 NW 51 Ter | St. Paul Institutional AME Church 1892 NW 51 Ter Miami | MATCH |
| 524 | Coral Way K-8 Center, 1950 SW 13 Ave | Coral Way K-8 Center 1950 SW 13 Ave Miami | MATCH |
| 525 | Christ Episcopal Church, 3481 Hibiscus St | Christ Episcopal Church 3481 Hibiscus St Miami | MATCH |
| 526 | Curtis Park Community House, 1901 NW 24 Ave | Curtis Park Community House 1901 NW 24 Ave Miami | MATCH |
| 527 | Juan P. Duarte Park, 1776 NW 28 St | Juan P. Duarte Park 1776 NW 28 St Miami | MATCH |
| 528 | First Presbyterian Church, 609 Brickell Ave | First Presbyterian Church 609 Brickell Ave Miami | MATCH |
| 529 | Jose De Diego Middle School, 3100 NW 5 Ave | Jose De Diego Middle School 3100 NW 5 Ave Miami | MATCH |
| 530 | Curtis Park Community House, 1901 NW 24 Ave | Curtis Park Community House 1901 NW 24 Ave Miami | MATCH |
| 531 | Culmer Neighborhood Service Center, 1600 NW 3 Ave | Culmer Neighborhood Service Center 1600 NW 3 Ave Miami | MATCH |
| 532 | Christ Episcopal Church, 3481 Hibiscus St | Christ Episcopal Church 3481 Hibiscus St Miami | MATCH |
| 533 | Culmer Neighborhood Service Center, 1600 NW 3 Ave | Culmer Neighborhood Service Center 1600 NW 3 Ave Miami | MATCH |
| 534 | Miami Fire Station #2, 1901 N Miami Ave | Miami Fire Station #2 1901 N Miami Ave Miami | MATCH |
| 535 | Paul Laurence Dunbar K-8 Center, 505 NW 20 St | Paul Laurence Dunbar K-8 Center 505 NW 20 St Miami | MATCH |
| 536 | Phillis Wheatley Elementary School, 1801 NW 1 Pl | Phillis Wheatley Elementary School 1801 NW 1 Pl Miami | MATCH |
| 537 | Culmer Neighborhood Service Center, 1600 NW 3 Ave | Culmer Neighborhood Service Center 1600 NW 3 Ave Miami | MATCH |
| 538 | Charles L. Williams Community Center, 1717 NW 5 Ave | Charles L. Williams Community Center 1717 NW 5 Ave Miami | MATCH |
| 539 | Citrus Grove Middle School, 2153 NW 3 St | Citrus Grove Middle School 2153 NW 3 St Miami | MATCH |
| 540 | Grapeland Park, 1550 NW 37 Ave | Grapeland Park 1550 NW 37 Ave Miami | MATCH |
| 541 | First Presbyterian Church, 609 Brickell Ave | First Presbyterian Church 609 Brickell Ave Miami | MATCH |
| 542 | Alfred I. DuPont Building, 169 E Flagler St | Alfred I. DuPont Building 169 E Flagler St Miami | MATCH |
| 543 | Brisas Del Rio Community Center, 850 NW 13 Ct | Brisas Del Rio Community Center 850 NW 13 Ct Miami | MATCH |
| 544 | Trinity Cathedral Hall, 464 NE 16 St | Trinity Cathedral Hall 464 NE 16 St Miami | MATCH |
| 545 | Miami Police Benevolent Association, 2300 NW 14 St | Miami Police Benevolent Association 2300 NW 14 St Miami | MATCH |
| 546 | Miami City Hall, 3500 Pan American Dr | Miami City Hall 3500 Pan American Dr Miami | MATCH |
| 547 | Miami Police Benevolent Association, 2300 NW 14 St | Miami Police Benevolent Association 2300 NW 14 St Miami | MATCH |
| 548 | Miami Senior High School, 2450 SW 1 St | T Miami Senior High School 2450 SW 1 St Miami | MATCH |
| 549 | Kensington Park Elementary School, 711 NW 30 Ave | Kensington Park Elementary School 711 NW 30 Ave Miami | MATCH |
| 550 | Miami Fire Fighter Benevolent Association, 2980 NW S River Dr | Miami Fire Fighter Benevolent Association 2980 NW S River Dr Miami | MATCH |
| 551 | Grapeland Park, 1550 NW 37 Ave | Grapeland Park 1550 NW 37 Ave Miami | MATCH |
| 552 | Armando Badia Community Center, 25 Tamiami Blvd | Armando Badia Community Center 25 Tamiami Blvd Miami | MATCH |
| 553 | Robert King High Community House, 7025 W Flagler St | Robert King High Community House 7025 W Flagler St Miami | MATCH |
| 554 | Gen. Antonio Maceo Community Center, 5135 NW 7 St | Gen. Antonio Maceo Community Center 5135 NW 7 St Miami | MATCH |
| 555 | Miami Fire Fighter Benevolent Association, 2980 NW S River Dr | Miami Fire Fighter Benevolent Association 2980 NW S River Dr Miami | MATCH |
| 556 | Residential Plaza, 5617 NW 7 St | Residential Plaza 5617 NW 7 St Miami | MATCH |
| 557 | West Flagler Branch Library, 5050 W Flagler St | West Flagler Branch Library 5050 W Flagler St Miami | MATCH |
| 558 | Charlie DeLucca Park (Kinloch Park), 455 NW 47 Ave | Charlie DeLucca Park (Kinloch Park) 455 NW 47 Ave Miami | MATCH |
| 559 | Ebenezer Freewill Baptist Church, 4111 SW 4 St | Ebenezer Freewill Baptist Church 4111 SW 4 St Miami | MATCH |
| 560 | Kinloch Park Middle School, 4340 NW 3 St | Kinloch Park Middle School 4340 NW 3 St Miami | MATCH |
| 561 | Iglesia Bautista Resurreccion, 2323 SW 27 Ave | Iglesia Bautista Resurreccion 2323 SW 27 Ave Miami | MATCH |
| 562 | Vizcaya Village Garage - Historic Garage, 3250 S Miami Ave | Vizcaya Village Garage - Historic Garage 3250 S Miami Ave Miami | MATCH |
| 563 | Jose Marti Park Gymnasium, 434 SW 3 Ave | Jose Marti Park Gymnasium 434 SW 3 Ave Miami | MATCH |
| 564 | Hispanic Branch Library, 1398 SW 1 St | Hispanic Branch Library 1398 SW 1 St Miami | MATCH |
| 565 | Riverside Elementary School, 1190 SW 2 St | Riverside Elementary School 1190 SW 2 St Miami | MATCH |
| 566 | Jose Marti Park Gymnasium, 434 SW 3 Ave | Jose Marti Park Gymnasium 434 SW 3 Ave Miami | MATCH |
| 567 | Simpson Park Recreation Building, 55 SW 17 Rd | Simpson Park Recreation Building 55 SW 17 Rd Miami | MATCH |
| 568 | Allapattah Neighborhood Service Center, 1897 NW 20 St | Allapattah Neighborhood Service Center 1897 NW 20 St Miami | MATCH |
| 569 | Simpson Park Recreation Building, 55 SW 17 Rd | Simpson Park Recreation Building 55 SW 17 Rd Miami | MATCH |
| 570 | Coral Way K-8 Center, 1950 SW 13 Ave | Coral Way K-8 Center 1950 SW 13 Ave Miami | MATCH |
| 571 | Shenandoah Branch Library, 2111 SW 19 St | Shenandoah Branch Library 2111 SW 19 St Miami | MATCH |
| 572 | Shenandoah Elementary School, 1023 SW 21 Ave | Shenandoah Elementary School 1023 SW 21 Ave Miami | MATCH |
| 573 | Rene Janero Recreation Center, 1800 SW 21 Ave | Rene Janero Recreation Center 1800 SW 21 Ave Miami | MATCH |
| 574 | Eden Eglise Adventist DU 7th Jour, 7777 N Miami Ave | Eden Eglise Adventist DU 7th Jour 7777 N Miami Ave Miami | MATCH |
| 575 | Smathers Plaza 2, 1025 SW 30 Ave | Smathers Plaza 2 1025 SW 30 Ave Miami | MATCH |
| 576 | Coral Gate Park Community Center, 1415 SW 32 Ave | Coral Gate Park Community Center 1415 SW 32 Ave Miami | MATCH |
| 577 | Silver Bluff Elementary School, 2609 SW 25 Ave | Silver Bluff Elementary School 2609 SW 25 Ave Miami | MATCH |
| 578 | Iglesia Bautista Resurreccion, 2323 SW 27 Ave | Iglesia Bautista Resurreccion 2323 SW 27 Ave Miami | MATCH |
| 579 | Silver Bluff Elementary School, 2609 SW 25 Ave | Silver Bluff Elementary School 2609 SW 25 Ave Miami | MATCH |
| 580 | Jesse J. McCrary Jr. Elementary School, 514 NW 77 St | Jesse J. McCrary Jr. Elementary School 514 NW 77 St Miami | MATCH |
| 581 | Little Havana I Apartments, 1759 SW 5 St | Little Havana I Apartments 1759 SW 5 St Miami | MATCH |
| 582 | Vizcaya Village Garage - Historic Garage, 3250 S Miami Ave | Vizcaya Village Garage - Historic Garage 3250 S Miami Ave Miami | MATCH |
| 583 | Manolo "Abue" Reyes Park, 6030 SW 2 St | Manolo "Abue" Reyes Park 6030 SW 2 St Miami | MATCH |
| 584 | Elizabeth Virrick Park, 3255 Plaza St | Elizabeth Virrick Park 3255 Plaza St Miami | MATCH |
| 585 | Elizabeth Virrick Park, 3255 Plaza St | Elizabeth Virrick Park 3255 Plaza St Miami | MATCH |
| 586 | Elizabeth Virrick Park, 3255 Plaza St | Elizabeth Virrick Park 3255 Plaza St Miami | MATCH |
| 587 | Plymouth Congregational Church, 3400 Devon Rd | Plymouth Congregational Church 3400 Devon Rd Miami | MATCH |
| 588 | Juan P. Duarte Park, 1776 NW 28 St | Juan P. Duarte Park 1776 NW 28 St Miami | MATCH |
| 589 | Juan P. Duarte Park, 1776 NW 28 St | Juan P. Duarte Park 1776 NW 28 St Miami | MATCH |
| 590 | Robert King High Community House, 7025 W Flagler St | Robert King High Community House 7025 W Flagler St Miami | MATCH |
| 591 | Brisas Del Este Apartments, 3000 NW 18 Ave | Brisas Del Este Apartments 3000 NW 18 Ave Miami | MATCH |
| 592 | Miami Fire Fighter Benevolent Association, 2980 NW S River Dr | Miami Fire Fighter Benevolent Association 2980 NW S River Dr Miami | MATCH |
| 593 | Citrus Grove Middle School, 2153 NW 3 St | Citrus Grove Middle School 2153 NW 3 St Miami | MATCH |
| 594 | Manolo "Abue" Reyes Park, 6030 SW 2 St | Manolo "Abue" Reyes Park 6030 SW 2 St Miami | MATCH |
| 595 | Jack Orr Senior Center, 550 NW 5 St | Jack Orr Senior Center 550 NW 5 St Miami | MATCH |
| 596 | Miami Fire Station #7, 314 Beacom Blvd | Miami Fire Station #7 314 Beacom Blvd Miami | MATCH |
| 597 | Juan P. Duarte Park, 1776 NW 28 St | Juan P. Duarte Park 1776 NW 28 St Miami | MATCH |
| 598 | Moore Park, 765 NW 36 St | Moore Park 765 NW 36 St Miami | MATCH |
| 599 | Roberto Clemente Park, 101 NW 34 St | Roberto Clemente Park 101 NW 34 St Miami | MATCH |
| 600 | Miami City Hall, 3500 Pan American Dr | Miami City Hall 3500 Pan American Dr Miami | MATCH |
| 601 | The Country Club of Coral Gables, 997 N Greenway Dr | The Country Club of Coral Gables 997 N Greenway Dr Coral Gables | MATCH |
| 602 | Jose De Diego Middle School, 3100 NW 5 Ave | Jose De Diego Middle School 3100 NW 5 Ave Miami | MATCH |
| 603 | Jose De Diego Middle School, 3100 NW 5 Ave | Jose De Diego Middle School 3100 NW 5 Ave Miami | MATCH |
| 604 | American Legion Post #98, 303 Alhambra Cir | American Legion Post #98 303 Alhambra Cir Coral Gables | MATCH |
| 605 | South Miami American Legion #31, 7710 SW 59 Ave | South Miami American Legion #31 7710 SW 59 Ave South Miami | MATCH |
| 606 | South Miami American Legion #31, 7710 SW 59 Ave | South Miami American Legion #31 7710 SW 59 Ave South Miami | MATCH |
| 607 | Coral Gables Congregational Church, 3010 De Soto Blvd | Coral Gables Congregational Church 3010 De Soto Blvd Coral Gables | MATCH |
| 608 | The Country Club of Coral Gables, 997 N Greenway Dr | The Country Club of Coral Gables 997 N Greenway Dr Coral Gables | MATCH |
| 609 | Miami Fire Station #2, 1901 N Miami Ave | Miami Fire Station #2 1901 N Miami Ave Miami | MATCH |
| 610 | Miami Fire Station #2, 1901 N Miami Ave | Miami Fire Station #2 1901 N Miami Ave Miami | MATCH |
| 611 | Coral Gables Senior High School, 450 Bird Rd | Coral Gables Senior High School 450 Bird Rd Coral Gables | MATCH |
| 612 | St. Augustine Catholic Church, 1400 Miller Rd | St. Augustine Catholic Church 1400 Miller Rd Coral Gables | MATCH |
| 613 | Ponce De Leon Middle School, 5801 Augusto St | Ponce De Leon Middle School 5801 Augusto St Coral Gables | MATCH |
| 614 | Coral Gables Fire Station #2, 525 S Dixie Hwy | Coral Gables Fire Station #2 525 S Dixie Hwy Coral Gables | MATCH |
| 615 | Coco Plum Woman's Club, 1375 Sunset Dr | Coco Plum Woman's Club 1375 Sunset Dr Coral Gables | MATCH |
| 616 | Chamber South, 6410 SW 80 St | Chamber South 6410 SW 80 St South Miami | MATCH |
| 617 | Coral Gables Fire Station #3, 11911 Old Cutler Rd | Coral Gables Fire Station #3 11911 Old Cutler Rd Coral Gables | MATCH |
| 618 | Pinecrest Branch Library, 5835 SW 111 St | Pinecrest Branch Library 5835 SW 111 St Pinecrest | MATCH |
| 619 | Moore Park, 765 NW 36 St | Moore Park 765 NW 36 St Miami | MATCH |
| 620 | Moore Park, 765 NW 36 St | Moore Park 765 NW 36 St Miami | MATCH |
| 621 | Gibson Bethel Community Center, 5800 SW 66 St | Gibson Bethel Community Center 5800 SW 66 St South Miami | MATCH |
| 622 | Moore Park, 765 NW 36 St | Moore Park 765 NW 36 St Miami | MATCH |
| 623 | One City Church, 6750 Sunset Dr | One City Church 6750 Sunset Dr Miami | MATCH |
| 624 | Southside Preparatory Academy, 45 SW 13 St | Southside Preparatory Academy 45 SW 13 St Miami | MATCH |
| 625 | Coral Pine Park, 6955 SW 104 St | Coral Pine Park 6955 SW 104 St Pinecrest | MATCH |
| 626 | Simpson Park Recreation Building, 55 SW 17 Rd | Simpson Park Recreation Building 55 SW 17 Rd Miami | MATCH |
| 627 | Kendall United Methodist Church, 7600 SW 104 St | Kendall United Methodist Church 7600 SW 104 St Pinecrest | MATCH |
| 628 | Miami Palmetto Senior High Community School, 7431 SW 120 St | Miami Palmetto Senior High Community School 7431 SW 120 St Pinecrest | MATCH |
| 629 | Phillis Wheatley Elementary School, 1801 NW 1 Pl | Phillis Wheatley Elementary School 1801 NW 1 Pl Miami | MATCH |
| 630 | Christ The King Lutheran Church, 11295 SW 57 Ave | Christ The King Lutheran Church 11295 SW 57 Ave Pinecrest | MATCH |
| 631 | Palmetto Middle School, 7351 SW 128 St | Palmetto Middle School 7351 SW 128 St Pinecrest | MATCH |
| 632 | Bet Shira Congregation, 7500 SW 120 St | Bet Shira Congregation 7500 SW 120 St Pinecrest | MATCH |
| 633 | Wesley United Methodist Church, 133 Ponce De Leon Blvd | Wesley United Methodist Church 133 Ponce De Leon Blvd Miami | MATCH |
| 634 | Vizcaya Village Garage - Historic Garage, 3250 S Miami Ave | Vizcaya Village Garage - Historic Garage 3250 S Miami Ave Miami | MATCH |
| 635 | Christ Congregational Church, 14920 SW 67 Ave | Christ Congregational Church 14920 SW 67 Ave Palmetto Bay | MATCH |
| 636 | Coral Gables Branch Library, 3443 Segovia St | Coral Gables Branch Library 3443 Segovia St Coral Gables | MATCH |
| 637 | Miami Fire Fighter Benevolent Association, 2980 NW S River Dr | Miami Fire Fighter Benevolent Association 2980 NW S River Dr Miami | MATCH |
| 638 | Culmer Neighborhood Service Center, 1600 NW 3 Ave | Culmer Neighborhood Service Center 1600 NW 3 Ave Miami | MATCH |
| 639 | First Presbyterian Church, 609 Brickell Ave | First Presbyterian Church 609 Brickell Ave Miami | MATCH |
| 640 | Watsco Center at University of Miami, 1245 Dauer Dr | Watsco Center at University of Miami 1245 Dauer Dr Coral Gables | MATCH |
| 641 | Riviera Presbyterian Church, 5275 Sunset Dr | Riviera Presbyterian Church 5275 Sunset Dr Miami | MATCH |
| 642 | One City Church, 6750 Sunset Dr | One City Church 6750 Sunset Dr Miami | MATCH |
| 643 | Central Christian Church of Dade County, 222 Menores Ave | Central Christian Church of Dade County 222 Menores Ave Coral Gables | MATCH |
| 645 | Miami Fire Station #2, 1901 N Miami Ave | Miami Fire Station #2 1901 N Miami Ave Miami | MATCH |
| 646 | Pinecrest Branch Library, 5835 SW 111 St | Pinecrest Branch Library 5835 SW 111 St Pinecrest | MATCH |
| 647 | Brisas Del Rio Community Center, 850 NW 13 Ct | Brisas Del Rio Community Center 850 NW 13 Ct Miami | MATCH |
| 648 | Christ The King Lutheran Church, 11295 SW 57 Ave | Christ The King Lutheran Church 11295 SW 57 Ave Pinecrest | MATCH |
| 649 | Simpson Park Recreation Building, 55 SW 17 Rd | Simpson Park Recreation Building 55 SW 17 Rd Miami | MATCH |
| 650 | Shenandoah Branch Library, 2111 SW 19 St | Shenandoah Branch Library 2111 SW 19 St Miami | MATCH |
| 651 | Vizcaya Village Garage - Historic Garage, 3250 S Miami Ave | Vizcaya Village Garage - Historic Garage 3250 S Miami Ave Miami | MATCH |
| 652 | Iglesia Cristiana Comunidad de Esperanza, 6330 Bird Rd | Iglesia Cristiana Comunidad de Esperanza 6330 Bird Rd Miami | MATCH |
| 653 | Miami Fire Station #2, 1901 N Miami Ave | Miami Fire Station #2 1901 N Miami Ave Miami | MATCH |
| 654 | Morningside Park, 750 NE 55 Ter | Morningside Park 750 NE 55 Ter Miami | MATCH |
| 655 | Jack Orr Senior Center, 550 NW 5 St | Jack Orr Senior Center 550 NW 5 St Miami | MATCH |
| 656 | Southside Preparatory Academy, 45 SW 13 St | Southside Preparatory Academy 45 SW 13 St Miami | MATCH |
| 657 | Vizcaya Village Garage - Historic Garage, 3250 S Miami Ave | Vizcaya Village Garage - Historic Garage 3250 S Miami Ave Miami | MATCH |
| 662 | Charles L. Williams Community Center, 1717 NW 5 Ave | Charles L. Williams Community Center 1717 NW 5 Ave Miami | MATCH |
| 663 | Charles L. Williams Community Center, 1717 NW 5 Ave | Charles L. Williams Community Center 1717 NW 5 Ave Miami | MATCH |
| 664 | Charles L. Williams Community Center, 1717 NW 5 Ave | Charles L. Williams Community Center 1717 NW 5 Ave Miami | MATCH |
| 665 | Joe Moretti Apartments, 240 SW 9 St | Joe Moretti Apartments 240 SW 9 St Miami | MATCH |
| 669 | Iglesia Adventista del Septimo Dia, 862 SW 4 St | Iglesia Adventista del Septimo Dia 862 SW 4 St Miami | MATCH |
| 670 | Miami Senior High School, 2450 SW 1 St | T Miami Senior High School 2450 SW 1 St Miami | MATCH |
| 671 | The Universal Church of The Kingdom of God, 3501 W Flagler St | The Universal Church of The Kingdom of God 3501 W Flagler St Miami | MATCH |
| 672 | David Fairchild Elementary School, 5757 SW 45 St | David Fairchild Elementary School 5757 SW 45 St Miami | MATCH |
| 673 | Gibson Bethel Community Center, 5800 SW 66 St | Gibson Bethel Community Center 5800 SW 66 St South Miami | MATCH |
| 674 | Iglesia Cristiana Comunidad de Esperanza, 6330 Bird Rd | Iglesia Cristiana Comunidad de Esperanza 6330 Bird Rd Miami | MATCH |
| 690 | The Universal Church of The Kingdom of God, 3501 W Flagler St | The Universal Church of The Kingdom of God 3501 W Flagler St Miami | MATCH |
| 694 | Christina M. Eve Elementary School, 16251 SW 99 St | Christina M. Eve Elementary School 16251 SW 99 St Miami | MATCH |
| 695 | The Way Miami, 14105 SW 184 St | The Way Miami 14105 SW 184 St Miami | MATCH |
| 696 | Kenwood K-8 Center, 9300 SW 79 Ave | Kenwood K-8 Center 9300 SW 79 Ave Miami | MATCH |
| 697 | Jane S. Roberts K-8 Center, 14850 Cottonwood Cir | Jane S. Roberts K-8 Center 14850 Cottonwood Cir Miami | MATCH |
| 698 | Roberto Clemente Park, 101 NW 34 St | Roberto Clemente Park 101 NW 34 St Miami | MATCH |
| 699 | Kendall Breeze HOA, 12300 SW 125 Ct | Kendall Breeze HOA 12300 SW 125 Ct Miami | MATCH |
| 700 | Jorge Mas Canosa Middle School, 15735 SW 144 St | Jorge Mas Canosa Middle School 15735 SW 144 St Miami | MATCH |
| 701 | Bowman Ashe/ Doolin K-8 Academy, 6601 SW 152 Ave | Bowman Ashe/ Doolin K-8 Academy 6601 SW 152 Ave Miami | MATCH |
| 702 | Lamar Louise Curry Middle School, 15750 SW 47 St | Lamar Louise Curry Middle School 15750 SW 47 St Miami | MATCH |
| 703 | Ramblewood Condominium, 13711 SW 66 St | Ramblewood Condominium 13711 SW 66 St Miami | MATCH |
| 704 | Bent Tree Elementary School, 4861 SW 140 Ave | Bent Tree Elementary School 4861 SW 140 Ave Miami | MATCH |
| 705 | Reception Palace Ballrooms, 14375 SW 42 St | T Reception Palace Ballrooms 14375 SW 42 St Miami | MATCH |
| 706 | Elim Missionary Assembly, 11989 SW 56 St | Elim Missionary Assembly 11989 SW 56 St Miami | MATCH |
| 707 | German American Social Club, 11919 SW 56 St | German American Social Club 11919 SW 56 St Miami | MATCH |
| 708 | Royal Palm Elementary School, 4200 SW 112 Ct | Royal Palm Elementary School 4200 SW 112 Ct Miami || Royal Palm Elementary School 4200 SW 112 Ct Miami | MATCH |
| 709 | Eureka Villas Park, 14301 SW 180 St | Eureka Villas Park 14301 SW 180 St Miami | MATCH |
| 710 | Westwood Park, 11350 SW 53 Ter | Westwood Park 11350 SW 53 Ter Miami || Westwood Park 11350 SW 53 Ter Miami | MATCH |
| 711 | Devon Aire K-8 Center, 10501 SW 122 Ave | Devon Aire K-8 Center 10501 SW 122 Ave Miami | MATCH |
| 712 | Saint Timothy Catholic Church, 5400 SW 102 Ave | Saint Timothy Catholic Church 5400 SW 102 Ave Miami | MATCH |
| 713 | Tropical Estates Recreation Center, 10201 SW 48 St | Tropical Estates Recreation Center 10201 SW 48 St Miami | MATCH |
| 714 | Blue Lakes Elementary School, 9250 SW 52 Ter | Blue Lakes Elementary School 9250 SW 52 Ter Miami | MATCH |
| 715 | Southwest Miami Senior High School, 8855 SW 50 Ter | Southwest Miami Senior High School 8855 SW 50 Ter Miami | MATCH |
| 716 | Tropical Park Community Center, 7900 SW 40 St | Tropical Park Community Center 7900 SW 40 St Miami | MATCH |
| 717 | South Miami Senior High School, 6856 SW 53 St | South Miami Senior High School 6856 SW 53 St Miami | MATCH |
| 718 | Miami Elk's Lodge #948, 10301 SW 72 St | Miami Elk's Lodge #948 10301 SW 72 St Miami | MATCH |
| 719 | Unitarian Universalist Congregation, 7701 SW 76 Ave | Unitarian Universalist Congregation 7701 SW 76 Ave Miami | MATCH |
| 720 | Alpha & Omega Church, 7800 SW 56 St | Alpha & Omega Church 7800 SW 56 St Miami | MATCH |
| 721 | Kings Creek Village Recreation Center, 8333 SW 81 Ave | Kings Creek Village Recreation Center 8333 SW 81 Ave Miami | MATCH |
| 722 | Eureka Park, 18320 SW 119 Ave | Eureka Park 18320 SW 119 Ave Miami | MATCH |
| 723 | Kendall Branch Library, 9101 SW 97 Ave | Kendall Branch Library 9101 SW 97 Ave Miami | MATCH |
| 724 | Kendall Branch Library, 9101 SW 97 Ave | Kendall Branch Library 9101 SW 97 Ave Miami | MATCH |
| 725 | Promenade Condominium Club House #2, 14225 SW 88 St | Promenade Condominium Club House #2 14225 SW 88 St Miami | MATCH |
| 726 | Snapper Creek Elementary School, 10151 SW 64 St | Snapper Creek Elementary School 10151 SW 64 St Miami | MATCH |
| 727 | Sunset Park Elementary School, 10235 SW 84 St | Sunset Park Elementary School 10235 SW 84 St Miami | MATCH |
| 728 | Ruth Owens Kruse Educational Center, 11001 SW 76 St | Ruth Owens Kruse Educational Center 11001 SW 76 St Miami | MATCH |
| 730 | Snapper Creek Townhouse Recreation Center, 11200 SW 71 St | Snapper Creek Townhouse Recreation Center 11200 SW 71 St Miami || Snapper Creek Townhouse Recreation Center 11200 SW 71 St Miami | MATCH |
| 731 | Cypress Elementary School, 5400 SW 112 Ct | Cypress Elementary School 5400 SW 112 Ct Miami | MATCH |
| 732 | Howard D. McMillan Middle School, 13100 SW 59 St | Howard D. McMillan Middle School 13100 SW 59 St Miami | MATCH |
| 733 | Winston Park Club House, 8100 SW 132  Ave | Winston Park Club House 8100 SW 132 Ave Miami | MATCH |
| 734 | Kendale Lakes Elementary School, 8000 SW 142 Ave | Kendale Lakes Elementary School 8000 SW 142 Ave Miami | MATCH |
| 735 | Promenade Condominium Club House #2, 14225 SW 88 St | Promenade Condominium Club House #2 14225 SW 88 St Miami | MATCH |
| 736 | Dante B. Fascell Elementary School, 15625 SW 80 St | Dante B. Fascell Elementary School 15625 SW 80 St Miami | MATCH |
| 737 | Oliver Hoover Elementary School, 9050 Hammocks Blvd | Oliver Hoover Elementary School 9050 Hammocks Blvd Miami | MATCH |
| 738 | Felix Varela Senior High School, 15255 SW 96 St | Felix Varela Senior High School 15255 SW 96 St Miami | MATCH |
| 739 | Miami-Dade County Fire Station #36, 10001 Hammocks Blvd | Miami-Dade County Fire Station #36 10001 Hammocks Blvd Miami | MATCH |
| 740 | Claude Pepper Elementary School, 14550 SW 96 St | Claude Pepper Elementary School 14550 SW 96 St Miami | MATCH |
| 741 | The Crossings Country Club, 11578 SW 132 Ave | The Crossings Country Club 11578 SW 132 Ave Miami | MATCH |
| 743 | Devon Aire Park, 10411 SW 122 Ave | Devon Aire Park 10411 SW 122 Ave Miami | MATCH |
| 744 | Calusa Elementary School, 9580 W Calusa Club Dr | Calusa Elementary School 9580 W Calusa Club Dr Miami | MATCH |
| 745 | Miami Killian Senior High School, 10655 SW 97 Ave | Miami Killian Senior High School 10655 SW 97 Ave Miami || Miami Killian Senior High School 10655 SW 97 Ave Miami | MATCH |
| 746 | William Lehman Elementary School, 10990 SW 113 Pl | William Lehman Elementary School 10990 SW 113 Pl Miami | MATCH |
| 747 | Miami Dade College - Kendall Campus, 11011 SW 104 St Bldg K | Miami Dade College - Kendall Campus 11011 SW 104 St Bldg K Miami | MATCH |
| 748 | Kendale Elementary School, 10693 SW 93 St | Kendale Elementary School 10693 SW 93 St Miami | MATCH |
| 749 | Ron Ehmann Recreation Center, 10995 SW 97 Ave | Ron Ehmann Recreation Center 10995 SW 97 Ave Miami | MATCH |
| 750 | Kendall Church of God, 8795 SW 112 St | Kendall Church of God 8795 SW 112 St Miami | MATCH |
| 751 | Metro Life Church - Dadeland Campus, 8100 SW 104 St | Metro Life Church - Dadeland Campus 8100 SW 104 St Miami | MATCH |
| 752 | Continental Park, 10000 SW 82 Ave | Continental Park 10000 SW 82 Ave Miami | MATCH |
| 754 | Leewood K-8 Center, 10343 SW 124 St | Leewood K-8 Center 10343 SW 124 St Miami | MATCH |
| 756 | Gloria Floyd Elementary School, 12650 SW 109 Ave | Gloria Floyd Elementary School 12650 SW 109 Ave Miami | MATCH |
| 757 | Country Walk Park Recreation Center, 14601 Country Walk Dr | Country Walk Park Recreation Center 14601 Country Walk Dr Miami | MATCH |
| 758 | Renew Church, 17569 SW 147 Ave | Renew Church 17569 SW 147 Ave Miami | MATCH |
| 759 | Norma Butler Bossard Elementary School, 15950 SW 144 St | Norma Butler Bossard Elementary School 15950 SW 144 St Miami | MATCH |
| 760 | Suniland Park, 12855 S Dixie Hwy | Suniland Park 12855 S Dixie Hwy Pinecrest | MATCH |
| 761 | West Kendall Regional Library, 10201 Hammocks Blvd | West Kendall Regional Library 10201 Hammocks Blvd Miami | MATCH |
| 762 | Wild Lime Park, 14751 Hammocks Blvd | Wild Lime Park 14751 Hammocks Blvd Miami | MATCH |
| 763 | Miami Sunset Sr. High School, 13125 SW 72 St | Miami Sunset Sr. High School 13125 SW 72 St Miami | MATCH |
| 764 | Bowman Ashe/Doolin K-8 Academy, 6401 SW 152 Ave | Bowman Ashe/Doolin K-8 Academy 6401 SW 152 Ave Miami | MATCH |
| 765 | General Conference Seventh-Day Adventist Church, 8100 SW 117 Ave | General Conference Seventh-Day Adventist Church 8100 SW 117 Ave Miami || General Conference Seventh-Day Adventist Church 8100 SW 117 Ave Miami | MATCH |
| 766 | Dr. Gilbert L. Porter Elementary School, 15851 SW 112 St | Dr. Gilbert L. Porter Elementary School 15851 SW 112 St Miami | MATCH |
| 767 | Oliver Hoover Elementary School, 9050 Hammocks Blvd | Oliver Hoover Elementary School 9050 Hammocks Blvd Miami | MATCH |
| 768 | Deerwood Bonita Lakes Park, 14445 SW 122 Ave | Deerwood Bonita Lakes Park 14445 SW 122 Ave Miami | MATCH |
| 769 | Arvida Middle School, 10900 SW 127 Ave | Arvida Middle School 10900 SW 127 Ave Miami | MATCH |
| 770 | Kendall Village Center, 8625 SW 124 Ave | Kendall Village Center 8625 SW 124 Ave Miami | MATCH |
| 771 | Killian Pines UTD Methodist Church, 10755 SW 112 St | Killian Pines UTD Methodist Church 10755 SW 112 St Miami | MATCH |
| 772 | McMillan Park, 6125 SW 133 Ave | McMillan Park 6125 SW 133 Ave Miami | MATCH |
| 773 | Bird Lakes Park, 14365 SW 48 Ln | Bird Lakes Park 14365 SW 48 Ln Miami | MATCH |
| 774 | Hammocks Middle School, 9889 Hammocks Blvd | Hammocks Middle School 9889 Hammocks Blvd Miami | MATCH |
| 775 | Westwind Lakes Park, 6805 SW 152 Ave | Westwind Lakes Park 6805 SW 152 Ave Miami | MATCH |
| 776 | Eureka Park, 18320 SW 119 Ave | Eureka Park 18320 SW 119 Ave Miami | MATCH |
| 777 | Miami Elk's Lodge #948, 10301 SW 72 St | Miami Elk's Lodge #948 10301 SW 72 St Miami | MATCH |
| 778 | Snapper Creek Elementary School, 10151 SW 64 St | Snapper Creek Elementary School 10151 SW 64 St Miami | MATCH |
| 779 | Killian Pines UTD Methodist Church, 10755 SW 112 St | Killian Pines UTD Methodist Church 10755 SW 112 St Miami | MATCH |
| 780 | Jack D. Gordon Elementary School Main Campus, 14600 Country Walk Dr | Jack D. Gordon Elementary School Main Campus 14600 Country Walk Dr Miami | MATCH |
| 781 | West Kendall Regional Library, 10201 Hammocks Blvd | West Kendall Regional Library 10201 Hammocks Blvd Miami | MATCH |
| 782 | Ramblewood Condominium, 13711 SW 66 St | Ramblewood Condominium 13711 SW 66 St Miami | MATCH |
| 783 | Our Lady of Lourdes Catholic Church, 11291 SW 142 Ave | Our Lady of Lourdes Catholic Church 11291 SW 142 Ave Miami | MATCH |
| 784 | Kendall Square K-8 Center, 9325 SW 169 Pl | Kendall Square K-8 Center 9325 SW 169 Pl Miami | MATCH |
| 785 | Kendale Lakes Elementary School, 8000 SW 142 Ave | Kendale Lakes Elementary School 8000 SW 142 Ave Miami | MATCH |
| 786 | Renew Church, 17569 SW 147 Ave | Renew Church 17569 SW 147 Ave Miami | MATCH |
| 787 | Miami Vineyard Community Church, 12725 SW 122 Ave | Miami Vineyard Community Church 12725 SW 122 Ave Miami | MATCH |
| 788 | Miami Vineyard Community Church, 12725 SW 122 Ave | Miami Vineyard Community Church 12725 SW 122 Ave Miami | MATCH |
| 789 | Miami Vineyard Community Church, 12725 SW 122 Ave | Miami Vineyard Community Church 12725 SW 122 Ave Miami | MATCH |
| 790 | Norma Butler Bossard Elementary School, 15950 SW 144 St | Norma Butler Bossard Elementary School 15950 SW 144 St Miami | MATCH |
| 791 | Gloria Floyd Elementary School, 12650 SW 109 Ave | Gloria Floyd Elementary School 12650 SW 109 Ave Miami | MATCH |
| 792 | Our Lady of Lourdes Catholic Church, 11291 SW 142 Ave | Our Lady of Lourdes Catholic Church 11291 SW 142 Ave Miami | MATCH |
| 793 | Kendale Lakes Branch Library, 15205 SW 88 St | Kendale Lakes Branch Library 15205 SW 88 St Miami | MATCH |
| 794 | Jorge Mas Canosa Middle School, 15735 SW 144 St | Jorge Mas Canosa Middle School 15735 SW 144 St Miami | MATCH |
| 795 | Eureka Villas Park, 14301 SW 180 St | Eureka Villas Park 14301 SW 180 St Miami | MATCH |
| 796 | Kendale Lakes Branch Library, 15205 SW 88 St | Kendale Lakes Branch Library 15205 SW 88 St Miami | MATCH |
| 797 | Miami-Dade County Fire Station #56, 16250 SW 72 St | Miami-Dade County Fire Station #56 16250 SW 72 St Miami | MATCH |
| 798 | Dr. Manuel C. Barreiro Elementary School, 5125 SW 162 Ave | Dr. Manuel C. Barreiro Elementary School 5125 SW 162 Ave Miami | MATCH |
| 800 | Bowman Ashe/Doolin K-8 Academy, 6401 SW 152 Ave | Bowman Ashe/Doolin K-8 Academy 6401 SW 152 Ave Miami | MATCH |
| 801 | Sgt. Joseph Delancy Park, 14450 Boggs Dr | T Glendale Baptist Church 14580 SW 117 Ave Miami | **MISMATCH** |
| 802 | Dorothy M. Wallace C.O.P.E. Center, 10225 SW 147 Ter | Dorothy M. Wallace C.O.P.E. Center 10225 SW 147 Ter Miami | MATCH |
| 803 | Richmond Heights Middle School, 15015 SW 103 Ave | Richmond Heights Middle School 15015 SW 103 Ave Miami | MATCH |
| 804 | Coral Reef Branch Library, 9211 SW 152 St | Coral Reef Branch Library 9211 SW 152 St Miami | MATCH |
| 805 | Sgt. Joseph Delancy Park, 14450 Boggs Dr | T Glendale Baptist Church 14580 SW 117 Ave Miami | **MISMATCH** |
| 806 | Coral Reef Elementary School, 7955 SW 152 St | Coral Reef Elementary School 7955 SW 152 St Palmetto Bay | MATCH |
| 807 | Howard Drive Elementary School, 7750 SW 136 St | Howard Drive Elementary School 7750 SW 136 St Miami | MATCH |
| 808 | St. Andrews Episcopal Church, 14260 Old Cutler Rd | St. Andrews Episcopal Church 14260 Old Cutler Rd Palmetto Bay | MATCH |
| 810 | St. Andrews Episcopal Church, 14260 Old Cutler Rd | St. Andrews Episcopal Church 14260 Old Cutler Rd Palmetto Bay | MATCH |
| 811 | Marlin Moore Post #133, 16401 SW 90 Ave | Marlin Moore Post #133 16401 SW 90 Ave Palmetto Bay | MATCH |
| 812 | Kingdom Covenant Church, 10300 SW 162 St | Kingdom Covenant Church 10300 SW 162 St Miami | MATCH |
| 813 | Wilbur B. Bell Park, 10301 SW 170 Ter | Wilbur B. Bell Park 10301 SW 170 Ter Miami | MATCH |
| 814 | Glendale Baptist Church, 14580 SW 117 Ave | Glendale Baptist Church 14580 SW 117 Ave Miami | MATCH |
| 815 | Miami Heights Elementary School, 17661 SW 117 Ave | Miami Heights Elementary School 17661 SW 117 Ave Miami | MATCH |
| 816 | Church of The Ascension, 11201 SW 160 St | Church of The Ascension 11201 SW 160 St Miami | MATCH |
| 817 | Colonial Drive Park, 10750 SW 156 Ter | Colonial Drive Park 10750 SW 156 Ter Miami | MATCH |
| 818 | Ethel F. Beckford/Richmond Elementary School, 16929 SW 104 Ave | Ethel F. Beckford/Richmond Elementary School 16929 SW 104 Ave Miami | MATCH |
| 819 | Palmetto Bay Park, 17535 SW 95 Ave | Palmetto Bay Park 17535 SW 95 Ave Palmetto Bay | MATCH |
| 820 | Edward & Arlene Feller Community Room, 17641 Old Cutler Rd | Edward & Arlene Feller Community Room 17641 Old Cutler Rd Palmetto Bay | MATCH |
| 821 | Whispering Pines Elementary School, 18929 SW 89 Rd | Whispering Pines Elementary School 18929 SW 89 Rd Cutler Bay | MATCH |
| 822 | Caribbean K-8 Center, 11990 SW 200 St | Caribbean K-8 Center 11990 SW 200 St Miami | MATCH |
| 823 | Gulfstream Elementary School, 20900 SW 97 Ave | Gulfstream Elementary School 20900 SW 97 Ave Cutler Bay | MATCH |
| 824 | Cutler Bay Town Hall, 10720 Caribbean Blvd | Cutler Bay Town Hall 10720 Caribbean Blvd Cutler Bay | MATCH |
| 825 | South Dade Government Center, 10710 SW 211 St | T South Dade Government Center 10710 SW 211 St Cutler Bay | MATCH |
| 826 | Robert Russa Moton Elementary School, 18050 Homestead Ave | Robert Russa Moton Elementary School 18050 Homestead Ave Miami | MATCH |
| 827 | Iglesia Bautista McCall, 18880 SW 114 Ave | Iglesia Bautista McCall 18880 SW 114 Ave Miami | MATCH |
| 828 | Isaac A. Withers Enrichment Center, 21300 SW 122 Ave | Isaac A. Withers Enrichment Center 21300 SW 122 Ave Miami | MATCH |
| 829 | Caribbean K-8 Center, 11990 SW 200 St | Caribbean K-8 Center 11990 SW 200 St Miami | MATCH |
| 830 | Isaac A. Withers Enrichment Center, 21300 SW 122 Ave | Isaac A. Withers Enrichment Center 21300 SW 122 Ave Miami | MATCH |
| 831 | Isaac A. Withers Enrichment Center, 21300 SW 122 Ave | Isaac A. Withers Enrichment Center 21300 SW 122 Ave Miami | MATCH |
| 832 | Dr. Edward L. Whigham Elementary School, 21545 SW 87 Ave | Dr. Edward L. Whigham Elementary School 21545 SW 87 Ave Cutler Bay | MATCH |
| 833 | Goulds Park, 11350 SW 216 St | Goulds Park 11350 SW 216 St Miami | MATCH |
| 834 | Morning Star Baptist Church, 22769 SW 120 Ave | Morning Star Baptist Church 22769 SW 120 Ave Miami | MATCH |
| 835 | Miami Arts Studio 6-12 @ Zelda Glazer, 15015 SW 24 St | Miami Arts Studio 6-12 @ Zelda Glazer 15015 SW 24 St Miami | MATCH |
| 836 | South Dade Government Center, 10710 SW 211 St | T South Dade Government Center 10710 SW 211 St Cutler Bay | MATCH |
| 837 | Southwood Middle School, 16301 SW 80 Ave | Southwood Middle School 16301 SW 80 Ave Palmetto Bay | MATCH |
| 838 | South Miami Heights Elementary School, 12231 SW 190 Ter | South Miami Heights Elementary School 12231 SW 190 Ter Miami | MATCH |
| 839 | Pine Villa Elementary School, 21799 SW 117 Ct | Pine Villa Elementary School 21799 SW 117 Ct Miami | MATCH |
| 840 | Palmetto Golf Course, 9300 SW 152 St | Palmetto Golf Course 9300 SW 152 St Palmetto Bay | MATCH |
| 841 | Robert Morgan Educational Center, 18180 SW 122 Ave | Robert Morgan Educational Center 18180 SW 122 Ave Miami | MATCH |
| 842 | Coral Reef Branch Library, 9211 SW 152 St | Coral Reef Branch Library 9211 SW 152 St Miami | MATCH |
| 843 | Pine Villa Elementary School, 21799 SW 117 Ct | Pine Villa Elementary School 21799 SW 117 Ct Miami | MATCH |
| 844 | Palmetto Golf Course, 9300 SW 152 St | Palmetto Golf Course 9300 SW 152 St Palmetto Bay | MATCH |
| 845 | Iglesia Cristiana Peace, 12755 Quail Roost Dr | Iglesia Cristiana Peace 12755 Quail Roost Dr Miami | MATCH |
| 846 | Upper Room Assembly of God, 19701 SW 127 Ave | Upper Room Assembly of God 19701 SW 127 Ave Miami | MATCH |
| 847 | Cutler Bay Senior High School, 8601 SW 212 St | Cutler Bay Senior High School 8601 SW 212 St Cutler Bay | MATCH |
| 848 | Iglesia Cristiana Peace, 12755 Quail Roost Dr | Iglesia Cristiana Peace 12755 Quail Roost Dr Miami | MATCH |
| 849 | Iglesia Cristiana Peace, 12755 Quail Roost Dr | Iglesia Cristiana Peace 12755 Quail Roost Dr Miami | MATCH |
| 851 | Miami Southridge Senior High School, 19355 SW 114 Ave | Miami Southridge Senior High School 19355 SW 114 Ave Miami | MATCH |
| 852 | Morning Star Baptist Church, 22769 SW 120 Ave | Morning Star Baptist Church 22769 SW 120 Ave Miami | MATCH |
| 853 | Silver Palm United Methodist Church, 15855 SW 248 St | Silver Palm United Methodist Church 15855 SW 248 St Homestead | MATCH |
| 854 | Cutler Bay Worship Center, 8601 SW 199 St | Cutler Bay Worship Center 8601 SW 199 St Cutler Bay | MATCH |
| 856 | Goulds Park, 11350 SW 216 St | Goulds Park 11350 SW 216 St Miami | MATCH |
| 857 | Country Walk Park Recreation Center, 14601 Country Walk Dr | Country Walk Park Recreation Center 14601 Country Walk Dr Miami | MATCH |
| 858 | Jack D. Gordon Elementary School Main Campus, 14600 Country Walk Dr | Jack D. Gordon Elementary School Main Campus 14600 Country Walk Dr Miami | MATCH |
| 859 | West Kendall Regional Library, 10201 Hammocks Blvd | West Kendall Regional Library 10201 Hammocks Blvd Miami | MATCH |
| 860 | Deerwood Bonita Lakes Park, 14445 SW 122 Ave | Deerwood Bonita Lakes Park 14445 SW 122 Ave Miami | MATCH |
| 862 | Isles at Bayshore Clubhouse, 21864 SW 93 Path | Isles at Bayshore Clubhouse 21864 SW 93 Path Cutler Bay | MATCH |
| 863 | Isles at Bayshore Clubhouse, 21864 SW 93 Path | Isles at Bayshore Clubhouse 21864 SW 93 Path Cutler Bay | MATCH |
| 880 | Goulds Church of Christ, 22800 SW 112 Ave | Goulds Church of Christ 22800 SW 112 Ave Miami | MATCH |
| 881 | Goulds Church of Christ, 22800 SW 112 Ave | Goulds Church of Christ 22800 SW 112 Ave Miami | MATCH |
| 882 | Goulds Church of Christ, 22800 SW 112 Ave | Goulds Church of Christ 22800 SW 112 Ave Miami | MATCH |
| 887 | Center for International Education, 900 NE 23 Ave | Center for International Education 900 NE 23 Ave Homestead | MATCH |
| 888 | Waterstone Grand, 4002 Waterstone Way | Waterstone Grand 4002 Waterstone Way Homestead | MATCH |
| 889 | Iglesia Cristiana El Buen Samaritano, 13550 SW 256 St | Iglesia Cristiana El Buen Samaritano 13550 SW 256 St Homestead | MATCH |
| 890 | Air Base K-8 Center, 12829 SW 272 St | Air Base K-8 Center 12829 SW 272 St Homestead | MATCH |
| 891 | Homestead Air Reserve Park, 27401 SW 127 Ave | Homestead Air Reserve Park 27401 SW 127 Ave Homestead | MATCH |
| 893 | Homestead Air Reserve Park, 27401 SW 127 Ave | Homestead Air Reserve Park 27401 SW 127 Ave Homestead | MATCH |
| 894 | Villages of Homestead Audubon Club House, 1851 S Canal Dr | Villages of Homestead Audubon Club House 1851 S Canal Dr Homestead | MATCH |
| 895 | Oasis Club House, 171 NE 30 Rd | Oasis Club House 171 NE 30 Rd Homestead | MATCH |
| 897 | Center for International Education, 900 NE 23 Ave | Center for International Education 900 NE 23 Ave Homestead | MATCH |
| 898 | The Way Miami, 14105 SW 184 St | The Way Miami 14105 SW 184 St Miami | MATCH |
| 900 | Silver Palm United Methodist Church, 15855 SW 248 St | Silver Palm United Methodist Church 15855 SW 248 St Homestead | MATCH |
| 901 | Fruit & Spice Park, 24801 SW 187 Ave | Fruit & Spice Park 24801 SW 187 Ave Homestead | MATCH |
| 902 | Naranja Community Resource Center, 13955 SW 264 St | Naranja Community Resource Center 13955 SW 264 St Homestead | MATCH |
| 903 | Naranja Park Recreation Center, 14150 SW 264 St | Naranja Park Recreation Center 14150 SW 264 St Homestead | MATCH |
| 904 | Naranja Community Resource Center, 13955 SW 264 St | Naranja Community Resource Center 13955 SW 264 St Homestead | MATCH |
| 905 | Iglesia Cristiana El Buen Samaritano, 13550 SW 256 St | Iglesia Cristiana El Buen Samaritano 13550 SW 256 St Homestead | MATCH |
| 906 | Miami Dade College - Homestead Campus, 500 College Ter | Miami Dade College - Homestead Campus 500 College Ter Homestead | MATCH |
| 907 | Villages of Homestead Audubon Club House, 1851 S Canal Dr | Villages of Homestead Audubon Club House 1851 S Canal Dr Homestead | MATCH |
| 908 | Naranja Branch Library, 14850 SW 280 St | Naranja Branch Library 14850 SW 280 St Naranja | MATCH |
| 909 | Naranja Branch Library, 14850 SW 280 St | Naranja Branch Library 14850 SW 280 St Naranja | MATCH |
| 910 | Iglesia Centro De Fe, 29800 SW 153 Ct | Iglesia Centro De Fe 29800 SW 153 Ct Homestead | MATCH |
| 911 | Live Like Bella Park, 29305 Illinois Rd | Live Like Bella Park 29305 Illinois Rd Homestead | MATCH |
| 912 | Live Like Bella Park, 29305 Illinois Rd | Live Like Bella Park 29305 Illinois Rd Homestead | MATCH |
| 913 | South Dade Park, 28151 SW 164 Ave | South Dade Park 28151 SW 164 Ave Homestead | MATCH |
| 914 | John D. Campbell Agricultural Center, 18710 SW 288 St | John D. Campbell Agricultural Center 18710 SW 288 St Homestead | MATCH |
| 915 | Homestead Community Center (William F. Dickinson), 1601 N Krome Ave | Homestead Community Center (William F. Dickinson) 1601 N Krome Ave Homestead | MATCH |
| 916 | Miami Dade College - Homestead Campus, 500 College Ter | Miami Dade College - Homestead Campus 500 College Ter Homestead | MATCH |
| 917 | Live Like Bella Park, 29305 Illinois Rd | Live Like Bella Park 29305 Illinois Rd Homestead | MATCH |
| 919 | Oasis Club House, 171 NE 30 Rd | Oasis Club House 171 NE 30 Rd Homestead | MATCH |
| 920 | Phichol Williams Community Center, 951 SW 4 St | Phichol Williams Community Center 951 SW 4 St Homestead | MATCH |
| 922 | Florida City-Homestead Community Resource Center, 1600 NW 6 Ct | Florida City-Homestead Community Resource Center 1600 NW 6 Ct Florida City | MATCH |
| 928 | Homestead Senior High School, 2351 SE 12 Ave | Homestead Senior High School 2351 SE 12 Ave Homestead | MATCH |
| 929 | Homestead Senior High School, 2351 SE 12 Ave | Homestead Senior High School 2351 SE 12 Ave Homestead | MATCH |
| 930 | Phichol Williams Community Center, 951 SW 4 St | Phichol Williams Community Center 951 SW 4 St Homestead | MATCH |
| 931 | Homestead Mennonite Church, 30695 SW 162 Ave | Homestead Mennonite Church 30695 SW 162 Ave Homestead | MATCH |
| 932 | Goulds Church of Christ, 22800 SW 112 Ave | Goulds Church of Christ 22800 SW 112 Ave Miami | MATCH |
| 933 | Florida City Elementary School, 364 NW 6 Ave | Florida City Elementary School 364 NW 6 Ave Florida City | MATCH |
| 934 | Waterstone Grand, 4002 Waterstone Way | Waterstone Grand 4002 Waterstone Way Homestead | MATCH |
| 935 | Florida City Elementary School, 364 NW 6 Ave | Florida City Elementary School 364 NW 6 Ave Florida City | MATCH |
| 936 | Florida City Elementary School, 364 NW 6 Ave | Florida City Elementary School 364 NW 6 Ave Florida City | MATCH |
| 938 | Florida City Elementary School, 364 NW 6 Ave | Florida City Elementary School 364 NW 6 Ave Florida City | MATCH |
| 943 | Florida City Elementary School, 364 NW 6 Ave | Florida City Elementary School 364 NW 6 Ave Florida City | MATCH |
| 944 | Naranja Park Recreation Center, 14150 SW 264 St | Naranja Park Recreation Center 14150 SW 264 St Homestead | MATCH |
| 947 | Coconut Palm K-8 Academy, 24400 SW 124 Ave | Coconut Palm K-8 Academy 24400 SW 124 Ave Homestead | MATCH |
| 948 | Miami-Dade County East Homestead Fire Station #65, 1350 SE 24 St | Miami-Dade County East Homestead Fire Station #65 1350 SE 24 St Homestead | MATCH |
| 949 | Gateway Environmental K-8 Learning Center, 955 SE 18 Ave | Gateway Environmental K-8 Learning Center 955 SE 18 Ave Homestead | MATCH |
| 951 | Florida City City Hall, 404 W Palm Dr | Florida City City Hall 404 W Palm Dr Florida City | MATCH |
| 953 | South Dade Baptist Church, 17105 SW 296 St | South Dade Baptist Church 17105 SW 296 St Homestead | MATCH |
| 957 | Cutler Cay Homeowners Association, 7755 SW 192 St | Cutler Cay Homeowners Association 7755 SW 192 St Cutler Bay | MATCH |
| 958 | Club Malibu Bay, 1020 Malibu Way | Club Malibu Bay 1020 Malibu Way Homestead | MATCH |
| 959 | Club Malibu Bay, 1020 Malibu Way | Club Malibu Bay 1020 Malibu Way Homestead | MATCH |
| 960 | Morning Star Baptist Church, 22769 SW 120 Ave | Morning Star Baptist Church 22769 SW 120 Ave Miami | MATCH |
| 961 | Morning Star Baptist Church, 22769 SW 120 Ave | Morning Star Baptist Church 22769 SW 120 Ave Miami | MATCH |
| 962 | Iglesia Bautista Manantial De Vida, 13155 SW 232 St | Iglesia Bautista Manantial De Vida 13155 SW 232 St Miami | MATCH |
| 963 | Avant School of Excellence, 777 W Palm Dr | Avant School of Excellence 777 W Palm Dr Homestead | MATCH |
| 967 | Isaac A. Withers Enrichment Center, 21300 SW 122 Ave | Isaac A. Withers Enrichment Center 21300 SW 122 Ave Miami | MATCH |
| 969 | Iglesia Bautista Manantial De Vida, 13155 SW 232 St | Iglesia Bautista Manantial De Vida 13155 SW 232 St Miami | MATCH |
| 971 | Kinloch Park Middle School, 4340 NW 3 St | Kinloch Park Middle School 4340 NW 3 St Miami | MATCH |
| 975 | Culmer Neighborhood Service Center, 1600 NW 3 Ave | Culmer Neighborhood Service Center 1600 NW 3 Ave Miami | MATCH |
| 976 | Paul Laurence Dunbar K-8 Center, 505 NW 20 St | Paul Laurence Dunbar K-8 Center 505 NW 20 St Miami | MATCH |
| 979 | Silver Palm United Methodist Church, 15855 SW 248 St | Silver Palm United Methodist Church 15855 SW 248 St Homestead | MATCH |
| 980 | Alfred I. DuPont Building, 169 E Flagler St | Alfred I. DuPont Building 169 E Flagler St Miami | MATCH |
| 981 | Alfred I. DuPont Building, 169 E Flagler St | Alfred I. DuPont Building 169 E Flagler St Miami | MATCH |
| 982 | Alfred I. DuPont Building, 169 E Flagler St | Alfred I. DuPont Building 169 E Flagler St Miami | MATCH |
| 983 | Alfred I. DuPont Building, 169 E Flagler St | Alfred I. DuPont Building 169 E Flagler St Miami | MATCH |
| 984 | Alfred I. DuPont Building, 169 E Flagler St | Alfred I. DuPont Building 169 E Flagler St Miami | MATCH |
| 985 | Jack Orr Senior Center, 550 NW 5 St | Jack Orr Senior Center 550 NW 5 St Miami | MATCH |
| 986 | Charlie DeLucca Park (Kinloch Park), 455 NW 47 Ave | Charlie DeLucca Park (Kinloch Park) 455 NW 47 Ave Miami | MATCH |
| 988 | Miami Police Benevolent Association, 2300 NW 14 St | Miami Police Benevolent Association 2300 NW 14 St Miami | MATCH |

## Reproduce
```bash
D=$(mktemp -d); cd $D; B=https://www.miamidade.gov/elections/library
curl -s "https://www.googleapis.com/civicinfo/v2/elections?key=$GEMINI_API_KEY" | grep -E '"(code|message|reason)"'
curl -s -o /dev/null -w "%{http_code}\n" "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
curl -s "https://web.archive.org/cdx/search/cdx?url=miamidade.gov/elections/library/*&output=txt&fl=original,timestamp,statuscode&collapse=urlkey&limit=20000" | grep -i polling-place
for f in 2026-11-03-general-election-polling-place-list 2026-08-18-primary-election-polling-place-list 2024-11-05-general-election-polling-place-list; do
  curl -s -A "Mozilla/5.0" -o $f.pdf $B/$f.pdf; pdftotext -raw $f.pdf $f.raw.txt; done
grep -nE "^(535|099|253|801|805|389)\.0" 2026-11-03-general-election-polling-place-list.raw.txt
curl -s -G "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/PollingPlace_gdb/FeatureServer/0/query" \
  --data-urlencode "where=1=1" --data-urlencode "outFields=PRECINCT,NAME,ADDRESS,CITY,ZIPCODE" --data-urlencode "returnGeometry=false" --data-urlencode "resultRecordCount=2000" -d f=json > layer.json
# compare: join wrapped lines, skip footers, normalise to [a-z0-9], substring-match layer NAME and ADDRESS (script kept in OS temp dir, not in repo)
```
