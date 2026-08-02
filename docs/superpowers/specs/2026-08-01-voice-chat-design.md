# Voice chat (press C) — design spec

## Goal

At any point during flight, the player can press `C` to open a live speech-to-speech
conversation with AURA, powered by the Inworld Realtime API. AURA is rewritten for this
mode as an energetic, kid-friendly science explainer, distinct from (but consistent with)
her existing calm proximity-narration persona.

## Scope

- **General companion**, not tied to a nearby celestial body or its curated knowledge
  entries. Available from any point in the game, any time.
- **Same character** as the existing `F`-key narrator (AURA), but with new,
  voice-chat-only system instructions. The existing calm/concise narrator prompt used by
  `InworldRouterDialogueProvider` and `auraNarrator.role` is untouched.
- **Flight stays live** while voice chat is open — WASD/etc. keep working, matching how
  the existing F-key dialogue already doesn't pause the world.
- **Live captions**: a scrolling transcript of both sides of the conversation is shown in
  a new HUD panel, not just an audio-only experience.
- **Voice**: reuses AURA's existing voice ID (`serverConfig.inworldVoice`,
  `default-ykfyhnvuymspwpqixkv0aa__neil`) for character continuity.
- While voice chat is open, proximity-triggered auto-narration and the `F` channel are
  ignored, to avoid two AI voices overlapping. Both resume normally once voice chat closes.

## Architecture

```
Browser                                          Node API server (server/)
─────────────────────────────                    ─────────────────────────────
InputController: 'KeyC' press
        │
        ▼
VoiceChatController (new)
  ├─ MicCapture            ── mic PCM16 chunks ──▶  WebSocket  ──▶  RealtimeVoiceRelay ──▶  wss://api.inworld.ai/.../realtime
  │   (getUserMedia,           (base64, ~40ms)      /ws/voice-chat   (holds INWORLD_API_KEY,   (Inworld Realtime API)
  │    AudioContext@24kHz,                                            never sent to browser)
  │    AudioWorklet)
  │
  ├─ VoicePlaybackQueue    ◀── audio deltas ────── same WebSocket ◀── relay forwards ──────── response.output_audio.delta
  │   (schedules PCM16                                                verbatim
  │    chunks, fade in/out,
  │    stop() for barge-in)
  │
  └─ VoiceChatPanel (HUD)  ◀── transcript deltas ── same WebSocket ◀── relay forwards ──────── response.output_audio_transcript.delta
      (status + captions)                                                                       + input_audio_buffer.speech_started
```

The relay (`server/realtime/RealtimeVoiceRelay.ts`) is a thin, mostly-transparent
bidirectional forwarder between the browser's WebSocket and an outbound WebSocket to
Inworld. It injects exactly one piece of behavior: the moment it observes a
`session.created` event from Inworld, it immediately sends the hardcoded
`session.update` (model, voice, instructions, VAD config) upstream — the browser never
sends, and never sees, the system prompt, model name, or API key. Any `session.update`
a client attempts to send is dropped by the relay rather than forwarded.

Barge-in: on `input_audio_buffer.speech_started` (forwarded to the browser),
`VoicePlaybackQueue.stop()` fires immediately client-side, and the browser sends
`response.cancel`, which the relay passes upstream unchanged.

`server/index.ts` captures the `http.Server` returned by `app.listen()` and attaches the
voice relay's `WebSocketServer` to it (`path: '/ws/voice-chat'`) — one process, one port.
Adds one new dependency: `ws` (+ `@types/ws`).

`vite.config.ts` gets a second proxy entry for `/ws` with `ws: true`, mirroring the
existing `/api` proxy, so `npm run dev` needs no extra setup. The browser derives the
WebSocket URL the same way `GameApiClient` derives its HTTP base URL (same origin by
default, `VITE_API_BASE_URL` override for cross-origin deployments, `http(s)` swapped for
`ws(s)`).

**Outbound connection to Inworld**: the relay opens
`wss://api.inworld.ai/api/v1/realtime/session?key=voice-<timestamp>&protocol=realtime`
with header `Authorization: Basic <INWORLD_API_KEY>`, per the Inworld Realtime API spec.

## Client UI/UX

- **Toggle key**: `C`, added to `InputController`'s controlled keys.
  - Idle → press `C`: request mic permission, open the WebSocket, show "Connecting…".
  - Connecting/connected → press `C`: hang up — close the socket, stop mic tracks, stop
    playback, clear the panel.
- **New HUD panel** (`#voice-chat`, hidden by default, styled like the existing
  `.dialogue` panel): a status line (`Connecting…` / `Listening…` / `AURA speaking…` /
  an error message) plus a scrolling transcript built from the player's STT transcript
  and `response.output_audio_transcript.delta`.
