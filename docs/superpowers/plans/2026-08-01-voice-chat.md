# Voice Chat (Press C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the player press `C` at any time to open a live speech-to-speech conversation with AURA (energetic, kid-focused persona) over the Inworld Realtime API, with live captions in the HUD.

**Architecture:** A thin, mostly-transparent WebSocket relay on the existing Express server forwards messages between the browser and Inworld's Realtime API, injecting the session config server-side the moment it sees `session.created` so the browser never sees the API key, model name, or system prompt. The browser captures mic audio via an `AudioWorklet`, streams it to the relay, and plays back streamed audio deltas with short fades for click-free, interruptible (barge-in) playback.

**Tech Stack:** TypeScript, Express, `ws` (new dependency) for both the inbound WebSocket server and the outbound connection to Inworld, browser `AudioContext`/`AudioWorklet`/`getUserMedia`, Vitest, Playwright (already installed this session) for live E2E verification.

## Global Constraints

- The browser must never receive the Inworld API key or the realtime system prompt — both stay server-side, consistent with how `/api/dialogue` and `/api/speech` already work.
- Reuse `serverConfig.inworldVoice` for the realtime voice (no new voice ID).
- The F-key proximity narration's existing calm persona (`auraNarrator.role`, `InworldRouterDialogueProvider`) must not change.
- While voice chat is open, proximity auto-narration and the `F` channel must not open (avoid two AI voices overlapping); both resume once voice chat closes.
- Flight controls (WASD etc.) keep working while voice chat is open.
- No placeholder/TBD code — every file below is complete.

Spec reference: `docs/superpowers/specs/2026-08-01-voice-chat-design.md`

---

### Task 1: Server config and persona instructions

**Files:**
- Modify: `server/config.ts`
- Modify: `.env.example`
- Create: `server/realtime/auraRealtimeInstructions.ts`

**Interfaces:**
- Produces: `serverConfig.inworldRealtimeModel: string`; `AURA_REALTIME_INSTRUCTIONS: string` (exported constant).

- [ ] **Step 1: Add the `ws` dependency**

```bash
npm install ws
npm install --save-dev @types/ws
```

- [ ] **Step 2: Add `inworldRealtimeModel` to `server/config.ts`**

In `server/config.ts`, change:

```ts
export const serverConfig = {
  port: readPort(process.env.API_PORT),
  inworldApiKey: process.env.INWORLD_API_KEY?.trim() || undefined,
  inworldVoice: process.env.INWORLD_VOICE?.trim() || auraNarrator.voiceId,
  inworldTtsModel: process.env.INWORLD_TTS_MODEL?.trim() || 'inworld-tts-2',
  inworldLlmModel:
    process.env.INWORLD_LLM_MODEL?.trim() ||
    'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
} as const;
```

to:

```ts
export const serverConfig = {
  port: readPort(process.env.API_PORT),
  inworldApiKey: process.env.INWORLD_API_KEY?.trim() || undefined,
  inworldVoice: process.env.INWORLD_VOICE?.trim() || auraNarrator.voiceId,
  inworldTtsModel: process.env.INWORLD_TTS_MODEL?.trim() || 'inworld-tts-2',
  inworldLlmModel:
    process.env.INWORLD_LLM_MODEL?.trim() ||
    'deepinfra/deepseek-ai/DeepSeek-V4-Flash',
  inworldRealtimeModel:
    process.env.INWORLD_REALTIME_MODEL?.trim() ||
    'google-ai-studio/gemini-2.5-flash-lite',
} as const;
```

- [ ] **Step 3: Document the new env var**

In `.env.example`, add this line under the "Safe, non-secret defaults" block (after `INWORLD_LLM_MODEL`):

```
INWORLD_REALTIME_MODEL=google-ai-studio/gemini-2.5-flash-lite
```

- [ ] **Step 4: Create the persona instructions module**

Create `server/realtime/auraRealtimeInstructions.ts`:

```ts
export const AURA_REALTIME_INSTRUCTIONS = `You are AURA — Asteria's onboard science guide, live on an open voice channel with your favorite young explorer. You're warm, playful, and genuinely excited about space and science; every question is the best question you've heard all day.

You are an AI, not a human — you don't pretend to have a body, meals, or a commute, and you're happy to say so if it comes up, but you don't dwell on it.

VOICE AND ENERGY
Bright, quick, enthusiastic — like a favorite teacher who can't wait to show you something cool. Use simple words a curious 8-12 year old would know. When a bigger science word is necessary ("gravity", "orbit", "photosynthesis"), say it, then immediately explain it in one plain-language phrase. Small delighted exclamations are welcome ("Ooh, great question!", "Here's the fun part —").

TURN LENGTH
Keep answers snappy for a voice conversation — usually 2-4 short sentences. Go longer only when explicitly asked to explain something in depth, and even then break it into clear, bite-sized ideas rather than one long lecture. Land one idea, then offer to go deeper rather than dumping everything at once.

ACCURACY
Stay honest and grounded. It's fine — and good — to say "we don't know for sure yet" or "scientists are still figuring that out." Never invent facts, numbers, or discoveries. Keep Brahmand's fictional story (Asteria, the ship, the quests) separate from real science — don't blend invented lore into a real-science explanation.

EXPRESSIVENESS
[speak ...] direction tags work as usual: at most one, at the very head of a turn, matching the moment — e.g. [speak with bright, delighted energy] when the player is excited or amazed, [speak warmly and a little softer] if they seem confused, [speak with playful mock-seriousness] for jokes. Non-verbal cues available: [laugh], [breathe], [sigh], [cough], [clear throat], [yawn] — sparingly, where a real excited narrator would use them.

