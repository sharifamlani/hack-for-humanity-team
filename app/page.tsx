"use client";

import { useState } from "react";
import { BallotStep } from "@/components/BallotStep";
import { PollingStep } from "@/components/PollingStep";
import { STEPS, StepBar } from "@/components/StepBar";
import type { LookupResult } from "@/lib/types";

const VENUE_ADDRESS = "2750 NW 3rd Ave, Miami, FL 33127";

const THEMES = [
  { emoji: "🌊", label: "Water · air · land · fire", color: "bg-water" },
  { emoji: "🐢", label: "Wildlife", color: "bg-wildlife" },
  { emoji: "🎓", label: "Jobs & staying in Miami", color: "bg-jobs" },
];

// What each later step will show once it is wired. Shown on screen so nobody
// mistakes the shell for a working feature.
const COMING: Record<number, { title: string; body: string }> = {
  2: {
    title: "Ten real votes, your call",
    body: "Yes / No / Skip on questions Congress actually voted on, one card at a time.",
  },
  3: {
    title: "Where you stand",
    body: "You and the candidates on one scale for each theme, with a Gemma 4 explanation of where you differ.",
  },
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");

  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  // Later steps need a lookup result; without one, stay on the address screen.
  const goTo = (target: number) => setStep(result ? target : 0);

  async function lookup(query: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lookup?${query}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json);
      setStep(1);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("This browser can't share a location. Type your address instead.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => lookup(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => {
        setLoading(false);
        setError("We couldn't get your location. Type your address instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-6">
      <header className="flex items-center justify-between">
        <span className="text-xl font-black tracking-tight">
          305 <span className="text-accent">VOTES</span>
        </span>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="rounded-full bg-foreground px-3 py-1 text-background">
            Vote
          </span>
          <span className="rounded-full border border-foreground/20 px-3 py-1 text-foreground/40">
            Housing · soon
          </span>
          <span className="rounded-full border border-foreground/20 px-3 py-1 text-foreground/40">
            Climate · soon
          </span>
        </div>
      </header>

      <StepBar step={step} onStep={goTo} />

      {step === 0 ? (
        <main className="flex flex-1 flex-col gap-6">
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight">
            Your ballot.
            <br />
            Your block.
            <br />
            <span className="text-accent">Two minutes.</span>
          </h1>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (address.trim()) lookup(`address=${encodeURIComponent(address.trim())}`);
            }}
          >
            <label htmlFor="address" className="text-sm font-semibold">
              Your home address
            </label>
            <input
              id="address"
              type="text"
              autoComplete="street-address"
              placeholder="123 Main St, Miami, FL"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded-2xl border-2 border-foreground bg-card px-4 py-4 text-lg outline-none focus:ring-4 focus:ring-accent/30"
            />
            <button
              type="submit"
              disabled={!address.trim() || loading}
              className="rounded-2xl bg-accent px-4 py-4 text-lg font-bold text-white shadow-[0_4px_0_0_var(--foreground)] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
            >
              {loading ? "Finding your district…" : "Show my ballot ▶"}
            </button>
            {error && (
              <p role="alert" className="rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={useMyLocation}
              disabled={loading}
              className="rounded-2xl border-2 border-foreground px-4 py-3 font-bold disabled:opacity-40"
            >
              📍 Use my location
            </button>
            <button
              type="button"
              onClick={() => setAddress(VENUE_ADDRESS)}
              className="self-start rounded-full border border-foreground/30 px-3 py-1.5 text-sm"
            >
              Try: 2750 NW 3rd Ave — we&apos;re here
            </button>
            <p className="text-sm text-foreground/70">
              🔒 We never store your address or location.
            </p>
          </form>

          <ul className="mt-auto flex flex-col gap-2">
            {THEMES.map((t) => (
              <li
                key={t.label}
                className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm font-semibold"
              >
                <span className={`h-3 w-3 rounded-full ${t.color}`} />
                <span>
                  {t.emoji} {t.label}
                </span>
              </li>
            ))}
          </ul>
        </main>
      ) : result && step === 1 ? (
        <BallotStep result={result} onNext={next} onSkipToPolling={() => setStep(4)} />
      ) : result && step === 4 ? (
        <PollingStep result={result} />
      ) : (
        <main className="flex flex-1 flex-col gap-6">
          <section className="rounded-3xl bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">
              Not built yet
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              {COMING[step].title}
            </h2>
            <p className="mt-3 text-foreground/80">{COMING[step].body}</p>
          </section>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={next}
              className="rounded-2xl bg-foreground px-4 py-4 text-lg font-bold text-background"
            >
              Next: {STEPS[step + 1]} ▶
            </button>
          )}
        </main>
      )}

      <footer className="text-center text-xs text-foreground/60">
        We describe. We never recommend. · Open source, MIT · Hack for Humanity:
        Miami 2026
      </footer>
    </div>
  );
}
