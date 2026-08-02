import type { GroundingReference } from '../shared/contracts';
import type { GameApiClient } from './GameApiClient';

export type VoiceConversationState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'hearing'
  | 'thinking'
  | 'speaking'
  | 'unavailable';

export interface VoiceConversationCallbacks {
  onStateChange(state: VoiceConversationState): void;
  onTranscript(role: 'player' | 'aura', text: string): void;
  onGrounding(grounding: GroundingReference[]): void;
  onError(message: string): void;
}

export interface VoiceTurnTransition {
  state: VoiceConversationState;
  microphoneEnabled?: true;
}

interface RealtimeServerEvent {
  type?: unknown;
  transcript?: unknown;
  error?: {
    message?: unknown;
  };
}

export class VoiceConversationController {
  #peer: RTCPeerConnection | undefined;
  #channel: RTCDataChannel | undefined;
  #stream: MediaStream | undefined;
  #inputTrack: MediaStreamTrack | undefined;
  #outputAudio: HTMLAudioElement | undefined;
  #generation = 0;
  #active = false;

  constructor(
    private readonly api: GameApiClient,
    private readonly callbacks: VoiceConversationCallbacks,
  ) {}

  get isActive(): boolean {
    return this.#active;
  }

  async start(targetId: string): Promise<boolean> {
    this.#generation += 1;
    this.#releaseResources();
    const generation = this.#generation;
    this.#active = true;
    this.callbacks.onStateChange('connecting');

    try {
      const config = await this.api.requestRealtimeConfig(targetId);
      if (!this.#isCurrent(generation)) {
        return false;
      }
      this.callbacks.onGrounding(config.grounding);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (!this.#isCurrent(generation)) {
        stopStream(stream);
        return false;
      }

      this.#stream = stream;
      this.#inputTrack = stream.getAudioTracks()[0];
      if (!this.#inputTrack) {
        throw new Error('No microphone audio track is available.');
      }
      this.#inputTrack.enabled = false;

      const peer = new RTCPeerConnection({
        iceServers: config.iceServers,
      });
      const channel = peer.createDataChannel('oai-events', { ordered: true });
      const outputAudio = document.createElement('audio');
      outputAudio.autoplay = true;
      outputAudio.hidden = true;
      document.body.append(outputAudio);

      this.#peer = peer;
      this.#channel = channel;
      this.#outputAudio = outputAudio;
      for (const track of stream.getTracks()) {
        peer.addTrack(track, stream);
      }

      peer.ontrack = (event) => {
        if (!this.#isCurrent(generation)) {
          return;
        }
        outputAudio.srcObject =
          event.streams[0] ?? new MediaStream([event.track]);
        void outputAudio.play().catch(() => {
          this.callbacks.onError(
            'The voice channel connected, but browser audio playback was blocked.',
          );
        });
      };

      peer.onconnectionstatechange = () => {
        if (
          this.#isCurrent(generation) &&
          (peer.connectionState === 'failed' ||
            peer.connectionState === 'closed')
        ) {
          this.#fail('The realtime voice connection ended.');
        }
      };

      const sessionReady = new Promise<void>((resolve, reject) => {
        channel.onopen = () => {
          channel.send(
            JSON.stringify({ type: 'session.update', session: config.session }),
          );
        };
        channel.onerror = () => reject(new Error('The voice data channel failed.'));
        channel.onclose = () => {
          if (this.#isCurrent(generation)) {
            reject(new Error('The voice data channel closed unexpectedly.'));
          }
        };
        channel.onmessage = (event) => {
          const message = parseServerEvent(event.data);
          if (!message) {
            return;
          }

          if (message.type === 'session.updated') {
            this.#applyTurnTransition(message.type);
            resolve();
            return;
          }

          this.#handleServerEvent(message);
        };
      });

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);
      if (!this.#isCurrent(generation) || !peer.localDescription?.sdp) {
        return false;
      }

      const answer = await this.api.exchangeRealtimeSdp(
        peer.localDescription.sdp,
      );
      if (!this.#isCurrent(generation)) {
        return false;
      }
      await peer.setRemoteDescription({ type: 'answer', sdp: answer });
      await withTimeout(sessionReady, 15_000, 'The voice session timed out.');
      return this.#isCurrent(generation);
    } catch (error) {
      if (this.#isCurrent(generation)) {
        const message = describeVoiceError(error);
        this.#releaseResources();
        this.#active = false;
        this.callbacks.onStateChange('unavailable');
        this.callbacks.onError(message);
      }
      return false;
    }
  }

  stop(): void {
    this.#generation += 1;
    this.#releaseResources();
    this.#active = false;
    this.callbacks.onStateChange('idle');
  }

  dispose(): void {
    this.stop();
  }

  #handleServerEvent(message: RealtimeServerEvent): void {
    this.#applyTurnTransition(message.type);

    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = readText(message.transcript);
        if (transcript) {
          this.callbacks.onTranscript('player', transcript);
        }
        break;
      }
      case 'response.output_audio_transcript.done': {
        const transcript = readText(message.transcript);
        if (transcript) {
          this.callbacks.onTranscript('aura', transcript);
        }
        break;
      }
      case 'error':
        this.#fail(
          readText(message.error?.message) ||
            'Inworld reported a realtime voice error.',
        );
        break;
    }
  }

  #applyTurnTransition(type: unknown): void {
    const transition = voiceTurnTransitionForEvent(type);
    if (!transition) {
      return;
    }
    if (transition.microphoneEnabled) {
      this.#setMicrophoneEnabled(true);
    }
    this.callbacks.onStateChange(transition.state);
  }

  #setMicrophoneEnabled(enabled: boolean): void {
    if (this.#inputTrack) {
      this.#inputTrack.enabled = enabled;
    }
  }

  #fail(message: string): void {
    if (!this.#active) {
      return;
    }

    this.#generation += 1;
    this.#releaseResources();
    this.#active = false;
    this.callbacks.onStateChange('unavailable');
    this.callbacks.onError(message);
  }

  #releaseResources(): void {
    this.#channel?.close();
    this.#peer?.close();
    if (this.#stream) {
      stopStream(this.#stream);
    }
    if (this.#outputAudio) {
      this.#outputAudio.pause();
      this.#outputAudio.srcObject = null;
      this.#outputAudio.remove();
    }

    this.#channel = undefined;
    this.#peer = undefined;
    this.#stream = undefined;
    this.#inputTrack = undefined;
    this.#outputAudio = undefined;
  }

  #isCurrent(generation: number): boolean {
    return this.#active && generation === this.#generation;
  }
}

