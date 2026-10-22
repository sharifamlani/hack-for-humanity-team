"use client";

import { useEffect, useState } from "react";
import { placeVoter, type Answers, type Placement } from "@/lib/match";

// Gemma 4 places the voter from the whole conversation. It takes about 20 seconds, so the
// rough index is shown first and replaced when the placement arrives. Shared by the ballot
// and the race screens so both show the same spot and the request is made once.
export function usePlacement(answers: Answers, said: Record<string, string>, openSaid: string, enabled: boolean) {
  const takesASide = Object.values(answers).filter((a) => a === "yea" || a === "nay").length;
  const canPlace = enabled && (takesASide >= 2 || openSaid.trim().length >= 40);
  // One request per distinct conversation; `settled` records which one has come back.
  const conversation = JSON.stringify({ answers, said, openSaid });
  const [settled, setSettled] = useState<{ key: string; placement: Placement | null } | null>(null);
  useEffect(() => {
    if (!canPlace) return;
    let cancelled = false;
    // Never wait forever: after 45 s the rough spot from the yes/no answers stands.
    fetch("/api/place", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: conversation,
      signal: AbortSignal.timeout(45000),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        return { x: json.x, low: json.low, high: json.high, why: json.why, source: "conversation", answers: json.turns } as Placement;
      })
      .catch(() => null)
      .then((placement) => {
        if (!cancelled) setSettled({ key: conversation, placement });
      });
    return () => {
      cancelled = true;
    };
  }, [conversation, canPlace]);
  const current = settled?.key === conversation ? settled : null;
  const placing = canPlace && !current;
  const me = current?.placement ?? placeVoter(answers);
  return { me, placing };
}
