import { describe, expect, it } from 'vitest';
import { celestialBodies } from '../src/content/celestial-bodies';
import { dialogueTargets } from '../src/content/dialogue-targets';
import { knowledgeById } from '../src/content/knowledge';

describe('dialogue targets', () => {
  it('includes every celestial body and the ISS', () => {
    const ids = new Set(dialogueTargets.map((target) => target.id));

    for (const body of celestialBodies) {
      expect(ids.has(body.id)).toBe(true);
    }
    expect(ids.has('earth-orbit-iss')).toBe(true);
    expect(ids.size).toBe(dialogueTargets.length);
  });

  it('provides at least three reviewed facts per contact', () => {
    for (const target of dialogueTargets) {
      expect(target.knowledgeIds.length).toBeGreaterThanOrEqual(3);
      for (const knowledgeId of target.knowledgeIds) {
        expect(knowledgeById.has(knowledgeId)).toBe(true);
      }
    }
  });
});
