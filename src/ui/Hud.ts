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

  updateTelemetry(speed: number, contact: NearbyContact | undefined): void {
    this.#speed.textContent = `${speed.toFixed(1)} u/s`;
    this.#target.textContent = contact?.name.toUpperCase() ?? 'NONE';
    this.#distance.textContent = contact ? `${contact.distance.toFixed(0)} u` : '—';
    this.#prompt.hidden = !contact?.inRange;
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
}
