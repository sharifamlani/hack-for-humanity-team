import { ImageResponse } from "next/og";

// The home-screen icon on iPhones: the same ballot-into-the-box mark as app/icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0b" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <rect x="4.5" y="15" width="23" height="12.5" rx="2.5" fill="#55e6b0" />
          <rect x="8.5" y="13.8" width="15" height="2.6" rx="1.3" fill="#0a0a0b" />
          <rect x="10.5" y="3.5" width="11" height="11.6" rx="1.2" fill="#f5f3ee" />
          <path
            d="M13 9.4 L15.2 11.6 L19.2 7.2"
            fill="none"
            stroke="#ff5a4e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
