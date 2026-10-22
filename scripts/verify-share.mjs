#!/usr/bin/env node
// Checks what a friend sees when the app is shared: the page's preview tags (what LinkedIn,
// Facebook, WhatsApp and X read), the 1200x630 preview image, and every share link in
// lib/share.ts (right host, carries the app's address and nothing about the voter).
// Usage: node --experimental-strip-types scripts/verify-share.mjs [--base URL]   (default: production)
import { SHARE_DOMAIN, shareLinks } from "../lib/share.ts";

const i = process.argv.indexOf("--base");
const base = i > -1 ? process.argv[i + 1] : "https://yourballotyourblock.com";
const problems = [];
const ok = (m) => console.log(`ok   ${m}`);
const bad = (m) => {
  problems.push(m);
  console.log(`FAIL ${m}`);
};

// 1. Preview tags, read the way a crawler reads them.
const html = await (await fetch(base, { headers: { "user-agent": "facebookexternalhit/1.1" } })).text();
const meta = (key) =>
  html.match(new RegExp(`<meta[^>]+(?:property|name)="${key}"[^>]+content="([^"]*)"`))?.[1] ??
  html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${key}"`))?.[1];
for (const key of ["og:title", "og:description", "og:image", "og:url", "twitter:card"]) {
  const v = meta(key);
  v ? ok(`${key} = ${v.slice(0, 90)}`) : bad(`missing ${key}`);
}
const image = meta("og:image");
if (image && !/^https:\/\/yourballotyourblock\.com\//.test(image)) bad(`og:image must be an absolute https URL on the site, got ${image}`);
if (meta("twitter:card") && meta("twitter:card") !== "summary_large_image") bad("twitter:card should be summary_large_image");

// 2. The preview image itself (fetched from the base being tested, so it works locally too).
if (image) {
  const local = image.replace(/^https:\/\/yourballotyourblock\.com/, base);
  const res = await fetch(local);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type");
  const isPng = buf.subarray(1, 4).toString() === "PNG";
  const w = isPng ? buf.readUInt32BE(16) : 0;
  const h = isPng ? buf.readUInt32BE(20) : 0;
  res.status === 200 && type?.includes("image/png") && w === 1200 && h === 630
    ? ok(`preview image ${local} -> 200 ${type} ${w}x${h}, ${buf.length} bytes`)
    : bad(`preview image ${local} -> ${res.status} ${type} ${w}x${h}`);
}

// 3. Every share link.
const HOSTS = { linkedin: "www.linkedin.com", facebook: "www.facebook.com", x: "x.com", whatsapp: "wa.me", sms: null };
for (const [network, href] of Object.entries(shareLinks())) {
  const decoded = decodeURIComponent(href);
  const host = HOSTS[network] ? new URL(href).host : "sms:";
  const hostOk = HOSTS[network] ? host === HOSTS[network] : href.startsWith("sms:");
  const carries = decoded.includes(`https://${SHARE_DOMAIN}`);
  // Only the app's own address may appear, never a path or query with anything about a voter.
  const extra = [...decoded.matchAll(/https?:\/\/yourballotyourblock\.com(\S*)/g)].map((m) => m[1]).filter((p) => p && p !== "/");
  hostOk && carries && !extra.length
    ? ok(`${network.padEnd(8)} ${href.slice(0, 100)}`)
    : bad(`${network}: host ${host}, carries site ${carries}, extra ${JSON.stringify(extra)}`);
}

console.log(problems.length ? `${problems.length} problem(s)` : "PASS");
process.exit(problems.length ? 1 : 0);
