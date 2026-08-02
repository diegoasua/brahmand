export interface RelaySocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches the `ws` library's own `on(event, listener)` signature
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
