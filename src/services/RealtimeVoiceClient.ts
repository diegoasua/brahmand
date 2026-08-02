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