- **Controls hint** updated to include `C voice chat`.
- Failure modes are surfaced in the panel, not silently swallowed (see Error handling).

## Persona instructions (voice-chat only)

```
You are AURA — Asteria's onboard science guide, live on an open voice channel with your
favorite young explorer. You're warm, playful, and genuinely excited about space and
science; every question is the best question you've heard all day.

You are an AI, not a human — you don't pretend to have a body, meals, or a commute, and
you're happy to say so if it comes up, but you don't dwell on it.

VOICE AND ENERGY
Bright, quick, enthusiastic — like a favorite teacher who can't wait to show you
something cool. Use simple words a curious 8-12 year old would know. When a bigger
science word is necessary ("gravity", "orbit", "photosynthesis"), say it, then
immediately explain it in one plain-language phrase. Small delighted exclamations are
welcome ("Ooh, great question!", "Here's the fun part —").

TURN LENGTH
Keep answers snappy for a voice conversation — usually 2-4 short sentences. Go longer
only when explicitly asked to explain something in depth, and even then break it into
clear, bite-sized ideas rather than one long lecture. Land one idea, then offer to go
deeper rather than dumping everything at once.

ACCURACY
Stay honest and grounded. It's fine — and good — to say "we don't know for sure yet" or
"scientists are still figuring that out." Never invent facts, numbers, or discoveries.
Keep Brahmand's fictional story (Asteria, the ship, the quests) separate from real
science — don't blend invented lore into a real-science explanation.

EXPRESSIVENESS
[speak ...] direction tags work as usual: at most one, at the very head of a turn,
matching the moment — e.g. [speak with bright, delighted energy] when the player is
excited or amazed, [speak warmly and a little softer] if they seem confused, [speak with
playful mock-seriousness] for jokes. Non-verbal cues available: [laugh], [breathe],
[sigh], [cough], [clear throat], [yawn] — sparingly, where a real excited narrator would
use them.

CONVERSATION STYLE
This is a two-way chat, not a lecture. Ask a quick, fun follow-up sometimes ("Want to
know why it looks blue?"), but don't interrogate. If the player wants to talk about
something else, roll with it happily, then look for a fun way back to something you're
excited to explain.
```

## Session config

```json
{
  "type": "session.update",
  "session": {
    "type": "realtime",
    "model": "<serverConfig.inworldRealtimeModel>",
    "instructions": "<persona text above>",
    "output_modalities": ["audio"],
    "audio": {
      "input": {
        "transcription": { "model": "assemblyai/u3-rt-pro" },
        "turn_detection": {
          "type": "semantic_vad",
          "eagerness": "medium",
          "create_response": true,
          "interrupt_response": true
        }
      },
      "output": {
        "model": "inworld-tts-2",
        "voice": "<serverConfig.inworldVoice>"
      }
    },
    "providerData": { "stt": { "voice_profile": false } }
  }
}
```

`serverConfig` gains `inworldRealtimeModel`, read from `INWORLD_REALTIME_MODEL`,
defaulting to `google-ai-studio/gemini-2.5-flash-lite` — same pattern as the existing
`inworldLlmModel` field. Documented in `.env.example`.

## Error handling

- **No API key configured**: the relay accepts the browser socket, then closes it
  immediately with a close reason the client surfaces as "Voice chat isn't configured
  yet." (mirrors `InworldSpeechService`'s 503 pattern, over a WS close code/reason
  instead of an HTTP status).
- **Mic permission denied / no mic**: caught before opening the WebSocket at all; panel
  shows "Microphone access is needed for voice chat."
- **Upstream (Inworld) disconnects or errors mid-session**: relay closes the browser
  socket too; panel shows "Voice channel dropped." and returns to idle (press `C` to
  retry).

## Testing

- `tests/RealtimeVoiceRelay.test.ts` — unit tests against fake socket objects (same
  dependency-injection style as `InworldRouterDialogueProvider.test.ts`): confirms
  `session.update` fires exactly once right after `session.created` with the correct
  model/voice/instructions; confirms bidirectional passthrough of audio/transcript/cancel
  events; confirms a client-sent `session.update` is dropped; confirms closing one side
  closes the other.
- Mic/AudioWorklet/playback code is genuine browser-integration logic (no real
  `getUserMedia`/`AudioContext` in vitest+jsdom) — not unit tested, matching how the
  existing `DialogueController`'s real audio playback isn't unit tested either.
- **Manual/E2E verification**: driven with Playwright using Chromium's
  `--use-fake-device-for-media-stream` flag (synthetic mic tone) and granted mic
  permission, confirming the `session.created` → `session.update` → `session.updated`
  handshake completes and captions appear in the panel. This exercises the live,
  billed Inworld Realtime API using the `INWORLD_API_KEY` already configured in `.env`
  (approved by the user).
