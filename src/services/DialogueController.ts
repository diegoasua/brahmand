import type {
  DialogueIntent,
  DialogueResponse,
  DialogueTurn,
} from '../shared/contracts';
import type { GameApiClient } from './GameApiClient';

export interface DialogueCallbacks {
  onDialogue(response: DialogueResponse): void;
  onNotice(message: string): void;
}

export interface DialogueTalkOptions {
  questId?: string;
  intent?: DialogueIntent;
  playerMessage?: string;
}

export class DialogueController {
  #busy = false;
  #audioContext: AudioContext | undefined;
  #audioSource: AudioBufferSourceNode | undefined;
  #playbackGeneration = 0;
  readonly #seenKnowledgeIds = new Map<string, Set<string>>();
  readonly #history = new Map<string, DialogueTurn[]>();

  constructor(
    private readonly api: GameApiClient,
    private readonly callbacks: DialogueCallbacks,
  ) {
    window.addEventListener('keydown', this.#unlockAudio, { once: true });
    window.addEventListener('pointerdown', this.#unlockAudio, { once: true });
  }

  async talk(
    targetId: string,
    options: DialogueTalkOptions = {},
  ): Promise<boolean> {
    if (this.#busy) {
      this.callbacks.onNotice('AURA is still responding…');
      return false;
    }

    const intent = options.intent ?? 'fact';
    const playbackGeneration = this.#playbackGeneration;
    const history = this.#history.get(targetId) ?? [];
    const seenKnowledgeIds = this.#seenKnowledgeIds.get(targetId) ?? new Set();
    this.#busy = true;
    this.callbacks.onNotice(
      intent === 'conversation' ? 'AURA is considering your question…' : 'Opening channel…',
    );

    try {
      const response = await this.api.requestDialogue({
        targetId,
        questId: options.questId,
        playerMessage: options.playerMessage,
        intent,
        excludedKnowledgeIds:
          intent === 'conversation' ? undefined : [...seenKnowledgeIds],
        history: intent === 'conversation' ? history.slice(-8) : undefined,
      });

      if (playbackGeneration !== this.#playbackGeneration) {
        return false;
      }

      if (intent !== 'conversation') {
        for (const reference of response.grounding) {
          seenKnowledgeIds.add(reference.knowledgeId);
        }
        this.#seenKnowledgeIds.set(targetId, seenKnowledgeIds);
      }

      const updatedHistory = [...history];
      if (options.playerMessage) {
        updatedHistory.push({ role: 'player', text: options.playerMessage });
      }
      updatedHistory.push({ role: 'aura', text: response.text });
      this.#history.set(targetId, updatedHistory.slice(-8));

      this.callbacks.onDialogue(response);
      this.callbacks.onNotice('Channel connected. Requesting voice…');
      void this.#speak(response, playbackGeneration);
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

  interruptSpeech(): void {
    this.#playbackGeneration += 1;
    try {
      this.#audioSource?.stop();
    } catch {
      // The source may already have ended.
    }
    this.#audioSource = undefined;
  }

  async #speak(
    dialogue: DialogueResponse,
    playbackGeneration: number,
  ): Promise<void> {
    try {
      const blob = await this.api.requestSpeech({
        text: dialogue.text,
        voiceId: dialogue.voiceId,
      });

      if (playbackGeneration !== this.#playbackGeneration) {
        return;
      }

      const context = this.#audioContext ?? new AudioContext();
      this.#audioContext = context;
      await context.resume();
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      if (playbackGeneration !== this.#playbackGeneration) {
        return;
      }

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
