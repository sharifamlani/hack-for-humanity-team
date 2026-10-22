"use client";

import { useEffect, useRef, useState } from "react";
import { Flower } from "@/components/Shapes";
import { LiveVoice, type VoiceState } from "@/lib/liveVoice";
import type { Answers, Stance } from "@/lib/match";
import { QUESTIONS, THEMES, type Question } from "@/lib/questions";

const SYSTEM = `You are the voice of Your Ballot, Your Block, a friendly and strictly neutral civic interviewer talking with an 18 to 25 year old in Miami. You ask about issues that touch life in Miami and South Florida, one at a time. Sound warm and relaxed, like a friend who follows the news, and keep everything short.
Rules:
- Messages in [brackets] are instructions from the app, not from the person. Never read them aloud.
- When told to ask a question, ask it out loud in one or two natural sentences.
- When the person answers, call record_answer with their answer to the question as asked: "yes", "no", or "unsure".
- If they ask what you mean, explain in one neutral sentence without taking a side, then ask again. Do not call record_answer until they give an answer.
- After record_answer returns, say one short neutral acknowledgement (under 10 words), then ask the next question it gives you. If it says the interview is complete, say what it tells you to say.
- Always speak English. Switch languages only if the person clearly asks you to (for example "¿puedes hablar en español?"); background noise or a stray word is not a request.
- Never give your own opinion, never argue, never mention political parties, never name or recommend a candidate, and never state statistics.`;

const DONE_LINE =
  "The interview is complete. Tell them that is everything, and to tap See where I stand.";

const askLine = (q: Question) => `Question: ${q.question}`;

const LABEL: Record<Stance, string> = { yea: "Yes", nay: "No", unsure: "Not sure", skip: "Skipped" };

const STATUS: Record<VoiceState, string> = {
  connecting: "Connecting…",
  speaking: "AI speaking",
  listening: "Listening — talk, then tap me when you're done",
  thinking: "Thinking…",
  ended: "All done",
  error: "Voice is off — use the buttons",
};

