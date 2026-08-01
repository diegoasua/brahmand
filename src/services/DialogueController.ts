import type { DialogueResponse } from '../shared/contracts';
import type { GameApiClient } from './GameApiClient';

export interface DialogueCallbacks {
  onDialogue(response: DialogueResponse): void;
  onNotice(message: string): void;
}

export class DialogueController {
  #busy = false;
  #audio: HTMLAudioElement | undefined;
  #audioUrl: string | undefined;

  constructor(
    private readonly api: GameApiClient,
    private readonly callbacks: DialogueCallbacks,
  ) {}

  async talk(targetId: string, questId?: string): Promise<boolean> {
    if (this.#busy) {
      return false;
    }

    this.#busy = true;
    this.callbacks.onNotice('Opening channel…');

    try {
      const response = await this.api.requestDialogue({ targetId, questId });
      this.callbacks.onDialogue(response);
      this.callbacks.onNotice('Channel connected. Requesting voice…');
      void this.#speak(response);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Dialogue unavailable.';
      this.callbacks.onNotice(message);
      return false;
    } finally {
      this.#busy = false;
    }
  }

  dispose(): void {
    this.#audio?.pause();
    if (this.#audioUrl) {
      URL.revokeObjectURL(this.#audioUrl);
    }
  }

  async #speak(dialogue: DialogueResponse): Promise<void> {
    try {
      const blob = await this.api.requestSpeech({
        text: dialogue.text,
        voiceId: dialogue.voiceId,
      });

      this.#audio?.pause();
      if (this.#audioUrl) {
        URL.revokeObjectURL(this.#audioUrl);
      }

      this.#audioUrl = URL.createObjectURL(blob);
      this.#audio = new Audio(this.#audioUrl);
      await this.#audio.play();
      this.callbacks.onNotice('Inworld voice connected.');
    } catch {
      this.callbacks.onNotice(
        'Dialogue is readable; voice is unavailable until Inworld is configured.',
      );
    }
  }
}
