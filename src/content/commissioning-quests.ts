import type { QuestDefinition } from '../domain/quest';

// Disposable developer content. The authored story will live in separate chapters.
export const commissioningQuests = [
  {
    id: 'commission-navigation',
    title: 'Approach Earth',
    summary: 'Enter the navigation beacon range to validate local flight controls.',
    objective: { type: 'visited', targetId: 'earth' },
  },
  {
    id: 'commission-dialogue',
    title: 'Open a channel',
    summary: 'Press F near Earth to validate grounded dialogue and optional speech.',
    objective: { type: 'talked', targetId: 'earth' },
  },
] as const satisfies readonly QuestDefinition[];
