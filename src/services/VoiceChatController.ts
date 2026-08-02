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
