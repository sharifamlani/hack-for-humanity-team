"use client";

import { useEffect, useRef, useState } from "react";
import { LiveVoice, type VoiceState } from "@/lib/liveVoice";

// The open mode: instead of set questions, the person talks about whatever they care
// about. What they said is then matched against the candidates' published words.

const SYSTEM = `You are the voice of 305 Votes, a friendly and strictly neutral civic interviewer talking with an 18 to 25 year old in Miami. Sound warm and relaxed and keep everything short.
Rules:
- Messages in [brackets] are instructions from the app, not from the person. Never read them aloud.
- Ask what they care about, then listen. You may ask ONE short follow-up to understand why it matters to them.
- Once they have told you, call record_answer with stance "unsure". This only marks that you have heard them; it is not a judgement.
- After record_answer returns, say what it tells you to say, in one sentence.
- Never give your own opinion, never argue, never mention political parties, never name or recommend a candidate, and never state statistics.`;

const STATUS: Record<VoiceState, string> = {
  connecting: "Connecting…",
  speaking: "Speaking…",
  listening: "Listening — talk, then tap me when you're done",
  thinking: "Thinking…",
  ended: "Got it",
  error: "Voice is off — type it below",
};

export function OpenTalk({ onDone, onBack }: { onDone: (said: string) => void; onBack: () => void }) {
  const [state, setState] = useState<VoiceState>("connecting");
  const [aiLine, setAiLine] = useState("");
  const [myLine, setMyLine] = useState("");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const voice = useRef<LiveVoice | null>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const heard = useRef("");
  const newAiTurn = useRef(true);
  const finished = useRef(false);

  useEffect(() => {
    const v = new LiveVoice(SYSTEM, {
      onState: (s) => {
        setState(s);
        if (s === "speaking" && newAiTurn.current) {
          newAiTurn.current = false;
          setAiLine("");
        }
        if (s === "listening" || s === "thinking") newAiTurn.current = true;
        // The goodbye line has finished playing: hand over what we heard.
        if (s === "ended" && finished.current) onDone(heard.current);
      },
      onAiText: (delta) => setAiLine((t) => t + delta),
      onUserText: (delta) => {
        heard.current += delta;
        setMyLine(heard.current);
      },
      onLevel: (level) => {
        if (orb.current) orb.current.style.transform = `scale(${1 + Math.min(level * 2.5, 0.25)})`;
      },
      onAnswer: () => {
        finished.current = true;
        v.finish();
        return {
          recorded: true,
          next: "Tell them you're pulling up what the candidates on their ballot have said about that.",
        };
      },
      onError: (message) => setNote(message),
    });
    voice.current = v;
    v.start(
      "Greet the person in one short sentence, then ask: what is one thing about life in Miami that you care about, or are curious about, going into this election?",
    ).catch((e) => {
      setState("error");
      setNote(e instanceof Error ? e.message : "Voice isn't available right now.");
    });
    return () => v.stop();
    // Runs once: the session is opened by the tap that mounted this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-xs font-black uppercase tracking-widest">
        <span>💬 What you care about</span>
        <button type="button" onClick={onBack} className="font-semibold normal-case tracking-normal underline">
          back
        </button>
      </div>

      <div className="relative my-4 flex h-44 w-44 items-center justify-center">
        {(state === "speaking" || state === "listening") && (
          <span
            className={`absolute inset-0 animate-ping rounded-full opacity-30 ${state === "listening" ? "bg-wildlife" : "bg-coral"}`}
          />
        )}
        <button
          ref={orb}
          type="button"
          onClick={() => voice.current?.endTurn()}
          aria-label={state === "listening" ? "I'm done talking" : "Voice assistant"}
          className={`relative h-40 w-40 rounded-full border-4 border-foreground text-5xl transition-transform duration-100 ${
            state === "listening" ? "bg-wildlife" : state === "thinking" || state === "connecting" ? "animate-pulse bg-jobs" : "bg-coral"
          }`}
        >
          {state === "listening" ? "👂" : state === "thinking" || state === "connecting" ? "💭" : "🗣️"}
        </button>
      </div>
      <p className="text-sm font-bold">{STATUS[state]}</p>
      {note && <p className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-semibold text-coral">{note}</p>}

      <div className="w-full rounded-3xl bg-card p-4">
        <p className="min-h-12">
          {aiLine || "What's one thing about life in Miami that you care about, or are curious about?"}
        </p>
        {myLine && <p className="mt-3 border-t border-foreground/10 pt-3 text-sm italic">You: “{myLine.trim()}”</p>}
      </div>

      <form
        className="mt-auto flex w-full flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const said = (draft.trim() || heard.current).trim();
          if (said.length < 8) return;
          voice.current?.stop();
          onDone(said);
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="…or type it here"
          aria-label="What you care about"
          rows={2}
          className="rounded-2xl border border-foreground/25 bg-card px-4 py-3 outline-none focus:ring-4 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={(draft.trim() || myLine.trim()).length < 8}
          className="rounded-2xl bg-accent px-4 py-4 text-lg font-bold text-background disabled:opacity-40"
        >
          See what candidates have said ▶
        </button>
        <p className="text-center text-xs text-foreground/60">
          🗣 Voice: Gemini Live · ⚡ Gemma 4 reads the candidates&apos; own pages for you
        </p>
      </form>
    </main>
  );
}
