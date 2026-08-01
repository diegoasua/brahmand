import { describe, expect, it } from 'vitest';
import { QuestDirector, type QuestDefinition } from '../src/domain/quest';

const sequence = [
  {
    id: 'visit-earth',
    title: 'Visit Earth',
    summary: 'Approach the planet.',
    objective: { type: 'visited', targetId: 'earth' },
  },
  {
    id: 'talk-earth',
    title: 'Talk to Earth',
    summary: 'Open a channel.',
    objective: { type: 'talked', targetId: 'earth' },
  },
] as const satisfies readonly QuestDefinition[];

describe('QuestDirector', () => {
  it('advances only when the current objective is satisfied', () => {
    const director = new QuestDirector(sequence);

    expect(director.record({ type: 'talked', targetId: 'earth' })).toBe(false);
    expect(director.progress.current?.id).toBe('visit-earth');

    expect(director.record({ type: 'visited', targetId: 'earth' })).toBe(true);
    expect(director.progress.current?.id).toBe('talk-earth');
  });

  it('reports completion after the final objective', () => {
    const director = new QuestDirector(sequence);

    director.record({ type: 'visited', targetId: 'earth' });
    director.record({ type: 'talked', targetId: 'earth' });

    expect(director.progress).toEqual({
      current: undefined,
      completedIds: ['visit-earth', 'talk-earth'],
      isComplete: true,
    });
  });

  it('rejects duplicate quest IDs', () => {
    expect(() => new QuestDirector([sequence[0], sequence[0]])).toThrow(
      'Quest IDs must be unique.',
    );
  });
});
