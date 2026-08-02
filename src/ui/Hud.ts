import type { QuestProgress } from '../domain/quest';
import type { NearbyContact } from '../game/ExplorationScene';
import type { DialogueResponse } from '../shared/contracts';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) {
    throw new Error(`Required HUD element #${id} is missing.`);
  }
  return element;
}

export interface HudCallbacks {
  onConversationSubmit(message: string): void;
  onConversationClose(): void;
}

export class Hud {
  readonly #speed = requireElement<HTMLElement>('speed');
  readonly #target = requireElement<HTMLElement>('target');
  readonly #distance = requireElement<HTMLElement>('distance');
  readonly #questTitle = requireElement<HTMLElement>('quest-title');
  readonly #questSummary = requireElement<HTMLElement>('quest-summary');
  readonly #prompt = requireElement<HTMLElement>('interaction-prompt');
  readonly #dialogue = requireElement<HTMLElement>('dialogue');
  readonly #speaker = requireElement<HTMLElement>('speaker');
  readonly #dialogueText = requireElement<HTMLElement>('dialogue-text');
  readonly #scienceSource = requireElement<HTMLAnchorElement>('science-source');
  readonly #notice = requireElement<HTMLElement>('notice');
  readonly #conversationForm =
    requireElement<HTMLFormElement>('conversation-form');
  readonly #conversationInput =
    requireElement<HTMLInputElement>('conversation-input');
  readonly #conversationTarget =
    requireElement<HTMLElement>('conversation-target');
  readonly #conversationLog =
    requireElement<HTMLElement>('conversation-log');
  #activeConversationTarget = '';

  constructor(private readonly callbacks: HudCallbacks) {
    this.#conversationForm.addEventListener('submit', this.#onConversationSubmit);
    this.#conversationForm.addEventListener('keydown', this.#onConversationKeyDown);
  }

  get isConversationOpen(): boolean {
    return !this.#conversationForm.hidden;
  }

  updateTelemetry(speed: number, contact: NearbyContact | undefined): void {
    this.#speed.textContent = `${speed.toFixed(1)} u/s`;
    this.#target.textContent = contact?.name.toUpperCase() ?? 'NONE';
    this.#distance.textContent = contact ? `${contact.distance.toFixed(0)} u` : '—';
    this.#prompt.hidden = this.isConversationOpen || !contact?.inRange;
  }

  updateQuest(progress: QuestProgress): void {
    if (progress.current) {
      this.#questTitle.textContent = progress.current.title;
      this.#questSummary.textContent = progress.current.summary;
      return;
    }

    this.#questTitle.textContent = 'Systems check complete';
    this.#questSummary.textContent =
      'The scaffold is ready for authored chapters, assets, and expanded systems.';
  }

  showDialogue(response: DialogueResponse): void {
    this.#dialogue.hidden = false;
    this.#speaker.textContent = response.speakerName;
    this.#dialogueText.textContent = response.text;

    const grounding = response.grounding[0];
    this.#scienceSource.hidden = !grounding;
    if (grounding) {
      this.#scienceSource.textContent = `Science source: ${grounding.sourceLabel}`;
      this.#scienceSource.href = grounding.sourceUrl;
    }

    if (this.isConversationOpen) {
      this.#appendConversationTurn('AURA', response.text, 'aura');
    }
  }

  setNotice(message: string): void {
    this.#notice.textContent = message;
  }

  openConversation(targetName: string): void {
    if (this.#activeConversationTarget !== targetName) {
      this.#conversationLog.replaceChildren();
      this.#conversationLog.hidden = true;
      this.#activeConversationTarget = targetName;
    }
    this.#conversationTarget.textContent = targetName.toUpperCase();
    this.#conversationForm.hidden = false;
    this.#prompt.hidden = true;
    requestAnimationFrame(() => this.#conversationInput.focus());
  }

  closeConversation(): void {
    this.#conversationForm.hidden = true;
    this.#conversationInput.value = '';
    this.#conversationInput.blur();
  }

  dispose(): void {
    this.#conversationForm.removeEventListener(
      'submit',
      this.#onConversationSubmit,
    );
    this.#conversationForm.removeEventListener(
      'keydown',
      this.#onConversationKeyDown,
    );
  }

  readonly #onConversationSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    const message = this.#conversationInput.value.trim();
    if (!message) {
      return;
    }

    this.#conversationInput.value = '';
    this.#appendConversationTurn('YOU', message, 'player');
    this.callbacks.onConversationSubmit(message);
  };

  readonly #onConversationKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    this.closeConversation();
    this.callbacks.onConversationClose();
  };

  #appendConversationTurn(
    speaker: string,
    text: string,
    role: 'player' | 'aura',
  ): void {
    const line = document.createElement('p');
    line.className = `conversation-form__turn conversation-form__turn--${role}`;

    const label = document.createElement('strong');
    label.textContent = `${speaker}: `;
    line.append(label, document.createTextNode(text));
    this.#conversationLog.append(line);

    while (this.#conversationLog.childElementCount > 8) {
      this.#conversationLog.firstElementChild?.remove();
    }

    this.#conversationLog.hidden = false;
    this.#conversationLog.scrollTop = this.#conversationLog.scrollHeight;
  }
}
