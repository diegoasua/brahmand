import { celestialBodies } from '../../src/content/celestial-bodies';
import { knowledgeById } from '../../src/content/knowledge';
import type {
  DialogueRequest,
  DialogueResponse,
  GroundingReference,
} from '../../src/shared/contracts';
import { HttpError } from '../http-errors';
import type { DialogueProvider } from './DialogueProvider';

export class CuratedDialogueProvider implements DialogueProvider {
  async generate(request: DialogueRequest): Promise<DialogueResponse> {
    const character = celestialBodies.find((body) => body.id === request.targetId);

    if (!character) {
      throw new HttpError(404, `Unknown dialogue target: ${request.targetId}.`);
    }

    const entries = character.npc.knowledgeIds
      .map((id) => knowledgeById.get(id))
      .filter((entry) => entry !== undefined);
    const grounding: GroundingReference[] = entries.map((entry) => ({
      knowledgeId: entry.id,
      title: entry.title,
      sourceLabel: entry.source.label,
      sourceUrl: entry.source.url,
    }));
    const scienceLine = entries[0]?.summary;

    return {
      speakerId: character.id,
      speakerName: character.name,
      text: scienceLine
        ? `${character.npc.openingLine} ${scienceLine}`
        : character.npc.openingLine,
      voiceId: character.npc.voiceId,
      grounding,
    };
  }
}