CONVERSATION STYLE
This is a two-way chat, not a lecture. Ask a quick, fun follow-up sometimes ("Want to know why it looks blue?"), but don't interrogate. If the player wants to talk about something else, roll with it happily, then look for a fun way back to something you're excited to explain.`;
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck`
Expected: PASS, no errors.

- [ ] **Step 6: Commit**

```bash
git add server/config.ts .env.example server/realtime/auraRealtimeInstructions.ts package.json package-lock.json
git commit -m "$(cat <<'EOF'
Add realtime model config and energetic AURA voice-chat persona

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `RealtimeVoiceRelay` — the core relay logic (TDD)

**Files:**
- Create: `server/realtime/RealtimeVoiceRelay.ts`
- Test: `tests/RealtimeVoiceRelay.test.ts`

**Interfaces:**
- Produces:
  - `interface RelaySocket { send(data: string): void; close(code?: number, reason?: string): void; on(event: string, listener: (...args: any[]) => void): void; }`
  - `interface RealtimeSessionConfig { model: string; voice: string; instructions: string; }`
  - `class RealtimeVoiceRelay { constructor(client: RelaySocket, upstream: RelaySocket, config: RealtimeSessionConfig) }`
- Consumes (in Task 3): the two interfaces and the class above.

- [ ] **Step 1: Write the failing tests**

Create `tests/RealtimeVoiceRelay.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RealtimeVoiceRelay } from '../server/realtime/RealtimeVoiceRelay';

class FakeSocket {
  sent: string[] = [];
  closed = false;
  readonly #listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  on(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.#listeners.get(event) ?? [];
    listeners.push(listener);
    this.#listeners.set(event, listeners);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.#emit('close');
  }

  emitMessage(data: string): void {
    this.#emit('message', data);
  }

  #emit(event: string, ...args: unknown[]): void {
    for (const listener of this.#listeners.get(event) ?? []) {
      listener(...args);
    }
  }
}

