import type { DialogueResponse } from '../shared/contracts';
import type { GameApiClient } from './GameApiClient';

export interface DialogueCallbacks {
  onDialogue(response: DialogueResponse): void;
  onNotice(message: string): void;
}

export class DialogueController {
  #busy = false;
  #audioContext: AudioContext | undefined;
  #audioSource: AudioBufferSourceNode | undefined;

  constructor(
    private readonly api: GameApiClient,
    private readonly callbacks: DialogueCallbacks,
  ) {
    window.addEventListener('keydown', this.#unlockAudio, { once: true });
    window.addEventListener('pointerdown', this.#unlockAudio, { once: true });
  }

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
    window.removeEventListener('keydown', this.#unlockAudio);
    window.removeEventListener('pointerdown', this.#unlockAudio);
    this.#audioSource?.stop();
    void this.#audioContext?.close();
  }

  async #speak(dialogue: DialogueResponse): Promise<void> {
    try {
      const blob = await this.api.requestSpeech({
        text: dialogue.text,
        voiceId: dialogue.voiceId,
      });

      const context = this.#audioContext ?? new AudioContext();
      this.#audioContext = context;
      await context.resume();
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());

      this.#audioSource?.stop();
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
      this.#audioSource = source;
      this.callbacks.onNotice('Inworld voice connected.');
    } catch {
      this.callbacks.onNotice(
        'Dialogue is readable; voice is unavailable until Inworld is configured.',
      );
    }
  }

  readonly #unlockAudio = (): void => {
    this.#audioContext ??= new AudioContext();
    void this.#audioContext.resume();
    window.removeEventListener('keydown', this.#unlockAudio);
    window.removeEventListener('pointerdown', this.#unlockAudio);
  };
}
