// Browser-side live voice session (Gemini Live API over a WebSocket).
//
// This is the VOICE only: it speaks the questions and hears the answers. What a person's
// answer means for the score is decided by Gemma 4 (see /api/interview) and the scale is
// a plain comparison (lib/match.ts).
//
// Turn-taking is half-duplex on purpose: the mic only streams while the app is
// "listening", so the AI never hears itself through the speakers in a loud room.

const WS_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
export const VOICE_MODEL = "gemini-3.8-live";

const SPEECH_LEVEL = 0.02; // mic loudness that counts as someone talking
const QUIET_MS = 1500; // this much quiet after speech ends the person's turn
const MAX_TURN_MS = 25000;

export type VoiceState = "connecting" | "speaking" | "listening" | "thinking" | "ended" | "error";

export type VoiceHandlers = {
  onState: (state: VoiceState) => void;
  onAiText: (delta: string) => void;
  onUserText: (delta: string) => void;
  onLevel: (level: number) => void;
  // The voice model heard an answer. Return what it should be told next.
  onAnswer: (stance: string) => Record<string, unknown>;
  onError: (message: string) => void;
};

type ServerMessage = {
  setupComplete?: unknown;
  toolCall?: { functionCalls: { id: string; name: string; args: { stance?: string } }[] };
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { data: string } }[] };
    outputTranscription?: { text?: string };
    inputTranscription?: { text?: string };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
};

export class LiveVoice {
  micAvailable = false;
  private ws: WebSocket | null = null;
  private micCtx: AudioContext | null = null;
  private outCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private nextPlayTime = 0;
  private listening = false;
  private heardSpeech = false;
  private lastLoud = 0;
  private listenStarted = 0;
  private turnHadAudio = false;
  private awaitingFollowUp = false;
  private listenTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private finished = false;

  constructor(
    private systemInstruction: string,
    private handlers: VoiceHandlers,
  ) {}

  // Must be called from a tap: browsers only allow audio and the mic after a user gesture.
  async start(firstInstruction: string) {
    this.handlers.onState("connecting");
    this.outCtx = new AudioContext();
    await this.outCtx.resume();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      this.startMic(this.stream);
      this.micAvailable = true;
    } catch {
      // No mic: the AI still speaks, and the person answers with the buttons.
      this.micAvailable = false;
    }

