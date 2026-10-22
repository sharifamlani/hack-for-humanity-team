#!/usr/bin/env node
// Checks the address -> districts -> ballot -> polling place chain on a running app against
// sources the app does not use for that answer:
//   - congressional district: Census (what the app uses) vs the county's 2026 map layer
//   - state senate / house:   Census vs the county's own district layers
//   - the point itself:       Census vs OpenStreetMap (Nominatim); precinct at both points
//   - ballot:                 every district race on the ballot matches the address's district
//   - polling place:          precinct exists, polling place is within a sane distance
// Usage: node scripts/verify-address-mapping.mjs [--base URL]   (default: production)
const i = process.argv.indexOf("--base");
const base = i > -1 ? process.argv[i + 1] : "https://hack-for-humanity-team.vercel.app";
const ARC = "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services";
const STATEWIDE = ["U.S. Senate", "Governor", "Attorney General", "Chief Financial Officer", "Commissioner of Agriculture"];

// Public buildings spread over the county, plus one outside it.
const ADDRESSES = [
  "2750 NW 3rd Ave, Miami, FL 33127",
  "1700 Convention Center Dr, Miami Beach, FL 33139",
  "17201 Collins Ave, Sunny Isles Beach, FL 33160",
  "111 NW 1st St, Miami, FL 33128",
  "3500 Pan American Dr, Miami, FL 33133",
  "11200 SW 8th St, Miami, FL 33199",
  "405 Biltmore Way, Coral Gables, FL 33134",
  "501 Palm Ave, Hialeah, FL 33010",
  "8401 NW 53rd Ter, Doral, FL 33166",
  "100 Civic Ct, Homestead, FL 33030",
  "10720 Caribbean Blvd, Cutler Bay, FL 33189",
  "17011 NE 19th Ave, North Miami Beach, FL 33162",
  "776 NE 125th St, North Miami, FL 33161",
  "404 W Palm Dr, Florida City, FL 33034",
  "12400 SW 152nd St, Miami, FL 33177",
  "10201 Hammocks Blvd, Miami, FL 33196",
  "100 N Andrews Ave, Fort Lauderdale, FL 33301",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function json(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30000) });
  return { status: res.status, body: await res.json().catch(() => null) };
}
async function layerId(service, lat, lon, field = "ID") {
  const q = `geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&returnGeometry=false&outFields=${field}&f=json`;
  const { body } = await json(`${ARC}/${service}/FeatureServer/0/query?${q}`);
  const v = body?.features?.[0]?.attributes?.[field];
  return v == null ? null : String(v);
}
async function osm(address) {
  await sleep(1100); // Nominatim usage policy: at most one request per second.
  const { body } = await json(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`,
    { headers: { "user-agent": "your-ballot-your-block address check (github.com/sharifamlani/hack-for-humanity-team)" } },
  );
  return body?.[0] ? { lat: Number(body[0].lat), lon: Number(body[0].lon) } : null;
}
const miles = (a, b) => {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
};

let failures = 0;
for (const address of ADDRESSES) {
  const problems = [];
  const notes = [];
  const { status, body: r } = await json(`${base}/api/lookup?address=${encodeURIComponent(address)}`);
  if (status !== 200) {
    const expected = /Fort Lauderdale/.test(address) && status === 422;
    console.log(`\n${expected ? "PASS" : "FAIL"}  ${address}\n   HTTP ${status}: ${r?.error ?? ""}`);
    if (!expected) failures++;
    continue;
  }
  if (r.savedExample) problems.push("served the SAVED venue example, not a live lookup");
  const g = r.geo;
  const here = { lat: g.lat, lon: g.lon };

  // Districts against the county's own layers at the same point.
  const [cd26, sen, house, pct] = await Promise.all([
    layerId("CongressionalDistrictReDist2026_gdb", g.lat, g.lon),
    layerId("SenateDistrict_gdb", g.lat, g.lon),
    layerId("HouseDistrict_gdb", g.lat, g.lon),
    layerId("Precinct_gdb", g.lat, g.lon),
  ]);
  if (cd26 !== g.congressional) problems.push(`congressional: app FL-${g.congressional}, county 2026 map FL-${cd26}`);
  if (sen !== g.stateSenate) problems.push(`state senate: app ${g.stateSenate}, county layer ${sen}`);
  if (house !== g.stateHouse) problems.push(`state house: app ${g.stateHouse}, county layer ${house}`);
  if (String(r.polling?.precinct ?? "") !== String(pct ?? "")) problems.push(`precinct: app ${r.polling?.precinct}, county layer ${pct}`);

  // The point itself, against a second geocoder.
  const o = await osm(address);
  if (!o) notes.push("OpenStreetMap: no match");
  else {
    const d = miles(here, o);
    const [oCd, oPct] = await Promise.all([
      layerId("CongressionalDistrictReDist2026_gdb", o.lat, o.lon),
      layerId("Precinct_gdb", o.lat, o.lon),
    ]);
    notes.push(`OSM point ${d.toFixed(2)} mi away → FL-${oCd}, precinct ${oPct}`);
    if (d > 0.5) problems.push(`Census and OpenStreetMap points are ${d.toFixed(2)} mi apart`);
    else {
      if (oCd !== g.congressional) problems.push(`OSM point lands in FL-${oCd}, app says FL-${g.congressional}`);
      if (oPct !== pct) notes.push(`(OSM point is in precinct ${oPct}; the two points straddle a precinct line)`);
    }
  }

  // Ballot: the district races must be this address's districts, statewide races all present.
  const races = r.ballot.flatMap((s) => s.races);
  const cands = races.flatMap((x) => x.candidates);
  for (const c of cands) {
    if (c.office === "U.S. House" && c.district !== `FL-${g.congressional}`) problems.push(`ballot has ${c.name} (${c.district}) for an FL-${g.congressional} address`);
    if (c.office === "Florida State Senate" && c.district !== g.stateSenate) problems.push(`ballot has state senate ${c.district} for district ${g.stateSenate}`);
    if (c.office === "Florida State House" && c.district !== g.stateHouse) problems.push(`ballot has state house ${c.district} for district ${g.stateHouse}`);
    if (c.jurisdiction?.startsWith("City of ") && c.jurisdiction !== `City of ${g.city}`) problems.push(`ballot has ${c.jurisdiction} race for a ${g.city ?? "unincorporated"} address`);
  }
  for (const office of STATEWIDE) if (!cands.some((c) => c.office === office)) problems.push(`missing statewide race: ${office}`);
  const has = (office) => cands.some((c) => c.office === office);
  if (!has("U.S. House")) problems.push(`no U.S. House race for FL-${g.congressional}`);
  if (!has("Florida State Senate")) notes.push(`no State Senate ${g.stateSenate} race on the ballot (not up in 2026, or missing from roster)`);
  const unopposed = (r.unopposed ?? []).find((u) => u.office.startsWith("Florida State House"));
  if (unopposed) notes.push(`State House ${g.stateHouse}: shown as unopposed (${unopposed.name})`);
  else if (!has("Florida State House")) problems.push(`no State House ${g.stateHouse} race on the ballot`);

  // Polling place sanity.
  if (!r.polling) problems.push("no polling place");
  else {
    const d = miles(here, { lat: r.polling.lat, lon: r.polling.lon });
    notes.push(`polling: precinct ${r.polling.precinct} → ${r.polling.name}, ${r.polling.address} (${d.toFixed(1)} mi)`);
    if (d > 3) problems.push(`polling place is ${d.toFixed(1)} mi away`);
  }

  const ok = problems.length === 0;
  if (!ok) failures++;
  console.log(`\n${ok ? "PASS" : "FAIL"}  ${address}`);
  console.log(`   matched: ${g.matchedAddress} | ${g.city ?? "unincorporated"}`);
  console.log(`   FL-${g.congressional} (old map FL-${r.oldDistrict ?? "?"}${r.districtChanged ? ", CHANGED" : ""}) · Senate ${g.stateSenate} · House ${g.stateHouse} · ${races.length} races, ${cands.length} names`);
  notes.forEach((n) => console.log(`   ${n}`));
  problems.forEach((p) => console.log(`   ✗ ${p}`));
}
console.log(`\n${ADDRESSES.length - failures}/${ADDRESSES.length} addresses pass`);
process.exit(failures ? 1 : 0);
