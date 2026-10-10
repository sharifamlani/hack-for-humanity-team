import type { Geo } from "./types";

// U.S. Census Geocoder — keyless. Returns the districts in force for Nov 3, 2026
// (120th Congress, 2026 state legislative lines).
const BASE = "https://geocoding.geo.census.gov/geocoder/geographies";
const COMMON = "benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json";

type Layers = Record<string, Record<string, string>[] | undefined>;

function findLayer(layers: Layers, pattern: RegExp) {
  const key = Object.keys(layers).find((k) => pattern.test(k));
  return key ? layers[key]?.[0] : undefined;
}

function toGeo(layers: Layers, lat: number, lon: number, matched: string | null): Geo {
  const num = (v?: string) => (v ? String(parseInt(v, 10)) : null);
  return {
    matchedAddress: matched,
    lat,
    lon,
    county: findLayer(layers, /^Counties$/)?.BASENAME ?? null,
    city: findLayer(layers, /^Incorporated Places$/)?.BASENAME ?? null,
    congressional: num(findLayer(layers, /Congressional Districts$/)?.BASENAME),
    stateSenate: num(findLayer(layers, /State Legislative Districts - Upper$/)?.BASENAME),
    stateHouse: num(findLayer(layers, /State Legislative Districts - Lower$/)?.BASENAME),
  };
}

async function getJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!res.ok) throw new Error(`Census geocoder HTTP ${res.status}`);
  return res.json();
}

export async function geocodeAddress(address: string): Promise<Geo | null> {
  const json = await getJson(
    `${BASE}/onelineaddress?address=${encodeURIComponent(address)}&${COMMON}`,
  );
  const match = json?.result?.addressMatches?.[0];
  if (!match) return null;
  return toGeo(match.geographies, match.coordinates.y, match.coordinates.x, match.matchedAddress);
}

export async function geocodePoint(lat: number, lon: number): Promise<Geo | null> {
  const json = await getJson(`${BASE}/coordinates?x=${lon}&y=${lat}&${COMMON}`);
  const layers = json?.result?.geographies;
  if (!layers || !Object.keys(layers).length) return null;
  return toGeo(layers, lat, lon, null);
}
