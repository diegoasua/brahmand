import type {
  ApiErrorResponse,
  DialogueRequest,
  DialogueResponse,
  SpeechRequest,
} from '../shared/contracts';

export class GameApiClient {
  readonly #baseUrl: string;

  constructor(baseUrl = '') {
    this.#baseUrl = baseUrl.replace(/\/$/, '');
  }

  async requestDialogue(request: DialogueRequest): Promise<DialogueResponse> {
    const response = await fetch(`${this.#baseUrl}/api/dialogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(await this.#readError(response));
    }

    return response.json() as Promise<DialogueResponse>;
  }

  async requestSpeech(request: SpeechRequest): Promise<Blob> {
    const response = await fetch(`${this.#baseUrl}/api/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(await this.#readError(response));
    }

    return response.blob();
  }

  async #readError(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as ApiErrorResponse;
      return body.error;
    } catch {
      return `Request failed with status ${response.status}.`;
    }
  }
}
