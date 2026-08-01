import { describe, expect, it } from 'vitest';
import { CuratedDialogueProvider } from '../server/dialogue/CuratedDialogueProvider';
import { celestialBodies } from '../src/content/celestial-bodies';

describe('CuratedDialogueProvider', () => {
  it('returns dialogue grounded in the target allowlist', async () => {
    const provider = new CuratedDialogueProvider();
    const response = await provider.generate({ targetId: 'earth' });

    expect(response.speakerName).toBe('AURA');
    expect(response.grounding).toEqual([
      expect.objectContaining({ knowledgeId: 'earth-atmosphere-composition' }),
    ]);
    expect(response.text).toContain('78% nitrogen');
  });

  it('rejects unknown targets', async () => {
    const provider = new CuratedDialogueProvider();

    await expect(provider.generate({ targetId: 'unknown' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it.each(celestialBodies)(
    'supports science-grounded interaction with $name',
    async (body) => {
      const provider = new CuratedDialogueProvider();
      const response = await provider.generate({ targetId: body.id });

      expect(response.speakerName).toBe('AURA');
      expect(response.grounding).not.toHaveLength(0);
      expect(response.grounding[0]?.knowledgeId).toBe(body.npc.knowledgeIds[0]);
    },
  );
});