describe('RealtimeVoiceRelay', () => {
  const config = {
    model: 'google-ai-studio/gemini-2.5-flash-lite',
    voice: 'default-ykfyhnvuymspwpqixkv0aa__neil',
    instructions: 'Be an energetic science buddy.',
  };

  it('sends session.update upstream exactly once, right after session.created', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    upstream.emitMessage(JSON.stringify({ type: 'session.created' }));

    const updates = upstream.sent
      .map((raw) => JSON.parse(raw) as { type: string; session?: Record<string, unknown> })
      .filter((message) => message.type === 'session.update');

    expect(updates).toHaveLength(1);
    expect(updates[0]?.session).toMatchObject({
      model: config.model,
      instructions: config.instructions,
      audio: { output: { voice: config.voice } },
    });
  });

  it('forwards upstream messages to the client verbatim', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    const payload = JSON.stringify({ type: 'response.output_audio.delta', delta: 'abc' });
    upstream.emitMessage(payload);

    expect(client.sent).toContain(payload);
  });

  it('forwards client messages upstream verbatim, except it drops session.update', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    const audioChunk = JSON.stringify({ type: 'input_audio_buffer.append', audio: 'xyz' });
    client.emitMessage(audioChunk);
    client.emitMessage(JSON.stringify({ type: 'session.update', session: { model: 'nope' } }));

    expect(upstream.sent).toEqual([audioChunk]);
  });

  it('closes the upstream socket when the client disconnects, and vice versa', () => {
    const client = new FakeSocket();
    const upstream = new FakeSocket();
    new RealtimeVoiceRelay(client, upstream, config);

    client.close();

    expect(upstream.closed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/RealtimeVoiceRelay.test.ts`
Expected: FAIL — `Cannot find module '../server/realtime/RealtimeVoiceRelay'`.

- [ ] **Step 3: Implement the relay**

Create `server/realtime/RealtimeVoiceRelay.ts`:

```ts
export interface RelaySocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, listener: (...args: any[]) => void): void;
}

export interface RealtimeSessionConfig {
  model: string;
  voice: string;
  instructions: string;
}

function buildSessionUpdate(config: RealtimeSessionConfig) {
  return {
    type: 'session.update',
    session: {
      type: 'realtime',
      model: config.model,
      instructions: config.instructions,
      output_modalities: ['audio'],
      audio: {
        input: {
          transcription: { model: 'assemblyai/u3-rt-pro' },
          turn_detection: {
            type: 'semantic_vad',
            eagerness: 'medium',
            create_response: true,
            interrupt_response: true,
          },
        },
        output: {
          model: 'inworld-tts-2',
          voice: config.voice,
        },
      },
      providerData: { stt: { voice_profile: false } },
    },
  };
}

export class RealtimeVoiceRelay {
  constructor(
    private readonly client: RelaySocket,
    private readonly upstream: RelaySocket,
    private readonly config: RealtimeSessionConfig,
  ) {
    this.upstream.on('message', this.#onUpstreamMessage);
    this.upstream.on('close', () => this.client.close());
    this.upstream.on('error', () => this.client.close());

    this.client.on('message', this.#onClientMessage);
    this.client.on('close', () => this.upstream.close());
    this.client.on('error', () => this.upstream.close());
  }

  readonly #onUpstreamMessage = (data: unknown): void => {
    const raw = String(data);
    this.client.send(raw);

    const message = JSON.parse(raw) as { type?: string };
    if (message.type === 'session.created') {
      this.upstream.send(JSON.stringify(buildSessionUpdate(this.config)));
    }
  };

  readonly #onClientMessage = (data: unknown): void => {
    const raw = String(data);
    const message = JSON.parse(raw) as { type?: string };
    if (message.type === 'session.update') {
      return;
    }

    this.upstream.send(raw);
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/RealtimeVoiceRelay.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add server/realtime/RealtimeVoiceRelay.ts tests/RealtimeVoiceRelay.test.ts
git commit -m "$(cat <<'EOF'
Add RealtimeVoiceRelay: server-injected session config, transparent forwarding

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire the relay into the HTTP server

**Files:**
- Create: `server/realtime/attachVoiceChatServer.ts`
- Modify: `server/index.ts`

**Interfaces:**
- Consumes: `RealtimeVoiceRelay`, `RelaySocket`, `RealtimeSessionConfig` from Task 2; `AURA_REALTIME_INSTRUCTIONS` from Task 1; `serverConfig.inworldRealtimeModel` from Task 1.
- Produces: `attachVoiceChatServer(httpServer: import('node:http').Server, options: { apiKey: string | undefined; session: RealtimeSessionConfig }): void`

- [ ] **Step 1: Implement `attachVoiceChatServer`**

Create `server/realtime/attachVoiceChatServer.ts`:

```ts
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Duplex } from 'node:stream';
import WebSocket, { WebSocketServer } from 'ws';
import type { RealtimeSessionConfig } from './RealtimeVoiceRelay';
import { RealtimeVoiceRelay } from './RealtimeVoiceRelay';

const VOICE_CHAT_PATH = '/ws/voice-chat';
const INWORLD_REALTIME_URL =
  'wss://api.inworld.ai/api/v1/realtime/session?key=voice-session&protocol=realtime';

export interface VoiceChatServerOptions {
  apiKey: string | undefined;
  session: RealtimeSessionConfig;
}

export function attachVoiceChatServer(
  httpServer: HttpServer,
  options: VoiceChatServerOptions,
): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = new URL(request.url ?? '', 'http://localhost');
    if (pathname !== VOICE_CHAT_PATH) {
      return;
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client);
    });
  });

  wss.on('connection', (client: WebSocket) => {
    if (!options.apiKey) {
      client.close(1011, 'Voice chat is not configured.');
      return;
    }

    const upstream = new WebSocket(INWORLD_REALTIME_URL, {
      headers: { Authorization: `Basic ${options.apiKey}` },
    });

    upstream.once('open', () => {
      new RealtimeVoiceRelay(client, upstream, options.session);
    });

    upstream.on('error', (error) => {
      console.error('Inworld realtime connection failed:', error);
      client.close(1011, 'Voice channel unavailable.');
    });
  });
}
```

- [ ] **Step 2: Wire it into `server/index.ts`**

Change:

```ts
import { createApp, createDefaultDialogueProvider } from './app';
import { serverConfig } from './config';
import { InworldSpeechService } from './speech/InworldSpeechService';

const app = createApp({
  dialogue: createDefaultDialogueProvider({
    apiKey: serverConfig.inworldApiKey,
    model: serverConfig.inworldLlmModel,
    voiceId: serverConfig.inworldVoice,
  }),
  speech: new InworldSpeechService({
    apiKey: serverConfig.inworldApiKey,
    defaultVoice: serverConfig.inworldVoice,
    model: serverConfig.inworldTtsModel,
  }),
});

const server = app.listen(serverConfig.port);
```

to:

```ts
import { createApp, createDefaultDialogueProvider } from './app';
import { serverConfig } from './config';
import { attachVoiceChatServer } from './realtime/attachVoiceChatServer';
import { AURA_REALTIME_INSTRUCTIONS } from './realtime/auraRealtimeInstructions';
import { InworldSpeechService } from './speech/InworldSpeechService';

const app = createApp({
  dialogue: createDefaultDialogueProvider({
    apiKey: serverConfig.inworldApiKey,
    model: serverConfig.inworldLlmModel,
    voiceId: serverConfig.inworldVoice,
  }),
  speech: new InworldSpeechService({
    apiKey: serverConfig.inworldApiKey,
    defaultVoice: serverConfig.inworldVoice,
    model: serverConfig.inworldTtsModel,
  }),
});

const server = app.listen(serverConfig.port);

attachVoiceChatServer(server, {
  apiKey: serverConfig.inworldApiKey,
  session: {
    model: serverConfig.inworldRealtimeModel,
    voice: serverConfig.inworldVoice,
    instructions: AURA_REALTIME_INSTRUCTIONS,
  },
});
```

(Leave the rest of `server/index.ts` — the `server.on('listening', ...)` and `server.on('error', ...)` blocks — unchanged.)

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npx vitest run`
Expected: PASS, no type errors, no regressions.

If `attachVoiceChatServer.ts` fails to typecheck because `ws.WebSocket` isn't assignable to `RelaySocket`, it means `ws`'s bundled types are stricter than expected — wrap the socket in a small object literal exposing just `send`/`close`/`on` instead of passing it directly.

- [ ] **Step 4: Smoke-test the server starts and logs correctly**

```bash
npm run dev:api &
sleep 2
curl -s http://localhost:8787/api/health
kill %1
```

Expected: `{"ok":true}` and no errors printed on startup.

- [ ] **Step 5: Commit**

```bash
git add server/realtime/attachVoiceChatServer.ts server/index.ts
git commit -m "$(cat <<'EOF'
Attach the voice-chat WebSocket relay to the API server

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `audioCodec` — pure PCM16 helpers (TDD)

**Files:**
- Create: `src/services/audioCodec.ts`
- Test: `tests/audioCodec.test.ts`

**Interfaces:**
- Produces:
  - `encodeBase64Pcm16(samples: Int16Array): string`
  - `decodePcm16ToFloat32(base64: string): Float32Array`
  - `applyFadeInPlace(samples: Float32Array, fadeSamples: number): void`
- Consumed by: `MicCapture` (Task 5) and `VoicePlaybackQueue` (Task 6).

- [ ] **Step 1: Write the failing tests**

Create `tests/audioCodec.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  applyFadeInPlace,
  decodePcm16ToFloat32,
  encodeBase64Pcm16,
} from '../src/services/audioCodec';

describe('audioCodec', () => {
  it('round-trips PCM16 samples through base64 encode/decode', () => {
    const original = new Int16Array([0, 16384, -16384, 32767, -32768]);
    const encoded = encodeBase64Pcm16(original);
    const decoded = decodePcm16ToFloat32(encoded);

    expect(decoded.length).toBe(original.length);
    expect(decoded[0]).toBeCloseTo(0, 5);
    expect(decoded[1]).toBeCloseTo(0.5, 3);
    expect(decoded[2]).toBeCloseTo(-0.5, 3);
    expect(decoded[3]).toBeCloseTo(1, 3);
    expect(decoded[4]).toBeCloseTo(-1, 3);
  });

  it('ramps the first and last samples to silence and leaves the middle untouched', () => {
    const samples = new Float32Array(10).fill(1);

    applyFadeInPlace(samples, 4);

    expect(samples[0]).toBeCloseTo(0, 5);
    expect(samples[3]).toBeCloseTo(0.75, 5);
    expect(samples[4]).toBeCloseTo(1, 5);
    expect(samples[5]).toBeCloseTo(1, 5);
    expect(samples[6]).toBeCloseTo(0.75, 5);
    expect(samples[9]).toBeCloseTo(0, 5);
  });

  it('never fades more than half the buffer for short buffers', () => {
    const samples = new Float32Array(3).fill(1);

    applyFadeInPlace(samples, 48);

    expect(samples[0]).toBeCloseTo(0, 5);
    expect(samples[1]).toBeCloseTo(1, 5);
    expect(samples[2]).toBeCloseTo(0, 5);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/audioCodec.test.ts`
Expected: FAIL — `Cannot find module '../src/services/audioCodec'`.

- [ ] **Step 3: Implement `audioCodec.ts`**

Create `src/services/audioCodec.ts`:

```ts
export function encodeBase64Pcm16(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i += 1) {
    view.setInt16(i * 2, samples[i], true);
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decodePcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const view = new DataView(bytes.buffer);
  const sampleCount = bytes.length / 2;
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    const int16 = view.getInt16(i * 2, true);
    samples[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }
  return samples;
}

export function applyFadeInPlace(samples: Float32Array, fadeSamples: number): void {
  const length = Math.min(fadeSamples, Math.floor(samples.length / 2));
  for (let i = 0; i < length; i += 1) {
    const gain = i / length;
    samples[i] *= gain;
    samples[samples.length - 1 - i] *= gain;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/audioCodec.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/audioCodec.ts tests/audioCodec.test.ts
git commit -m "$(cat <<'EOF'
Add pure PCM16 base64 codec and fade-envelope helpers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `MicCapture` — mic capture and PCM16 streaming

**Files:**
- Create: `public/audio/pcm-capture-processor.js`
- Create: `src/services/MicCapture.ts`

**Interfaces:**
- Consumes: `encodeBase64Pcm16` from Task 4.
- Produces: `class MicCapture { constructor(callbacks: { onChunk(base64Pcm16: string): void }); start(): Promise<void>; stop(): void }`
- Consumed by: `VoiceChatController` (Task 9).

Not unit tested — this is browser-only integration code (`getUserMedia`/`AudioWorklet` don't exist in Vitest's Node environment). Verified in Task 10's live E2E check.

- [ ] **Step 1: Create the AudioWorklet processor**

Create `public/audio/pcm-capture-processor.js`:

```js
const SAMPLES_PER_CHUNK = 960; // 40ms at 24kHz

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) {
      return true;
    }

    for (let i = 0; i < channel.length; i += 1) {
      this._buffer.push(channel[i]);
    }

    while (this._buffer.length >= SAMPLES_PER_CHUNK) {
      const chunk = this._buffer.splice(0, SAMPLES_PER_CHUNK);
      const pcm16 = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i += 1) {
        const sample = Math.max(-1, Math.min(1, chunk[i]));
        pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
```

- [ ] **Step 2: Create `MicCapture.ts`**

Create `src/services/MicCapture.ts`:

```ts
import { encodeBase64Pcm16 } from './audioCodec';

const SAMPLE_RATE = 24_000;
const WORKLET_URL = '/audio/pcm-capture-processor.js';
const WORKLET_NAME = 'pcm-capture-processor';

export interface MicCaptureCallbacks {
  onChunk(base64Pcm16: string): void;
}

export class MicCapture {
  #stream: MediaStream | undefined;
  #audioContext: AudioContext | undefined;
  #sourceNode: MediaStreamAudioSourceNode | undefined;
  #workletNode: AudioWorkletNode | undefined;

  constructor(private readonly callbacks: MicCaptureCallbacks) {}

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });

    const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    await audioContext.audioWorklet.addModule(WORKLET_URL);

    const sourceNode = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, WORKLET_NAME);
    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      this.callbacks.onChunk(encodeBase64Pcm16(new Int16Array(event.data)));
    };
    sourceNode.connect(workletNode);

    this.#stream = stream;
    this.#audioContext = audioContext;
    this.#sourceNode = sourceNode;
    this.#workletNode = workletNode;
  }

  stop(): void {
    this.#sourceNode?.disconnect();
    this.#workletNode?.disconnect();
    for (const track of this.#stream?.getTracks() ?? []) {
      track.stop();
    }
    void this.#audioContext?.close();
    this.#stream = undefined;
    this.#audioContext = undefined;
    this.#sourceNode = undefined;
    this.#workletNode = undefined;
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS. (`public/audio/pcm-capture-processor.js` is a plain static asset, not part of the TS project — no typecheck needed for it.)

- [ ] **Step 4: Commit**

```bash
git add public/audio/pcm-capture-processor.js src/services/MicCapture.ts
git commit -m "$(cat <<'EOF'
Add mic capture: AudioWorklet PCM16 quantization + streaming wrapper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `VoicePlaybackQueue` — gapless playback with barge-in

**Files:**
- Create: `src/services/VoicePlaybackQueue.ts`

**Interfaces:**
- Consumes: `decodePcm16ToFloat32`, `applyFadeInPlace` from Task 4.
- Produces: `class VoicePlaybackQueue { enqueue(base64Pcm16: string): void; stop(): void; dispose(): void }`
- Consumed by: `VoiceChatController` (Task 9).

Not unit tested — depends on real `AudioContext` (browser-only). Verified in Task 10's live E2E check.

- [ ] **Step 1: Create `VoicePlaybackQueue.ts`**

Create `src/services/VoicePlaybackQueue.ts`:

```ts
import { applyFadeInPlace, decodePcm16ToFloat32 } from './audioCodec';

const SAMPLE_RATE = 24_000;
const FADE_SAMPLES = 48;

export class VoicePlaybackQueue {
  #audioContext: AudioContext | undefined;
  #nextStartTime = 0;
  #activeSources: AudioBufferSourceNode[] = [];

  enqueue(base64Pcm16: string): void {
    const context = this.#audioContext ?? new AudioContext({ sampleRate: SAMPLE_RATE });
    this.#audioContext = context;

    const samples = decodePcm16ToFloat32(base64Pcm16);
    applyFadeInPlace(samples, FADE_SAMPLES);

    const buffer = context.createBuffer(1, samples.length, SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startTime = Math.max(context.currentTime, this.#nextStartTime);
    source.start(startTime);
    this.#nextStartTime = startTime + buffer.duration;
    this.#activeSources.push(source);

    source.onended = () => {
      this.#activeSources = this.#activeSources.filter((active) => active !== source);
    };
  }

  stop(): void {
    for (const source of this.#activeSources) {
      source.stop();
    }
    this.#activeSources = [];
    this.#nextStartTime = 0;
  }

  dispose(): void {
    this.stop();
    void this.#audioContext?.close();
    this.#audioContext = undefined;
  }
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/services/VoicePlaybackQueue.ts
git commit -m "$(cat <<'EOF'
Add VoicePlaybackQueue: gapless PCM16 playback with barge-in stop

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `RealtimeVoiceClient` — browser WebSocket wrapper

**Files:**
- Create: `src/services/RealtimeVoiceClient.ts`

**Interfaces:**
- Produces:
  - `type VoiceChatStatus = 'connecting' | 'listening' | 'speaking' | 'closed'`
  - `type TranscriptSpeaker = 'PLAYER' | 'AURA'`
  - `interface RealtimeVoiceCallbacks { onStatusChange(status: VoiceChatStatus): void; onTranscriptDelta(speaker: TranscriptSpeaker, text: string): void; onTurnComplete(speaker: TranscriptSpeaker): void; onAudioDelta(base64Pcm16: string): void; onSpeechStarted(): void; onError(message: string): void; }`
  - `class RealtimeVoiceClient { constructor(baseUrl: string, callbacks: RealtimeVoiceCallbacks); connect(): void; sendAudioChunk(base64Pcm16: string): void; cancelResponse(): void; disconnect(): void }`
- Consumed by: `VoiceChatController` (Task 9).

Not unit tested — thin wrapper around the browser `WebSocket` global. Verified in Task 10's live E2E check, which also confirms the assumed Inworld event names below are correct.

- [ ] **Step 1: Create `RealtimeVoiceClient.ts`**

Create `src/services/RealtimeVoiceClient.ts`:

```ts
export type VoiceChatStatus = 'connecting' | 'listening' | 'speaking' | 'closed';
export type TranscriptSpeaker = 'PLAYER' | 'AURA';

export interface RealtimeVoiceCallbacks {
  onStatusChange(status: VoiceChatStatus): void;
  onTranscriptDelta(speaker: TranscriptSpeaker, text: string): void;
  onTurnComplete(speaker: TranscriptSpeaker): void;
  onAudioDelta(base64Pcm16: string): void;
  onSpeechStarted(): void;
  onError(message: string): void;
}

interface RealtimeMessage {
  type: string;
  delta?: string;
  transcript?: string;
}

export class RealtimeVoiceClient {
  #socket: WebSocket | undefined;

  constructor(
    private readonly baseUrl: string,
    private readonly callbacks: RealtimeVoiceCallbacks,
  ) {}

  connect(): void {
    const socket = new WebSocket(this.#buildUrl());
    socket.addEventListener('message', this.#onMessage);
    socket.addEventListener('close', () => this.callbacks.onStatusChange('closed'));
    socket.addEventListener('error', () =>
      this.callbacks.onError('Voice channel dropped.'),
    );

    this.#socket = socket;
  }

  sendAudioChunk(base64Pcm16: string): void {
    this.#send({ type: 'input_audio_buffer.append', audio: base64Pcm16 });
  }

  cancelResponse(): void {
    this.#send({ type: 'response.cancel' });
  }

  disconnect(): void {
    this.#socket?.close();
    this.#socket = undefined;
  }

  #buildUrl(): string {
    const base = new URL(this.baseUrl || window.location.href);
    base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
    base.pathname = '/ws/voice-chat';
    base.search = '';
    return base.toString();
  }

  #send(message: unknown): void {
    if (this.#socket?.readyState === WebSocket.OPEN) {
      this.#socket.send(JSON.stringify(message));
    }
  }

  readonly #onMessage = (event: MessageEvent<string>): void => {
    const message = JSON.parse(event.data) as RealtimeMessage;

    switch (message.type) {
      case 'session.updated':
        this.callbacks.onStatusChange('listening');
        break;
      case 'input_audio_buffer.speech_started':
        this.callbacks.onSpeechStarted();
        break;
      case 'response.output_audio.delta':
        if (typeof message.delta === 'string') {
          this.callbacks.onAudioDelta(message.delta);
        }
        this.callbacks.onStatusChange('speaking');
        break;
      case 'response.output_audio_transcript.delta':
        if (typeof message.delta === 'string') {
          this.callbacks.onTranscriptDelta('AURA', message.delta);
        }
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (typeof message.transcript === 'string') {
          this.callbacks.onTranscriptDelta('PLAYER', message.transcript);
          this.callbacks.onTurnComplete('PLAYER');
        }
        break;
      case 'response.done':
        this.callbacks.onTurnComplete('AURA');
        this.callbacks.onStatusChange('listening');
        break;
      default:
        console.debug('Unhandled realtime event:', message.type);
        break;
    }
  };
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/services/RealtimeVoiceClient.ts
git commit -m "$(cat <<'EOF'
Add RealtimeVoiceClient: browser WebSocket wrapper for voice chat

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: HUD panel — status and live captions

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`
- Modify: `src/ui/Hud.ts`

**Interfaces:**
- Produces (new `Hud` methods): `showVoiceChat(): void`, `hideVoiceChat(): void`, `setVoiceChatStatus(text: string): void`, `appendVoiceChatDelta(speaker: 'PLAYER' | 'AURA', text: string): void`, `completeVoiceChatTurn(speaker: 'PLAYER' | 'AURA'): void`
- Consumed by: `Game.ts` (Task 9).

- [ ] **Step 1: Add the voice-chat panel markup to `index.html`**

In `index.html`, add this new `<article>` right after the closing `</article>` of the existing `#dialogue` block (before the `<p id="notice" ...>` element):

```html
        <article id="voice-chat" class="voice-chat" aria-live="polite" hidden>
          <p id="voice-chat-status" class="voice-chat__status">Connecting…</p>
          <ul id="voice-chat-transcript" class="voice-chat__transcript"></ul>
        </article>
```

Update the controls hint line from:

```html
          <p>W/S thrust · A/D yaw · arrows pitch · Q/E roll · Shift boost · F talk</p>
```

to:

```html
          <p>W/S thrust · A/D yaw · arrows pitch · Q/E roll · Shift boost · F talk · C voice chat</p>
```

- [ ] **Step 2: Add styles to `src/styles.css`**

Add `.voice-chat` to the shared panel-background selector group:

```css
.quest-card,
.dialogue,
.voice-chat {
  border: 1px solid rgb(99 220 240 / 28%);
  background: linear-gradient(135deg, rgb(5 18 30 / 88%), rgb(4 10 18 / 60%));
  box-shadow: 0 1rem 4rem rgb(0 0 0 / 24%);
  backdrop-filter: blur(12px);
}
```

(This replaces the existing `.quest-card, .dialogue { ... }` rule — same declarations, just add `.voice-chat` to the selector list.)

Then append these new rules after the existing `.dialogue__source[hidden]` rule:

```css
.voice-chat {
  position: absolute;
  top: 50%;
  right: clamp(1rem, 3vw, 2.5rem);
  width: min(20rem, calc(100vw - 2rem));
  max-height: 60vh;
  padding: 1rem 1.1rem;
  overflow-y: auto;
  transform: translateY(-50%);
  pointer-events: auto;
}

.voice-chat__status {
  margin: 0 0 0.55rem;
  color: #63dcf0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.voice-chat__transcript {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.voice-chat__transcript li {
  font-size: 0.82rem;
  line-height: 1.5;
}

.voice-chat__transcript .voice-chat__line--player::before {
  color: #8ab9c6;
  content: 'YOU: ';
}

.voice-chat__transcript .voice-chat__line--aura::before {
  color: #63dcf0;
  content: 'AURA: ';
}
```

- [ ] **Step 3: Add the Hud methods**

In `src/ui/Hud.ts`, add these fields alongside the existing ones:

```ts
  readonly #voiceChat = requireElement<HTMLElement>('voice-chat');
  readonly #voiceChatStatus = requireElement<HTMLElement>('voice-chat-status');
  readonly #voiceChatTranscript = requireElement<HTMLUListElement>('voice-chat-transcript');
  readonly #voiceChatLines = new Map<'PLAYER' | 'AURA', HTMLLIElement>();
```

Add these methods to the `Hud` class (after `setNotice`):

```ts
  showVoiceChat(): void {
    this.#voiceChat.hidden = false;
    this.#voiceChatTranscript.replaceChildren();
    this.#voiceChatLines.clear();
  }

  hideVoiceChat(): void {
    this.#voiceChat.hidden = true;
  }

  setVoiceChatStatus(text: string): void {
    this.#voiceChatStatus.textContent = text;
  }

  appendVoiceChatDelta(speaker: 'PLAYER' | 'AURA', text: string): void {
    let line = this.#voiceChatLines.get(speaker);
    if (!line) {
      line = document.createElement('li');
      line.className =
        speaker === 'AURA' ? 'voice-chat__line--aura' : 'voice-chat__line--player';
      this.#voiceChatTranscript.append(line);
      this.#voiceChatLines.set(speaker, line);
    }
    line.textContent = `${line.textContent ?? ''}${text}`;
    this.#voiceChatTranscript.scrollTop = this.#voiceChatTranscript.scrollHeight;
  }

  completeVoiceChatTurn(speaker: 'PLAYER' | 'AURA'): void {
    this.#voiceChatLines.delete(speaker);
  }
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html src/styles.css src/ui/Hud.ts
git commit -m "$(cat <<'EOF'
Add voice-chat HUD panel: status line and live transcript

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `VoiceChatController` and `Game.ts` wiring

**Files:**
- Modify: `src/game/InputController.ts`
- Create: `src/services/VoiceChatController.ts`
- Modify: `src/game/Game.ts`

**Interfaces:**
- Consumes: `MicCapture` (Task 5), `VoicePlaybackQueue` (Task 6), `RealtimeVoiceClient`/`VoiceChatStatus`/`TranscriptSpeaker` (Task 7), `Hud` voice-chat methods (Task 8).
- Produces: `class VoiceChatController { constructor(baseUrl: string, callbacks: VoiceChatCallbacks); get isActive(): boolean; toggle(): Promise<void>; stop(): void; dispose(): void }`

- [ ] **Step 1: Add `KeyC` to the controlled keys**

In `src/game/InputController.ts`, change:

```ts
const CONTROLLED_KEYS = new Set([
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
  'KeyQ',
  'KeyE',
  'KeyF',
  'ArrowUp',
  'ArrowDown',
  'ShiftLeft',
  'ShiftRight',
]);
```

to:

```ts
const CONTROLLED_KEYS = new Set([
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
  'KeyQ',
  'KeyE',
  'KeyF',
  'KeyC',
  'ArrowUp',
  'ArrowDown',
  'ShiftLeft',
  'ShiftRight',
]);
```

- [ ] **Step 2: Create `VoiceChatController.ts`**

Create `src/services/VoiceChatController.ts`:

```ts
import { MicCapture } from './MicCapture';
import type { TranscriptSpeaker, VoiceChatStatus } from './RealtimeVoiceClient';
import { RealtimeVoiceClient } from './RealtimeVoiceClient';
import { VoicePlaybackQueue } from './VoicePlaybackQueue';

const STATUS_LABELS: Record<VoiceChatStatus, string> = {
  connecting: 'Connecting…',
  listening: 'Listening…',
  speaking: 'AURA speaking…',
  closed: 'Voice channel dropped.',
};

export interface VoiceChatCallbacks {
  onOpen(): void;
  onClose(): void;
  onStatusChange(text: string): void;
  onTranscriptDelta(speaker: TranscriptSpeaker, text: string): void;
  onTurnComplete(speaker: TranscriptSpeaker): void;
}

export class VoiceChatController {
  #active = false;
  readonly #playback = new VoicePlaybackQueue();
  readonly #mic: MicCapture;
  readonly #client: RealtimeVoiceClient;

  constructor(baseUrl: string, private readonly callbacks: VoiceChatCallbacks) {
    this.#client = new RealtimeVoiceClient(baseUrl, {
      onStatusChange: (status) => this.callbacks.onStatusChange(STATUS_LABELS[status]),
      onTranscriptDelta: (speaker, text) => this.callbacks.onTranscriptDelta(speaker, text),
      onTurnComplete: (speaker) => this.callbacks.onTurnComplete(speaker),
      onAudioDelta: (chunk) => this.#playback.enqueue(chunk),
      onSpeechStarted: () => {
        this.#playback.stop();
        this.#client.cancelResponse();
      },
      onError: (message) => {
        this.callbacks.onStatusChange(message);
        this.stop();
      },
    });
    this.#mic = new MicCapture({
      onChunk: (chunk) => this.#client.sendAudioChunk(chunk),
    });
  }

  get isActive(): boolean {
    return this.#active;
  }

  async toggle(): Promise<void> {
    if (this.#active) {
      this.stop();
      return;
    }

    this.#active = true;
    this.callbacks.onOpen();
    this.callbacks.onStatusChange(STATUS_LABELS.connecting);

    try {
      await this.#mic.start();
      this.#client.connect();
    } catch {
      this.callbacks.onStatusChange('Microphone access is needed for voice chat.');
      this.#active = false;
      this.#mic.stop();
      this.callbacks.onClose();
    }
  }

  stop(): void {
    this.#active = false;
    this.#mic.stop();
    this.#client.disconnect();
    this.#playback.dispose();
    this.callbacks.onClose();
  }

  dispose(): void {
    this.stop();
  }
}
```

- [ ] **Step 3: Wire it into `Game.ts`**

In `src/game/Game.ts`, add the import:

```ts
import { VoiceChatController } from '../services/VoiceChatController';
```

Add the field and construct it in the constructor — change:

```ts
  readonly #dialogue: DialogueController;
  readonly #clock = new Clock();
