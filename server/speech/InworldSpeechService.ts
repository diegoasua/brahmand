import { InworldTTS } from '@inworld/tts';
import type { SpeechRequest } from '../../src/shared/contracts';
import { HttpError } from '../http-errors';

export interface SpeechService {
  synthesize(request: SpeechRequest): Promise<Uint8Array>;
}

export class InworldSpeechService implements SpeechService {
  readonly #apiKey: string | undefined;
  readonly #defaultVoice: string;
  readonly #model: string;

  constructor(options: {
    apiKey: string | undefined;
    defaultVoice: string;
    model: string;
  }) {
    this.#apiKey = options.apiKey;
    this.#defaultVoice = options.defaultVoice;
    this.#model = options.model;
  }

  async synthesize(request: SpeechRequest): Promise<Uint8Array> {
    if (!this.#apiKey) {
      throw new HttpError(
        503,
        'Inworld speech is not configured. Add INWORLD_API_KEY to the server environment.',
      );
    }

    const client = InworldTTS({ apiKey: this.#apiKey });
    return client.generate({
      text: request.text,
      voice: request.voiceId || this.#defaultVoice,
      model: this.#model,
      encoding: 'MP3',
    });
  }
}
