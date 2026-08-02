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
  readonly #voiceChat = requireElement<HTMLElement>('voice-chat');
  readonly #voiceChatStatus = requireElement<HTMLElement>('voice-chat-status');
  readonly #voiceChatTranscript = requireElement<HTMLUListElement>('voice-chat-transcript');
  readonly #voiceChatLines = new Map<'PLAYER' | 'AURA', HTMLLIElement>();

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

  showVoiceChat(): void {
    this.#voiceChat.hidden = false;
    this.#voiceChatTranscript.replaceChildren();
    this.#voiceChatLines.clear();
  }

  hideVoiceChat(): void {
    this.#voiceChat.hidden = true;
  }

  setVoiceChatStatus(text: string): void {
    this.#voiceChatStatus.textContent = text;
  }

  appendVoiceChatDelta(speaker: 'PLAYER' | 'AURA', text: string): void {
    let line = this.#voiceChatLines.get(speaker);
    if (!line) {
      line = document.createElement('li');
      line.className =
        speaker === 'AURA' ? 'voice-chat__line--aura' : 'voice-chat__line--player';
      this.#voiceChatTranscript.append(line);
      this.#voiceChatLines.set(speaker, line);
    }
    line.textContent = `${line.textContent ?? ''}${text}`;
    this.#voiceChatTranscript.scrollTop = this.#voiceChatTranscript.scrollHeight;
  }

  completeVoiceChatTurn(speaker: 'PLAYER' | 'AURA'): void {
    this.#voiceChatLines.delete(speaker);
  }
}
