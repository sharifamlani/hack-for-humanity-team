import { NextResponse } from "next/server";

// POST /api/voice-token
// Hands the browser a single-use, short-lived token for one live voice session, so the
// real API key never leaves the server.
export async function POST() {
  const minutes = (n: number) => new Date(Date.now() + n * 60_000).toISOString();
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({ uses: 1, expireTime: minutes(20), newSessionExpireTime: minutes(2) }),
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || !json.name) throw new Error(`token HTTP ${res.status}`);
    return NextResponse.json({ token: json.name });
  } catch {
    return NextResponse.json({ error: "Voice isn't available right now." }, { status: 502 });
  }
}
