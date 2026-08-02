import type { QuestProgress } from '../domain/quest';
import type { NearbyContact } from '../game/ExplorationScene';
import type {
  DialogueResponse,
  GroundingReference,
} from '../shared/contracts';
import type { VoiceConversationState } from '../services/VoiceConversationController';

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) {
    throw new Error(`Required HUD element #${id} is missing.`);
  }
  return element;
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
  readonly #conversationPanel =
    requireElement<HTMLElement>('conversation-panel');
  readonly #conversationStatus =
    requireElement<HTMLElement>('conversation-status');
  readonly #conversationTarget =
    requireElement<HTMLElement>('conversation-target');
  readonly #conversationLog =
    requireElement<HTMLElement>('conversation-log');
  readonly #conversationSources =
    requireElement<HTMLElement>('conversation-sources');
  #activeConversationTarget = '';

  get isConversationOpen(): boolean {
    return !this.#conversationPanel.hidden;
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
  }

  setNotice(message: string): void {
    this.#notice.textContent = message;
  }

  openConversation(targetName: string): void {
    if (this.#activeConversationTarget !== targetName) {
      this.#conversationLog.replaceChildren();
      this.#conversationLog.hidden = true;
      this.#conversationSources.replaceChildren();
      this.#conversationSources.hidden = true;
      this.#activeConversationTarget = targetName;
    }
    this.#conversationTarget.textContent = targetName.toUpperCase();
    this.#conversationPanel.hidden = false;
    this.#prompt.hidden = true;
    this.setConversationState('connecting');
  }

  closeConversation(): void {
    this.#conversationPanel.hidden = true;
    this.#conversationPanel.dataset.state = 'idle';
  }

  setConversationState(state: VoiceConversationState): void {
    this.#conversationPanel.dataset.state = state;
    this.#conversationStatus.textContent = conversationStateLabels[state];
  }

  showConversationTranscript(role: 'player' | 'aura', text: string): void {
    this.#appendConversationTurn(role === 'player' ? 'YOU' : 'AURA', text, role);
  }

  setConversationGrounding(grounding: GroundingReference[]): void {
    this.#conversationSources.replaceChildren();
    const uniqueSources = new Map(
      grounding.map((reference) => [reference.sourceUrl, reference.sourceLabel]),
    );

    for (const [url, label] of uniqueSources) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = label;
      this.#conversationSources.append(link);
    }

    this.#conversationSources.hidden = uniqueSources.size === 0;
  }

  #appendConversationTurn(
    speaker: string,
    text: string,
    role: 'player' | 'aura',
  ): void {
    const line = document.createElement('p');
    line.className = `conversation-panel__turn conversation-panel__turn--${role}`;

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

const conversationStateLabels: Record<VoiceConversationState, string> = {
  idle: 'VOICE LINK IDLE',
  connecting: 'CONNECTING TO AURA…',
  listening: 'LISTENING — ASK A QUESTION',
  hearing: 'HEARING YOU…',
  thinking: 'AURA IS THINKING…',
  speaking: 'AURA IS SPEAKING',
  unavailable: 'VOICE LINK UNAVAILABLE',
};
