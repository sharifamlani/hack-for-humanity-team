import type { EarlyVotingSite, PollingPlace } from "./types";

// Miami-Dade County open data (ArcGIS). All layers are public and keyless.
const BASE = "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services";

type Feature = {
  attributes: Record<string, string | number | null>;
  geometry?: { x: number; y: number };
};

async function query(service: string, layer: number, params: string): Promise<Feature[]> {
  const url = `${BASE}/${service}/FeatureServer/${layer}/query?${params}&f=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000), cache: "no-store" });
  if (!res.ok) throw new Error(`${service} HTTP ${res.status}`);
  const json = await res.json();
  // ArcGIS reports errors with HTTP 200 and an error body.
  if (json.error) throw new Error(`${service}: ${json.error.message}`);
  return json.features ?? [];
}

const atPoint = (lat: number, lon: number) =>
  `geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
  `&spatialRel=esriSpatialRelIntersects&returnGeometry=false`;

// The county's pre-2026 congressional layer. It only covers the four districts that
// were inside Miami-Dade on the old map. Display names are spelled out here because
// the layer's own REPNAME field has broken accent characters.
const OLD_LINES_REPS: Record<string, string> = {
  "24": "Frederica Wilson",
  "26": "Mario Díaz-Balart",
  "27": "María Elvira Salazar",
  "28": "Carlos A. Giménez",
};

export async function oldCongressionalDistrict(lat: number, lon: number) {
  const features = await query(
    "CongressionalDistrict_gdb",
    0,
    `${atPoint(lat, lon)}&outFields=ID`,
  );
  const id = features[0]?.attributes.ID;
  if (id == null) return { district: null, rep: null };
  const district = String(id);
  return { district, rep: OLD_LINES_REPS[district] ?? null };
}

export async function pollingPlace(lat: number, lon: number): Promise<PollingPlace | null> {
  const precincts = await query("Precinct_gdb", 0, `${atPoint(lat, lon)}&outFields=ID`);
  const precinct = precincts[0]?.attributes.ID;
  if (precinct == null) return null;
  const places = await query(
    "PollingPlace_gdb",
    0,
    `where=PRECINCT%3D${precinct}&outFields=PRECINCT,NAME,ADDRESS,CITY,ZIPCODE,LAT,LON&returnGeometry=false`,
  );
  const a = places[0]?.attributes;
  if (!a) return null;
  return {
    precinct: Number(precinct),
    name: String(a.NAME),
    address: String(a.ADDRESS),
    city: String(a.CITY),
    zip: String(a.ZIPCODE),
    lat: Number(a.LAT),
    lon: Number(a.LON),
  };
}

function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

export async function nearestEarlyVoting(
  lat: number,
  lon: number,
  count = 2,
): Promise<EarlyVotingSite[]> {
  const features = await query(
    "ElectionGeography_public",
    0,
    "where=earlyvoting%3D%27Yes%27&outFields=name,fulladdr,municipality,handicap,dropbox,earlyvotingdate,earlyvotingenddate&outSR=4326",
  );
  return features
    .filter((f) => f.geometry)
    .map((f) => {
      const a = f.attributes;
      const g = f.geometry!;
      return {
        name: String(a.name),
        address: String(a.fulladdr),
        city: String(a.municipality ?? ""),
        accessible: a.handicap === "Yes",
        dropBox: a.dropbox === "Yes",
        opens: typeof a.earlyvotingdate === "number" ? a.earlyvotingdate : null,
        closes: typeof a.earlyvotingenddate === "number" ? a.earlyvotingenddate : null,
        miles: milesBetween(lat, lon, g.y, g.x),
        lat: g.y,
        lon: g.x,
      };
    })
    .sort((x, y) => x.miles - y.miles)
    .slice(0, count);
}
