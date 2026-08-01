import type { ModelAssetId } from './assets';

export interface NpcDefinition {
  knowledgeIds: readonly string[];
}

export interface CelestialBodyDefinition {
  id: string;
  name: string;
  kind: 'star' | 'planet' | 'dwarf-planet' | 'moon';
  displayPosition: readonly [number, number, number];
  displayRadius: number;
  color: number;
  rotationRadiansPerSecond: number;
  interactionRange: number;
  modelAssetId?: ModelAssetId;
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
    modelAssetId: 'earth',
    npc: {
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
      knowledgeIds: ['moon-synchronous-rotation'],
    },
  },
  {
    id: 'venus',
    name: 'Venus',
    kind: 'planet',
    displayPosition: [-250, -25, -180],
    displayRadius: 14.5,
    color: 0xd7aa65,
    rotationRadiansPerSecond: -0.006,
    interactionRange: 42,
    modelAssetId: 'venus',
    npc: {
      knowledgeIds: ['venus-runaway-greenhouse'],
    },
  },
  {
    id: 'mercury',
    name: 'Mercury',
    kind: 'planet',
    displayPosition: [-460, 55, -390],
    displayRadius: 5,
    color: 0x9d978e,
    rotationRadiansPerSecond: 0.008,
    interactionRange: 25,
    modelAssetId: 'mercury',
    npc: {
      knowledgeIds: ['mercury-smallest-fastest'],
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
    modelAssetId: 'mars',
    npc: {
      knowledgeIds: ['mars-day-length'],
    },
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    kind: 'planet',
    displayPosition: [900, -80, -700],
    displayRadius: 35,
    color: 0xc6a47c,
    rotationRadiansPerSecond: 0.045,
    interactionRange: 70,
    modelAssetId: 'jupiter',
    npc: {
      knowledgeIds: ['jupiter-largest-fast-rotation'],
    },
  },
  {
    id: 'saturn',
    name: 'Saturn',
    kind: 'planet',
    displayPosition: [1450, 160, -950],
    displayRadius: 44,
    color: 0xd8bf8d,
    rotationRadiansPerSecond: 0.038,
    interactionRange: 82,
    modelAssetId: 'saturn',
    npc: {
      knowledgeIds: ['saturn-ring-composition'],
    },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    kind: 'planet',
    displayPosition: [2050, -140, -1250],
    displayRadius: 20,
    color: 0x8ed7df,
    rotationRadiansPerSecond: -0.026,
    interactionRange: 52,
    modelAssetId: 'uranus',
    npc: {
      knowledgeIds: ['uranus-sideways-rotation'],
    },
  },
  {
    id: 'neptune',
    name: 'Neptune',
    kind: 'planet',
    displayPosition: [2700, 100, -1650],
    displayRadius: 19,
    color: 0x4169b6,
    rotationRadiansPerSecond: 0.028,
    interactionRange: 50,
    modelAssetId: 'neptune',
    npc: {
      knowledgeIds: ['neptune-most-distant-planet'],
    },
  },
  {
    id: 'pluto',
    name: 'Pluto',
    kind: 'dwarf-planet',
    displayPosition: [3400, -200, -2200],
    displayRadius: 4,
    color: 0xb6a28f,
    rotationRadiansPerSecond: -0.012,
    interactionRange: 24,
    modelAssetId: 'pluto',
    npc: {
      knowledgeIds: ['pluto-kuiper-belt-dwarf-planet'],
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
    modelAssetId: 'sun',
    npc: {
      knowledgeIds: ['sun-system-mass'],
    },
  },
] as const satisfies readonly CelestialBodyDefinition[];
