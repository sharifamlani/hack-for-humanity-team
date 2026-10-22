"use client";

import { useEffect, useRef, useState } from "react";
import { Flower } from "@/components/Shapes";
import { LiveVoice, type VoiceState } from "@/lib/liveVoice";

// The open mode: instead of set questions, the person talks about whatever they care
// about. What they said is then matched against the candidates' published words.

const SYSTEM = `You are the voice of Your Ballot, Your Block, a friendly and strictly neutral civic interviewer talking with an 18 to 25 year old in Miami. Sound warm and relaxed and keep everything short.
Rules:
- Messages in [brackets] are instructions from the app, not from the person. Never read them aloud.
- Ask what they care about, then listen. You may ask ONE short follow-up to understand why it matters to them.
- Once they have told you, call record_answer with stance "unsure". This only marks that you have heard them; it is not a judgement.
- After record_answer returns, say what it tells you to say, in one sentence.
- Never give your own opinion, never argue, never mention political parties, never name or recommend a candidate, and never state statistics.`;

const STATUS: Record<VoiceState, string> = {
  connecting: "Connecting…",
  speaking: "AI speaking",
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
        if (s === "listening" || s === "thinking") newAiTurn.current = true;
        // The goodbye line has finished playing: hand over what we heard.
        if (s === "ended" && finished.current) onDone(heard.current);
      },
      // The words of a new turn often arrive before its first audio, so the line restarts on
      // the first words, not on the audio (which used to wipe the start of the sentence).
      onAiText: (delta) => {
        if (newAiTurn.current) {
          newAiTurn.current = false;
          setAiLine(delta);
        } else setAiLine((t) => t + delta);
      },
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

  const tone = state === "listening" ? "text-accent" : state === "thinking" || state === "connecting" ? "text-sky" : "text-sun";
  return (
    <main className="flex flex-1 flex-col items-center gap-4 text-center">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={onBack} className="font-bold hover:text-accent">
          ← Back
        </button>
        <span className="eyebrow text-foreground/60">What you care about</span>
        <span className="w-12" />
      </div>
      <h1 className="display border-b border-foreground/25 pb-3 text-3xl lg:text-4xl">Let&apos;s talk about what matters.</h1>
      <p className="display min-h-20 max-w-xl text-2xl lg:text-3xl">
        {aiLine || "What's one thing about life in Miami that you care about, or are curious about?"}
      </p>

      <div className="relative my-2 flex h-48 w-48 items-center justify-center">
        {(state === "speaking" || state === "listening") && (
          <span className={`absolute inset-6 animate-ping rounded-full opacity-25 ${state === "listening" ? "bg-accent" : "bg-sun"}`} />
        )}
        <button
          ref={orb}
          type="button"
          onClick={() => voice.current?.endTurn()}
          aria-label={state === "listening" ? "I'm done talking" : "Voice assistant"}
          className={`relative h-44 w-44 transition-transform duration-100 ${tone} ${
            state === "thinking" || state === "connecting" ? "animate-pulse" : ""
          }`}
        >
          <Flower className="h-full w-full" />
        </button>
      </div>
      <div>
        <p className={`font-bold ${tone}`}>{STATUS[state]}</p>
        {state === "speaking" && <p className="text-sm text-foreground/60">Your microphone is paused while the guide speaks.</p>}
      </div>
      {note && <p className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-semibold text-coral">{note}</p>}

      {myLine && (
        <div className="card flex w-full max-w-2xl items-center gap-4 px-5 py-3 text-left">
          <span className="eyebrow shrink-0 text-foreground/60">You said</span>
          <span className="border-l border-foreground/25 pl-4">“{myLine.trim()}”</span>
        </div>
      )}

      <form
        className="mt-auto flex w-full max-w-2xl flex-col items-center gap-3 border-t border-foreground/20 pt-4"
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
          className="w-full rounded-xl border border-foreground/30 bg-card px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/25"
        />
        <button
          type="submit"
          disabled={(draft.trim() || myLine.trim()).length < 8}
          className="btn-primary w-full max-w-sm text-lg"
        >
          See what candidates have said →
        </button>
        <p className="text-center text-xs text-foreground/60">
          🗣 Voice: Gemini Live · Gemma 4 reads the candidates&apos; own pages for you
        </p>
      </form>
    </main>
  );
}