export function VoiceInterview({
  answers,
  onAnswer,
  onDone,
  onOpen,
  onTypeInstead,
}: {
  answers: Answers;
  onAnswer: (id: string, stance: Stance, said?: string) => void;
  onDone: () => void;
  // The "I'll tell you what I care about" mode; when absent its button is hidden.
  onOpen?: () => void;
  onTypeInstead: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<VoiceState>("connecting");
  const [index, setIndex] = useState(0);
  const [aiLine, setAiLine] = useState("");
  const [myLine, setMyLine] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [checking, setChecking] = useState<Record<string, boolean>>({});
  const [micOff, setMicOff] = useState(false);

  const voice = useRef<LiveVoice | null>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(0);
  const heard = useRef("");
  const newAiTurn = useRef(true);
  // Set by a tap until it is the person's turn again: the model sometimes records an answer
  // of its own right after being told about the tap, which skipped a question.
  const tapPending = useRef(false);

  useEffect(() => () => voice.current?.stop(), []);

  const question = QUESTIONS[index] as Question | undefined;
  const recorded = Object.keys(answers).length;

  // Move to the next question and say what the voice should be told about it.
  function advance(): string {
    const next = QUESTIONS[indexRef.current + 1];
    indexRef.current += 1;
    setIndex(indexRef.current);
    heard.current = "";
    setMyLine("");
    // The last question's words leave with it; the new question shows until the voice speaks.
    setAiLine("");
    newAiTurn.current = true;
    if (!next) voice.current?.finish();
    return next ? askLine(next) : DONE_LINE;
  }

  // Gemma 4 is the reader of record: it re-reads what the person actually said and its
  // reading replaces the voice model's quick one.
  async function confirmWithGemma(id: string, said: string) {
    if (!said.trim()) return;
    setChecking((c) => ({ ...c, [id]: true }));
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, answer: said }),
      });
      const json = await res.json();
      if (res.ok && json.stance !== "unclear") {
        onAnswer(id, json.stance === "yes" ? "yea" : json.stance === "no" ? "nay" : "unsure", said);
      }
    } catch {
      // Keep the provisional reading.
    } finally {
      setChecking((c) => ({ ...c, [id]: false }));
    }
  }

  async function start() {
    setStarted(true);
    const v = new LiveVoice(SYSTEM, {
      onState: (s) => {
        setState(s);
        if (s === "listening" || s === "thinking") newAiTurn.current = true;
        if (s === "listening") tapPending.current = false;
      },
      // The words of a new turn often arrive before its first audio, so the line restarts on
      // the first words, not on the audio (which used to wipe the start of the question).
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
      onAnswer: (stance) => {
        const current = QUESTIONS[indexRef.current];
        if (!current) return { recorded: false, next: DONE_LINE };
        if (tapPending.current) {
          return {
            recorded: false,
            next: `The tap already recorded the previous answer; do not record or repeat anything. Ask exactly this next question now: ${current.question}`,
          };
        }
        const said = heard.current;
        onAnswer(current.id, stance === "yes" ? "yea" : stance === "no" ? "nay" : "unsure", said);
        confirmWithGemma(current.id, said);
        return { recorded: true, next: advance() };
      },
      onError: (message) => setNote(message),
    });
    voice.current = v;
    try {
      await v.start(
        `Greet the person in one short sentence, tell them you'll ask about ${QUESTIONS.length} things that matter in Miami and there are no wrong answers, then ask the first one. ${askLine(QUESTIONS[0])}`,
      );
      setMicOff(!v.micAvailable);
    } catch (e) {
      setState("error");
      setNote(e instanceof Error ? e.message : "Voice isn't available right now.");
    }
  }

  function tap(stance: Stance) {
    if (!question) return;
    tapPending.current = true;
    onAnswer(question.id, stance);
    const next = advance();
    voice.current?.instruct(
      `The person tapped "${LABEL[stance]}" on screen for the current question. Acknowledge in a few words, then continue. ${next}`,
    );
  }

  if (!started) {
    return (
      <main className="flex flex-1 flex-col items-center gap-6 text-center">
        <Flower className="h-24 w-24 text-sun" />
        <h1 className="display text-4xl lg:text-5xl">Let&apos;s talk about what matters.</h1>
        <p className="text-foreground/80">
          {onOpen ? "Two ways to do this. Both are out loud, like talking to a friend." : `${QUESTIONS.length} quick questions, out loud, like talking to a friend.`}
        </p>
        <button
          type="button"
          onClick={start}
          className="w-full max-w-md rounded-3xl bg-accent px-5 py-6 text-left text-background active:translate-y-1"
        >
          <span className="block text-2xl font-black">Ask me</span>
          <span className="block text-sm font-semibold opacity-90">
            {QUESTIONS.length} quick questions about Miami, then see who lines up with you
          </span>
        </button>
        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="w-full max-w-md rounded-3xl border border-foreground/25 bg-card px-5 py-6 text-left active:translate-y-1"
          >
            <span className="block text-2xl font-black">I&apos;ll tell you what I care about</span>
            <span className="block text-sm font-semibold text-foreground/70">
              Talk about anything, then see what the candidates have said about it
            </span>
          </button>
        )}
        <p className="text-sm text-foreground/60">Turn your sound on. We&apos;ll ask to use your mic.</p>
        <button type="button" onClick={onTypeInstead} className="text-sm font-semibold underline">
          I&apos;d rather type
        </button>
      </main>
    );
  }

  const done = !question;
  const tone = state === "listening" ? "text-accent" : state === "thinking" || state === "connecting" ? "text-sky" : "text-sun";
  return (
    <main className="flex flex-1 flex-col items-center gap-4 text-center">
      <p className="eyebrow text-foreground/60">
        {question ? THEMES[question.theme].label : "Interview"} ·{" "}
        {Math.min(index + 1, QUESTIONS.length)} of {QUESTIONS.length}
      </p>
      <h1 className="display border-b border-foreground/25 pb-3 text-3xl lg:text-4xl">Let&apos;s talk about what matters.</h1>
      {/* The voice's own words while it speaks. Once it stops, they stay only if they arrived
          whole, ending in a question mark (Gemini Live's transcript sometimes stops mid-sentence,
          and "Got it." alone is not a question); otherwise the written
          question takes their place, so the person always answers a complete question. */}
      <p className="display min-h-20 max-w-xl text-2xl lg:text-3xl">
        {(state === "speaking" || /\?\s*$/.test(aiLine) ? aiLine : "") ||
          (question ? question.question : "That's everything. Let's see where you stand.")}
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
        <p className={`font-bold ${tone}`}>{micOff && state === "listening" ? "Mic is off — tap your answer below" : STATUS[state]}</p>
        {state === "speaking" && <p className="text-sm text-foreground/60">Your microphone is paused while the guide speaks.</p>}
      </div>
      {note && <p className="rounded-xl bg-coral/15 px-3 py-2 text-sm font-semibold text-coral">{note}</p>}

      <div className="flex gap-8 text-xs font-semibold">
        <button type="button" onClick={() => voice.current?.endTurn()} className="flex flex-col items-center gap-1.5">
          <span className={`flex h-14 w-14 items-center justify-center rounded-full border text-xl ${state === "listening" ? "border-accent bg-accent/15" : "border-foreground/40"}`}>
            🎙
          </span>
          {state === "listening" ? "Done talking" : "Mic paused"}
        </button>
        <button type="button" onClick={onTypeInstead} className="flex flex-col items-center gap-1.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-foreground/40 text-xl">⌨</span>
          Type instead
        </button>
      </div>

      {myLine && (
        <div className="card flex w-full max-w-2xl items-center gap-4 px-5 py-3 text-left">
          <span className="eyebrow shrink-0 text-foreground/60">You said</span>
          <span className="border-l border-foreground/25 pl-4">“{myLine.trim()}”</span>
        </div>
      )}

      {recorded > 0 && (
        <ul className="flex w-full flex-wrap items-center justify-center gap-2 text-xs font-bold">
          <li className="font-normal text-foreground/60">Notes so far:</li>
          {QUESTIONS.filter((q) => answers[q.id]).map((q) => (
            <li key={q.id} className="rounded-full border border-foreground/20 bg-card px-3 py-1">
              {q.short}: {LABEL[answers[q.id]]}
              <span className="ml-1 font-normal text-foreground/50">
                {checking[q.id] ? "· Gemma 4 checking…" : "✓"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex w-full flex-col items-center gap-3 border-t border-foreground/20 pt-4">
        {!done && (
          <div className="grid w-full max-w-md grid-cols-4 gap-2 text-sm font-bold">
            <button type="button" onClick={() => tap("yea")} className="rounded-full border border-foreground/30 bg-card py-2.5 hover:border-accent">
              👍 Yes
            </button>
            <button type="button" onClick={() => tap("nay")} className="rounded-full border border-foreground/30 bg-card py-2.5 hover:border-accent">
              👎 No
            </button>
            <button type="button" onClick={() => tap("unsure")} className="rounded-full border border-foreground/20 py-2.5 hover:border-accent">
              Not sure
            </button>
            <button type="button" onClick={() => tap("skip")} className="rounded-full border border-foreground/20 py-2.5 hover:border-accent">
              Skip
            </button>
          </div>
        )}
        {(done || recorded >= 2) && (
          <button
            type="button"
            onClick={() => {
              voice.current?.stop();
              onDone();
            }}
            className={done ? "btn-primary w-full max-w-sm text-lg" : "btn-ghost w-full max-w-sm"}
          >
            See where I stand →
          </button>
        )}
        <p className="text-center text-xs text-foreground/60">
          🗣 Voice: Gemini Live · Gemma 4 reads what you said and records your answer · {recorded} recorded
        </p>
      </div>
    </main>
  );
}
