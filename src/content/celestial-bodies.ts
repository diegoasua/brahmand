export interface NpcDefinition {
  openingLine: string;
  voiceId: string;
  knowledgeIds: readonly string[];
}

export interface CelestialBodyDefinition {
  id: string;
  name: string;
  kind: 'star' | 'planet' | 'moon';
  displayPosition: readonly [number, number, number];
  displayRadius: number;
  color: number;
  rotationRadiansPerSecond: number;
  interactionRange: number;
  npc: NpcDefinition;
}

// These are artistic commissioning-scene units, not physical scale.
export const celestialBodies = [
  {
    id: 'earth',
    name: 'Earth',
    kind: 'planet',
    displayPosition: [0, 0, 0],
    displayRadius: 16,
    color: 0x3977c5,
    rotationRadiansPerSecond: 0.025,
    interactionRange: 42,
    npc: {
      openingLine: 'Earth navigation beacon online.',
      voiceId: 'Ashley',
      knowledgeIds: ['earth-atmosphere-composition'],
    },
  },
  {
    id: 'moon',
    name: 'Moon',
    kind: 'moon',
    displayPosition: [70, 8, -26],
    displayRadius: 5,
    color: 0xa8adb5,
    rotationRadiansPerSecond: 0.009,
    interactionRange: 24,
    npc: {
      openingLine: 'Lunar relay connected.',
      voiceId: 'Dennis',
      knowledgeIds: ['moon-synchronous-rotation'],
    },
  },
  {
    id: 'mars',
    name: 'Mars',
    kind: 'planet',
    displayPosition: [420, 35, -330],
    displayRadius: 10,
    color: 0xb85f3d,
    rotationRadiansPerSecond: 0.024,
    interactionRange: 34,
    npc: {
      openingLine: 'Mars science relay receiving.',
      voiceId: 'Ronald',
      knowledgeIds: ['mars-day-length'],
    },
  },
  {
    id: 'sun',
    name: 'Sun',
    kind: 'star',
    displayPosition: [-680, 130, -520],
    displayRadius: 75,
    color: 0xffc85c,
    rotationRadiansPerSecond: 0.004,
    interactionRange: 115,
    npc: {
      openingLine: 'Heliophysics observatory channel established.',
      voiceId: 'Dennis',
      knowledgeIds: ['sun-system-mass'],
    },
  },
] as const satisfies readonly CelestialBodyDefinition[];
