import { describe, expect, it } from 'vitest';
import { CuratedDialogueProvider } from '../server/dialogue/CuratedDialogueProvider';
import { dialogueTargets } from '../src/content/dialogue-targets';

describe('CuratedDialogueProvider', () => {
  it('returns dialogue grounded in the target allowlist', async () => {
    const provider = new CuratedDialogueProvider(() => 0);
    const response = await provider.generate({ targetId: 'earth' });

    expect(response.speakerName).toBe('AURA');
    expect(response.grounding).toEqual([
      expect.objectContaining({ knowledgeId: 'earth-atmosphere-composition' }),
    ]);
    expect(response.text).toContain('78% nitrogen');
  });

  it('rejects unknown targets', async () => {
    const provider = new CuratedDialogueProvider(() => 0);

    await expect(provider.generate({ targetId: 'unknown' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it.each(dialogueTargets)(
    'supports science-grounded interaction with $name',
    async (target) => {
      const provider = new CuratedDialogueProvider(() => 0);
      const response = await provider.generate({ targetId: target.id });

      expect(response.speakerName).toBe('AURA');
      expect(response.grounding).not.toHaveLength(0);
      expect(response.grounding[0]?.knowledgeId).toBe(target.knowledgeIds[0]);
    },
  );

  it('exhausts a target fact pool before repeating one', async () => {
    const provider = new CuratedDialogueProvider(() => 0);
    const seenKnowledgeIds: string[] = [];

    for (let index = 0; index < 3; index += 1) {
      const response = await provider.generate({
        targetId: 'earth',
        intent: 'fact',
        excludedKnowledgeIds: seenKnowledgeIds,
      });
      const knowledgeId = response.grounding[0]?.knowledgeId;
      expect(knowledgeId).toBeDefined();
      seenKnowledgeIds.push(knowledgeId as string);
    }

    expect(new Set(seenKnowledgeIds)).toEqual(
      new Set([
        'earth-atmosphere-composition',
        'earth-surface-water',
        'earth-magnetosphere',
      ]),
    );

    const cycled = await provider.generate({
      targetId: 'earth',
      intent: 'fact',
      excludedKnowledgeIds: seenKnowledgeIds,
    });
    expect(seenKnowledgeIds).toContain(cycled.grounding[0]?.knowledgeId);
  });

  it('supports conversation about the ISS', async () => {
    const provider = new CuratedDialogueProvider(() => 0);
    const response = await provider.generate({
      targetId: 'earth-orbit-iss',
      intent: 'conversation',
      playerMessage: 'Why is its orbit tilted?',
    });

    expect(response.text).toContain('International Space Station');
    expect(response.grounding[0]?.knowledgeId).toBe('iss-orbit');
  });
});
