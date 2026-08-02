import { celestialBodies } from './celestial-bodies';
import {
  type WorldPropDefinition,
  worldProps,
} from './world-props';

export interface DialogueTargetDefinition {
  id: string;
  name: string;
  classification: string;
  interactionRange: number;
  knowledgeIds: readonly string[];
}

const propDefinitions = worldProps as readonly WorldPropDefinition[];

export const dialogueTargets: readonly DialogueTargetDefinition[] = [
  ...celestialBodies.map((body) => ({
    id: body.id,
    name: body.name,
    classification: body.kind,
    interactionRange: body.interactionRange,
    knowledgeIds: body.npc.knowledgeIds,
  })),
  ...propDefinitions.flatMap((prop) =>
    prop.interaction
      ? [
          {
            id: prop.id,
            name: prop.interaction.name,
            classification: prop.interaction.classification,
            interactionRange: prop.interaction.range,
            knowledgeIds: prop.interaction.knowledgeIds,
          },
        ]
      : [],
  ),
];

export const dialogueTargetById: ReadonlyMap<string, DialogueTargetDefinition> =
  new Map(dialogueTargets.map((target) => [target.id, target]));
