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
    title: "Receive AURA's analysis",
    summary: 'Hold observation range while AURA identifies Earth and reports its findings.',
    objective: { type: 'talked', targetId: 'earth' },
  },
] as const satisfies readonly QuestDefinition[];