    const tokenRes = await fetch("/api/voice-token", { method: "POST" });
    const { token, error } = await tokenRes.json();
    if (!tokenRes.ok || !token) throw new Error(error ?? "Voice isn't available right now.");

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${WS_URL}?access_token=${token}`);
      this.ws = ws;
      ws.onopen = () =>
        ws.send(
          JSON.stringify({
            setup: {
              model: `models/${VOICE_MODEL}`,
              generationConfig: { responseModalities: ["AUDIO"] },
              systemInstruction: { parts: [{ text: this.systemInstruction }] },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              // The app decides when the person's turn starts and ends.
              realtimeInputConfig: { automaticActivityDetection: { disabled: true } },
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: "record_answer",
                      description: "Record the person's answer on the current question.",
                      parameters: {
                        type: "OBJECT",
                        properties: { stance: { type: "STRING", enum: ["yes", "no", "unsure"] } },
                        required: ["stance"],
                      },
                    },
                  ],
                },
              ],
            },
          }),
        );
      ws.onmessage = async (ev) => {
        const text = typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text();
        const msg = JSON.parse(text) as ServerMessage;
        if (msg.setupComplete) {
          resolve();
          this.instruct(firstInstruction);
          return;
        }
        this.handle(msg);
      };
      ws.onerror = () => reject(new Error("Couldn't connect the voice line."));
      ws.onclose = () => {
        if (this.closed) return;
        this.closed = true;
        this.handlers.onState(this.finished ? "ended" : "error");
        if (!this.finished) this.handlers.onError("The voice line dropped. Use the buttons below.");
      };
    });
  }

  // Send an app instruction (never spoken aloud by the model). Also used for button taps.
  instruct(text: string) {
    this.cancelListening();
    this.stopPlayback();
    this.awaitingFollowUp = false;
    this.send({ clientContent: { turns: [{ role: "user", parts: [{ text: `[${text}]` }] }], turnComplete: true } });
    this.handlers.onState("thinking");
  }

  // The person tapped "I'm done talking".
  endTurn() {
    if (!this.listening) return;
    this.listening = false;
    this.send({ realtimeInput: { activityEnd: {} } });
    this.handlers.onState("thinking");
  }

  // After the last question: let the model say goodbye, then stop listening for good.
  finish() {
    this.finished = true;
  }

  stop() {
    this.closed = true;
    this.listening = false;
    if (this.listenTimer) clearTimeout(this.listenTimer);
    this.stopPlayback();
    this.ws?.close();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.micCtx?.close().catch(() => {});
    this.outCtx?.close().catch(() => {});
  }

  private send(message: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
  }

  private handle(msg: ServerMessage) {
    if (msg.toolCall) {
      for (const call of msg.toolCall.functionCalls) {
        const response = this.handlers.onAnswer(call.args?.stance ?? "unsure");
        this.send({ toolResponse: { functionResponses: [{ id: call.id, name: call.name, response }] } });
      }
      // The model speaks again once it has the tool result; don't open the mic before that.
      this.awaitingFollowUp = true;
      this.handlers.onState("thinking");
      return;
    }

    const content = msg.serverContent;
    if (!content) return;
    if (content.interrupted) this.stopPlayback();
    if (content.outputTranscription?.text) this.handlers.onAiText(content.outputTranscription.text);
    if (content.inputTranscription?.text) this.handlers.onUserText(content.inputTranscription.text);

    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) {
        this.turnHadAudio = true;
        this.awaitingFollowUp = false;
        this.play(part.inlineData.data);
        this.handlers.onState("speaking");
      }
    }

    if (content.turnComplete) {
      const spoke = this.turnHadAudio;
      this.turnHadAudio = false;
      if (!spoke && this.awaitingFollowUp) return; // the silent turn that carried the tool call
      // Open the mic once the last of the AI's audio has actually finished playing.
      const remaining = this.outCtx ? Math.max(0, this.nextPlayTime - this.outCtx.currentTime) : 0;
      if (this.listenTimer) clearTimeout(this.listenTimer);
      this.listenTimer = setTimeout(() => this.beginListening(), remaining * 1000 + 250);
    }
  }

  private beginListening() {
    if (this.closed) return;
    if (this.finished) {
      this.handlers.onState("ended");
      return;
    }
    if (!this.micAvailable) {
      this.handlers.onState("listening");
      return;
    }
    this.heardSpeech = false;
    this.listenStarted = Date.now();
    this.lastLoud = Date.now();
    this.listening = true;
    this.send({ realtimeInput: { activityStart: {} } });
    this.handlers.onState("listening");
  }

  private cancelListening() {
    if (this.listenTimer) clearTimeout(this.listenTimer);
    if (!this.listening) return;
    this.listening = false;
    this.send({ realtimeInput: { activityEnd: {} } });
  }

  private startMic(stream: MediaStream) {
    this.micCtx = new AudioContext({ sampleRate: 16000 });
    const source = this.micCtx.createMediaStreamSource(stream);
    const processor = this.micCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!this.listening) return;
      const samples = e.inputBuffer.getChannelData(0);
      const pcm = new Int16Array(samples.length);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        pcm[i] = s * 32767;
        sum += s * s;
      }
      const level = Math.sqrt(sum / samples.length);
      this.handlers.onLevel(level);

      const bytes = new Uint8Array(pcm.buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      this.send({ realtimeInput: { audio: { data: btoa(binary), mimeType: "audio/pcm;rate=16000" } } });

      const now = Date.now();
      if (level > SPEECH_LEVEL) {
        this.heardSpeech = true;
        this.lastLoud = now;
      }
      const wentQuiet = this.heardSpeech && now - this.lastLoud > QUIET_MS;
      if (wentQuiet || now - this.listenStarted > MAX_TURN_MS) this.endTurn();
    };
    source.connect(processor);
    processor.connect(this.micCtx.destination);
  }

  private play(base64: string) {
    const ctx = this.outCtx;
    if (!ctx) return;
    const binary = atob(base64);
    const samples = new Float32Array(binary.length / 2);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      let v = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
      if (v >= 32768) v -= 65536;
      samples[i] = v / 32768;
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    this.handlers.onLevel(peak * 0.5);
    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const node = ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(ctx.destination);
    this.nextPlayTime = Math.max(this.nextPlayTime, ctx.currentTime + 0.05);
    node.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
    this.sources.add(node);
    node.onended = () => this.sources.delete(node);
  }

  private stopPlayback() {
    for (const node of this.sources) {
      try {
        node.stop();
      } catch {}
    }
    this.sources.clear();
    this.nextPlayTime = 0;
  }
}
