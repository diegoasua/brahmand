import { describe, expect, it } from 'vitest';
import { CuratedDialogueProvider } from '../server/dialogue/CuratedDialogueProvider';

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
});
