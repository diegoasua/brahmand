import {
  dialogueTargetById,
  type DialogueTargetDefinition,
} from '../../src/content/dialogue-targets';
import {
  type KnowledgeEntry,
  knowledgeById,
} from '../../src/content/knowledge';
import type {
  DialogueRequest,
  GroundingReference,
} from '../../src/shared/contracts';
import { HttpError } from '../http-errors';

export interface DialogueKnowledgeContext {
  target: DialogueTargetDefinition;
  entries: KnowledgeEntry[];
  grounding: GroundingReference[];
}

export function prepareDialogueKnowledge(
  request: DialogueRequest,
  random: () => number,
): DialogueKnowledgeContext {
  const target = dialogueTargetById.get(request.targetId);
  if (!target) {
    throw new HttpError(404, `Unknown dialogue target: ${request.targetId}.`);
  }

  const allEntries = target.knowledgeIds
    .map((id) => knowledgeById.get(id))
    .filter((entry) => entry !== undefined);
  const entries =
    request.intent === 'conversation'
      ? allEntries
      : selectFreshEntry(
          allEntries,
          new Set(request.excludedKnowledgeIds ?? []),
          random,
        );

  return {
    target,
    entries,
    grounding: entries.map(toGroundingReference),
  };
}

export function toGroundingReference(
  entry: KnowledgeEntry,
): GroundingReference {
  return {
    knowledgeId: entry.id,
    title: entry.title,
    sourceLabel: entry.source.label,
    sourceUrl: entry.source.url,
  };
}

function selectFreshEntry(
  entries: KnowledgeEntry[],
  excludedIds: ReadonlySet<string>,
  random: () => number,
): KnowledgeEntry[] {
  const unseenEntries = entries.filter((entry) => !excludedIds.has(entry.id));
  const pool = unseenEntries.length > 0 ? unseenEntries : entries;
  if (pool.length === 0) {
    return [];
  }

  const boundedRandom = Math.min(Math.max(random(), 0), 0.999999999);
  return [pool[Math.floor(boundedRandom * pool.length)] as KnowledgeEntry];
}
