import { auraNarrator } from '../../src/content/narrator';
import type {
  DialogueRequest,
  DialogueResponse,
} from '../../src/shared/contracts';
import type { DialogueProvider } from './DialogueProvider';
import {
  prepareDialogueKnowledge,
  toGroundingReference,
} from './dialogueKnowledge';

export class CuratedDialogueProvider implements DialogueProvider {
  constructor(private readonly random: () => number = Math.random) {}

  async generate(request: DialogueRequest): Promise<DialogueResponse> {
    const intent =
      request.intent ?? (request.playerMessage ? 'conversation' : 'fact');
    const { target, entries } = prepareDialogueKnowledge(
      { ...request, intent },
      this.random,
    );
    const entry = entries[Math.floor(this.random() * entries.length)] ?? entries[0];
    const scienceLine = entry?.summary;

    return {
      speakerId: auraNarrator.id,
      speakerName: auraNarrator.name,
      text: scienceLine
        ? intent === 'conversation' && request.playerMessage
          ? `Here is what our reviewed data confirms about ${target.name}: ${scienceLine}`
          : `${target.name} is within observation range. ${scienceLine}`
        : `${target.name} is within observation range, but reviewed science data is unavailable.`,
      voiceId: auraNarrator.voiceId,
      grounding: entry ? [toGroundingReference(entry)] : [],
    };
  }
}