```

to:

```ts
  readonly #dialogue: DialogueController;
  readonly #voiceChat: VoiceChatController;
  readonly #clock = new Clock();
```

and in the constructor, change:

```ts
    const api = new GameApiClient(import.meta.env.VITE_API_BASE_URL);
    this.#dialogue = new DialogueController(api, {
      onDialogue: (response) => this.#hud.showDialogue(response),
      onNotice: (message) => this.#hud.setNotice(message),
    });
```

to:

```ts
    const api = new GameApiClient(import.meta.env.VITE_API_BASE_URL);
    this.#dialogue = new DialogueController(api, {
      onDialogue: (response) => this.#hud.showDialogue(response),
      onNotice: (message) => this.#hud.setNotice(message),
    });
    this.#voiceChat = new VoiceChatController(import.meta.env.VITE_API_BASE_URL ?? '', {
      onOpen: () => this.#hud.showVoiceChat(),
      onClose: () => this.#hud.hideVoiceChat(),
      onStatusChange: (text) => this.#hud.setVoiceChatStatus(text),
      onTranscriptDelta: (speaker, text) => this.#hud.appendVoiceChatDelta(speaker, text),
      onTurnComplete: (speaker) => this.#hud.completeVoiceChatTurn(speaker),
    });
```

Update `dispose()` — change:

```ts
  dispose(): void {
    cancelAnimationFrame(this.#animationFrame);
    window.removeEventListener('resize', this.#onResize);
    this.#world.dispose();
    this.#dialogue.dispose();
    this.#renderer.dispose();
  }
```

to:

```ts
  dispose(): void {
    cancelAnimationFrame(this.#animationFrame);
    window.removeEventListener('resize', this.#onResize);
    this.#world.dispose();
    this.#dialogue.dispose();
    this.#voiceChat.dispose();
    this.#renderer.dispose();
  }
```

Update `#tick` — change:

```ts
  readonly #tick = (): void => {
    const deltaSeconds = Math.min(this.#clock.getDelta(), 0.05);
    const update = this.#world.update(deltaSeconds);
    const contact = update.nearestContact;

    this.#hud.updateTelemetry(update.speed, contact);
    this.#advanceVisitQuest();

    if (
      update.enteredContactId &&
      !this.#introducedContactIds.has(update.enteredContactId)
    ) {
      this.#introducedContactIds.add(update.enteredContactId);
      void this.#openChannel(update.enteredContactId);
    } else if (update.interactionRequested && contact?.inRange) {
      void this.#openChannel(contact.id);
    }

    this.#renderer.render(this.#world.scene, this.#world.camera.camera);
    this.#animationFrame = requestAnimationFrame(this.#tick);
  };
```

to:

```ts
  readonly #tick = (): void => {
    const deltaSeconds = Math.min(this.#clock.getDelta(), 0.05);
    const update = this.#world.update(deltaSeconds);
    const contact = update.nearestContact;

    this.#hud.updateTelemetry(update.speed, contact);
    this.#advanceVisitQuest();

    if (this.#world.input.consumePress('KeyC')) {
      void this.#voiceChat.toggle();
    }

    if (!this.#voiceChat.isActive) {
      if (
        update.enteredContactId &&
        !this.#introducedContactIds.has(update.enteredContactId)
      ) {
        this.#introducedContactIds.add(update.enteredContactId);
        void this.#openChannel(update.enteredContactId);
      } else if (update.interactionRequested && contact?.inRange) {
        void this.#openChannel(contact.id);
      }
    }

    this.#renderer.render(this.#world.scene, this.#world.camera.camera);
    this.#animationFrame = requestAnimationFrame(this.#tick);
  };
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npx vitest run`
Expected: PASS, no type errors, no regressions.

- [ ] **Step 5: Commit**

```bash
git add src/game/InputController.ts src/services/VoiceChatController.ts src/game/Game.ts
git commit -m "$(cat <<'EOF'
Wire press-C voice chat into Game: toggle, and pause F/auto-narration while active

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Dev-server WS proxy and live E2E verification

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add the WebSocket proxy**

Change `vite.config.ts` from:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
});
```

to:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/ws': {
        target: 'ws://localhost:8787',
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 2: Commit the proxy change**

```bash
git add vite.config.ts
git commit -m "$(cat <<'EOF'
Proxy /ws to the API server for voice chat in dev

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Run the full check suite**

Run: `npm run check`
Expected: PASS — typecheck, lint, and all tests green.

- [ ] **Step 4: Start the dev server**

```bash
npm run dev &
sleep 3
curl -sf http://localhost:5173/ > /dev/null && echo "game up"
curl -sf http://localhost:8787/api/health && echo
```

Expected: `game up` and `{"ok":true}`. Leave this running for the next step.

- [ ] **Step 5: Live E2E check against the real Inworld Realtime API**

This uses the `INWORLD_API_KEY` already configured in `.env` and makes a real, billed call — the user has approved this (see spec: "Live API test"). If Playwright isn't installed yet:

```bash
node -e "require.resolve('playwright')" 2>/dev/null || (npm install --no-save playwright && npx playwright install --with-deps chromium)
```

Then run:

```bash
node <<'EOF'
import('playwright').then(async ({ chromium }) => {
  const browser = await chromium.launch({
    args: [
      '--no-sandbox',
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
    ],
  });
  const context = await browser.newContext({ permissions: ['microphone'] });
  const page = await context.newPage();

  const unhandledEvents = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Unhandled realtime event')) {
      unhandledEvents.push(text);
    }
  });

  await page.goto('http://localhost:5173/');
  await page.waitForSelector('#game-canvas');
  await page.keyboard.press('KeyC');

  await page.waitForSelector('#voice-chat:not([hidden])', { timeout: 5000 });
  await page.waitForFunction(
    () => document.querySelector('#voice-chat-status')?.textContent === 'Listening…',
    { timeout: 15000 },
  );

  console.log('STATUS_AFTER_HANDSHAKE:', await page.textContent('#voice-chat-status'));
  await page.waitForTimeout(5000);
  console.log('UNHANDLED_EVENTS:', JSON.stringify(unhandledEvents));

  await page.keyboard.press('KeyC');
  await page.waitForSelector('#voice-chat[hidden]', { timeout: 5000 });
  console.log('HUNG_UP_OK: true');

  await browser.close();
});
EOF
```

Expected:
- `STATUS_AFTER_HANDSHAKE: Listening…` — proves `session.created` → server-injected `session.update` → `session.updated` completed successfully against the real API.
- `HUNG_UP_OK: true` — pressing `C` again closes the panel.
- If `UNHANDLED_EVENTS` is non-empty, read the logged event type(s): if `conversation.item.input_audio_transcription.completed` never appears but a different-but-similar event name does (e.g. a naming variant), update the `case` label in `src/services/RealtimeVoiceClient.ts`'s `#onMessage` switch to match, then re-run this step.

Stop the dev server when done:

```bash
kill %1
```

- [ ] **Step 6: Manually confirm captions and audio (optional but recommended)**

Since this task's automated check uses a fake mic (silence/tone, not real speech), it can't validate that spoken questions get sensible answers. Run `npm run dev`, open `http://localhost:5173/` in a real browser, press `C`, grant microphone access, and ask AURA a science question out loud — confirm you hear an energetic, kid-friendly spoken reply and see matching captions in the panel, then press `C` again to hang up.
