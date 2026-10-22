import { ImageResponse } from "next/og";

// The link preview LinkedIn, Facebook, WhatsApp and X show when someone shares the app.
// Next builds it at /opengraph-image and adds the og:image tags itself.
export const alt = "Your Ballot. Your Block. See who's really on your Miami-Dade ballot, in their own words, and where you vote.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0a0b";
const INK = "#f5f3ee";
const MINT = "#55e6b0";
const CORAL = "#ff5a4e";
const SUN = "#ffc93c";
const SKY = "#7b8cff";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: INK,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
            <span>Your Ballot.&nbsp;</span>
            <span style={{ color: MINT }}>Your Block.</span>
          </div>
          {/* The brand shapes: flower, leaf, sun, sky. */}
          <svg width="286" height="121" viewBox="0 0 260 110">
            <g fill={CORAL}>
              <circle cx="30" cy="30" r="27" />
              <circle cx="78" cy="30" r="27" />
              <circle cx="30" cy="78" r="27" />
              <circle cx="78" cy="78" r="27" />
              <rect x="30" y="30" width="48" height="48" />
            </g>
            <path d="M112 4 C170 4 184 50 184 96 C132 96 112 62 112 4 Z" fill={MINT} />
            <circle cx="220" cy="42" r="39" fill={SUN} />
            <path d="M184 110 A38 38 0 0 1 260 110 Z" fill={SKY} />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 54, fontWeight: 700, lineHeight: 1.15 }}>
          <span>See who&apos;s really on your ballot,</span>
          <span>in their own words, and where you vote.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30 }}>
          <span style={{ color: "#c9c6bf" }}>Miami-Dade · Election Day Tue, Nov 3, 2026</span>
          <span style={{ color: MINT, fontWeight: 700 }}>yourballotyourblock.com</span>
        </div>
      </div>
    ),
    size,
  );
}