function parseServerEvent(value: unknown): RealtimeServerEvent | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object'
      ? (parsed as RealtimeServerEvent)
      : undefined;
  } catch {
    return undefined;
  }
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function voiceTurnTransitionForEvent(
  type: unknown,
): VoiceTurnTransition | undefined {
  switch (type) {
    case 'session.updated':
      return { state: 'listening', microphoneEnabled: true };
    case 'input_audio_buffer.speech_started':
      return { state: 'hearing' };
    case 'input_audio_buffer.speech_stopped':
    case 'response.created':
      return { state: 'thinking' };
    case 'output_audio_buffer.started':
    case 'response.output_audio.done':
      return { state: 'speaking' };
    case 'output_audio_buffer.stopped':
    case 'response.done':
      return { state: 'listening', microphoneEnabled: true };
    default:
      return undefined;
  }
}

function stopStream(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function describeVoiceError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Microphone access was denied. Allow microphone access, then press C again.';
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'No microphone was found for voice conversation.';
  }
  return error instanceof Error ? error.message : 'Voice conversation is unavailable.';
}

async function waitForIceGathering(peer: RTCPeerConnection): Promise<void> {
  if (peer.iceGatheringState === 'complete') {
    return;
  }

  await new Promise<void>((resolve) => {
    let quietTimer = 0;
    const timeout = window.setTimeout(done, 3_000);

    function done(): void {
      window.clearTimeout(timeout);
      window.clearTimeout(quietTimer);
      peer.removeEventListener('icecandidate', onCandidate);
      peer.removeEventListener('icegatheringstatechange', onStateChange);
      resolve();
    }

    function onCandidate(event: RTCPeerConnectionIceEvent): void {
      if (!event.candidate) {
        done();
        return;
      }
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(done, 500);
    }

    function onStateChange(): void {
      if (peer.iceGatheringState === 'complete') {
        done();
      }
    }

    peer.addEventListener('icecandidate', onCandidate);
    peer.addEventListener('icegatheringstatechange', onStateChange);
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  message: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      window.setTimeout(() => reject(new Error(message)), milliseconds);
    }),
  ]);
}
