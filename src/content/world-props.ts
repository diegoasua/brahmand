import type { ModelAssetDefinition } from './assets';
import type { CelestialBodyId } from './celestial-bodies';

export type StoryRegion =
  | 'earth-orbit'
  | 'engineering'
  | 'ecosystem'
  | 'memory-core'
  | 'deep-space';

export interface WorldPropDefinition {
  id: string;
  name: string;
  region: StoryRegion;
  model: ModelAssetDefinition;
  displayPosition: readonly [number, number, number];
  displayRotation: readonly [number, number, number];
  rotationRadiansPerSecond?: readonly [number, number, number];
  orbit?: WorldOrbitDefinition;
  bob?: {
    amplitude: number;
    radiansPerSecond: number;
    phase: number;
  };
  interaction?: {
    name: string;
    classification: string;
    range: number;
    knowledgeIds: readonly string[];
  };
}

export interface WorldOrbitDefinition {
  targetId: CelestialBodyId;
  semiMajorAxis: number;
  eccentricity: number;
  inclinationDegrees: number;
  ascendingNodeDegrees: number;
  meanAnomalyRadians: number;
  /** Compressed gameplay motion, not a real-time orbital period. */
  meanMotionRadiansPerSecond: number;
  /** Keeps authored installations assembled while their shared center orbits. */
  formationOffset?: readonly [number, number, number];
}

export interface WorldRegionLightDefinition {
  color: number;
  intensity: number;
  distance: number;
  position: readonly [number, number, number];
  anchorPropId?: string;
}

interface OrbitalFormation {
  origin: readonly [number, number, number];
  orbit: Omit<WorldOrbitDefinition, 'formationOffset'>;
}

const generatedMaterial = {
  metalness: 0.1,
  roughness: 0.68,
} as const;

function model(
  filename: string,
  targetSize: number,
  anchor: ModelAssetDefinition['anchor'] = 'base',
): ModelAssetDefinition {
  return {
    url: `/assets/assets_glb/${filename}.glb`,
    targetSize,
    rotation: [0, 0, 0],
    anchor,
    material: generatedMaterial,
  };
}

const orbitalFormations = {
  engineering: {
    origin: [-81, 5, -63],
    orbit: {
      targetId: 'earth',
      semiMajorAxis: 106,
      eccentricity: 0.02,
      inclinationDegrees: 7,
      ascendingNodeDegrees: 0,
      meanAnomalyRadians: 3.8,
      meanMotionRadiansPerSecond: 0.006,
    },
  },
  ecosystem: {
    origin: [510, 0, -425],
    orbit: {
      targetId: 'mars',
      semiMajorAxis: 145,
      eccentricity: 0.04,
      inclinationDegrees: 18,
      ascendingNodeDegrees: 65,
      meanAnomalyRadians: 0.35,
      meanMotionRadiansPerSecond: 0.004,
    },
  },
  'memory-core': {
    origin: [1535, 88, -1130],
    orbit: {
      targetId: 'saturn',
      semiMajorAxis: 240,
      eccentricity: 0.06,
      inclinationDegrees: 25,
      ascendingNodeDegrees: 115,
      meanAnomalyRadians: 1.1,
      meanMotionRadiansPerSecond: 0.0024,
    },
  },
} as const satisfies Record<string, OrbitalFormation>;

const novaLunarOrbit = {
  targetId: 'moon',
  semiMajorAxis: 24,
  eccentricity: 0.03,
  inclinationDegrees: 35,
  ascendingNodeDegrees: 210,
  meanAnomalyRadians: 2.6,
  meanMotionRadiansPerSecond: 0.018,
} as const satisfies WorldOrbitDefinition;

// These placements are artistic game units. Fictional infrastructure is kept in
// clearly separated encounter clusters and is not meant to imply real orbital scale.
const authoredWorldProps: readonly WorldPropDefinition[] = [
  // Chapter 1: an exposed 2147 orbital engineering corridor near Earth.
  {
    id: 'engineering-floor-tile',
    name: 'Engineering platform',
    region: 'engineering',
    model: model('ch1_modular_floortile', 18),
    displayPosition: [-80, 4, -72],
    displayRotation: [0, 0, 0],
  },
  {
    id: 'engineering-wall-panel',
    name: 'Power-bus wall panel',
    region: 'engineering',
    model: model('ch1_modular_wallpanel', 16),
    displayPosition: [-92, 5, -72],
    displayRotation: [0, 15, 0],
  },
  {
    id: 'engineering-door-frame',
    name: 'Service frame',
    region: 'engineering',
    model: model('ch1_modular_doorframe', 11),
    displayPosition: [-69, 5, -72],
    displayRotation: [0, -15, 0],
  },
  {
    id: 'engineering-ceiling-beam',
    name: 'Assembly-yard beam',
    region: 'engineering',
    model: model('ch1_modular_ceilingbeam', 18, 'center'),
    displayPosition: [-81, 19, -72],
    displayRotation: [0, 0, 0],
  },
  {
    id: 'engineering-conduit',
    name: 'Power conduit',
    region: 'engineering',
    model: model('ch1_modular_conduitpipe', 11, 'center'),
    displayPosition: [-91, 10, -63],
    displayRotation: [0, 0, 15],
  },
  {
    id: 'engineering-reactor-core',
    name: 'Diagnostic reactor core',
    region: 'engineering',
    model: model('ch1_prop_reactorcore', 14),
    displayPosition: [-81, 5, -59],
    displayRotation: [0, 0, 0],
    rotationRadiansPerSecond: [0, 0.08, 0],
  },
  {
    id: 'engineering-sample-pedestal',
    name: 'Material sample pedestal',
    region: 'engineering',
    model: model('ch1_prop_samplepedestal', 4),
    displayPosition: [-92, 5, -55],
    displayRotation: [0, 20, 0],
  },
  {
    id: 'engineering-aluminium-sample',
    name: 'Aluminium sample',
    region: 'engineering',
    model: model('ch1_prop_aluminiumsample', 3, 'center'),
    displayPosition: [-95, 9, -53],
    displayRotation: [12, 0, -8],
    rotationRadiansPerSecond: [0.04, 0.14, 0],
    bob: { amplitude: 0.35, radiansPerSecond: 1, phase: 0 },
  },
  {
    id: 'engineering-copper-sample',
    name: 'Copper sample',
    region: 'engineering',
    model: model('ch1_prop_coppersample', 3, 'center'),
    displayPosition: [-89, 9, -53],
    displayRotation: [-8, 18, 0],
    rotationRadiansPerSecond: [0, 0.16, 0.03],
    bob: { amplitude: 0.35, radiansPerSecond: 1, phase: 1.5 },
  },
  {
    id: 'engineering-glass-sample',
    name: 'Glass sample',
    region: 'engineering',
    model: model('ch1_prop_glasssample', 3, 'center'),
    displayPosition: [-95, 9, -59],
    displayRotation: [10, -15, 5],
    rotationRadiansPerSecond: [0.02, 0.12, 0],
    bob: { amplitude: 0.35, radiansPerSecond: 1, phase: 3 },
  },
  {
    id: 'engineering-rubber-sample',
    name: 'Rubber sample',
    region: 'engineering',
    model: model('ch1_prop_rubbersample', 3, 'center'),
    displayPosition: [-89, 9, -59],
    displayRotation: [-10, 0, 12],
    rotationRadiansPerSecond: [0, 0.1, 0.02],
    bob: { amplitude: 0.35, radiansPerSecond: 1, phase: 4.5 },
  },
  {
    id: 'engineering-conductivity-tester',
    name: 'Conductivity tester',
    region: 'engineering',
    model: model('ch1_prop_conductivitytester', 5),
    displayPosition: [-81, 5, -50],
    displayRotation: [0, -18, 0],
  },
  {
    id: 'engineering-busbar',
    name: 'Electrical bus bar',
    region: 'engineering',
    model: model('ch1_prop_busbar', 4, 'center'),
    displayPosition: [-74, 8, -53],
    displayRotation: [0, 25, 8],
  },
  {
    id: 'engineering-energy-crystal',
    name: 'Reactor energy crystal',
    region: 'engineering',
    model: model('ch1_prop_energycrystal', 6, 'center'),
    displayPosition: [-70, 10, -60],
    displayRotation: [0, 0, 0],
    rotationRadiansPerSecond: [0, 0.18, 0],
    bob: { amplitude: 0.6, radiansPerSecond: 0.7, phase: 0.5 },
  },

  // Chapter 2: a fictional orbital ecosystem test array near Mars.
  {
    id: 'ecosystem-pylon',
    name: 'Ecosystem control pylon',
    region: 'ecosystem',
    model: model('ch2_prop_pylon', 18),
    displayPosition: [510, 0, -420],
    displayRotation: [0, 0, 0],
  },
  {
    id: 'ecosystem-field-workbench',
    name: 'Field laboratory workbench',
    region: 'ecosystem',
    model: model('ch2_prop_fieldworkbench', 12),
    displayPosition: [493, 0, -419],
    displayRotation: [0, 18, 0],
  },
  {
    id: 'ecosystem-reaction-chamber',
    name: 'Reaction chamber',
    region: 'ecosystem',
    model: model('ch2_prop_reactionchamber', 11),
    displayPosition: [526, 0, -420],
    displayRotation: [0, -12, 0],
  },
  {
    id: 'ecosystem-root-conduit',
    name: 'Root conduit',
    region: 'ecosystem',
    model: model('ch2_prop_rootconduit', 12),
    displayPosition: [510, 0, -435],
    displayRotation: [0, 28, 0],
  },
  {
    id: 'ecosystem-grass',
    name: 'Bioluminescent grass',
    region: 'ecosystem',
    model: model('ch2_prop_plant_grass', 7),
    displayPosition: [491, 0, -438],
    displayRotation: [0, -20, 0],
  },
  {
    id: 'ecosystem-mushrooms',
    name: 'Bioluminescent mushrooms',
    region: 'ecosystem',
    model: model('ch2_prop_plant_mushroom', 6),
    displayPosition: [500, 0, -443],
    displayRotation: [0, 34, 0],
  },
  {
    id: 'ecosystem-plant-stem',
    name: 'Bioluminescent stem',
    region: 'ecosystem',
    model: model('ch2_prop_plant_stem', 8),
    displayPosition: [520, 0, -440],
    displayRotation: [0, -30, 0],
  },
  {
    id: 'ecosystem-spore-particle',
    name: 'Drifting spore cluster',
    region: 'ecosystem',
    model: model('ch2_prop_sporeparticle', 8, 'center'),
    displayPosition: [512, 10, -441],
    displayRotation: [10, 0, 0],
    rotationRadiansPerSecond: [0.02, 0.12, 0.03],
    bob: { amplitude: 1.2, radiansPerSecond: 0.5, phase: 2 },
  },
  {
    id: 'ecosystem-bauxite-ore',
    name: 'Bauxite ore sample',
    region: 'ecosystem',
    model: model('ch2_prop_bauxiteore', 4, 'center'),
    displayPosition: [489, 5, -409],
    displayRotation: [14, 20, 0],
    rotationRadiansPerSecond: [0.03, 0.1, 0],
  },
  {
    id: 'ecosystem-soil-core',
    name: 'Soil core sample',
    region: 'ecosystem',
    model: model('ch2_prop_soilcoresample', 4, 'center'),
    displayPosition: [496, 5, -409],
    displayRotation: [-10, 0, 12],
    rotationRadiansPerSecond: [0, 0.1, 0],
  },
  {
    id: 'ecosystem-sample-container',
    name: 'Sample container',
    region: 'ecosystem',
    model: model('ch2_prop_samplecontainer', 4),
    displayPosition: [503, 0, -407],
    displayRotation: [0, 25, 0],
  },

  // Chapter 3: a remote fictional archive installation beyond Saturn.
  {
    id: 'memory-doorway-arch',
    name: 'Archive doorway',
    region: 'memory-core',
    model: model('ch3_prop_doorwayarch', 25),
    displayPosition: [1510, 88, -1130],
    displayRotation: [0, 18, 0],
  },
  {
    id: 'memory-core',
    name: 'Ancient memory core',
    region: 'memory-core',
    model: model('ch3_prop_memorycore', 30),
    displayPosition: [1535, 88, -1130],
    displayRotation: [0, 0, 0],
    rotationRadiansPerSecond: [0, 0.025, 0],
  },
  {
    id: 'memory-face-sculpture',
    name: 'Fragmented face sculpture',
    region: 'memory-core',
    model: model('ch3_prop_facesculpture', 28, 'center'),
    displayPosition: [1565, 113, -1130],
    displayRotation: [0, -22, 0],
    bob: { amplitude: 1.1, radiansPerSecond: 0.35, phase: 1 },
  },
  {
    id: 'memory-shard',
    name: 'Memory shard',
    region: 'memory-core',
    model: model('ch3_prop_memoryshard', 7, 'center'),
    displayPosition: [1525, 111, -1110],
    displayRotation: [18, 0, 12],
    rotationRadiansPerSecond: [0.04, 0.13, 0.03],
    bob: { amplitude: 0.8, radiansPerSecond: 0.6, phase: 0 },
  },
  {
    id: 'memory-knowledge-node',
    name: 'Knowledge node',
    region: 'memory-core',
    model: model('ch3_prop_knowledgenode', 7, 'center'),
    displayPosition: [1545, 115, -1110],
    displayRotation: [0, 0, 0],
    rotationRadiansPerSecond: [0, -0.16, 0],
    bob: { amplitude: 0.9, radiansPerSecond: 0.5, phase: 2 },
  },
  {
    id: 'memory-core-key',
    name: 'Core key',
    region: 'memory-core',
    model: model('ch3_prop_corekey', 5, 'center'),
    displayPosition: [1538, 107, -1103],
    displayRotation: [0, 18, 25],
    rotationRadiansPerSecond: [0, 0.12, 0],
  },
  {
    id: 'memory-shard-debris',
    name: 'Floating archive debris',
    region: 'memory-core',
    model: model('ch3_prop_floatingsharddebris', 8, 'center'),
    displayPosition: [1552, 116, -1100],
    displayRotation: [28, 0, -16],
    rotationRadiansPerSecond: [0.05, -0.08, 0.04],
    bob: { amplitude: 1.3, radiansPerSecond: 0.4, phase: 4 },
  },

  // Character models currently act as story-presence holograms in the flight map.
  {
    id: 'character-aura',
    name: 'AURA hologram',
    region: 'engineering',
    model: model('ch4_char_aura', 6),
    displayPosition: [-80, 5, -46],
    displayRotation: [0, 180, 0],
    bob: { amplitude: 0.45, radiansPerSecond: 0.8, phase: 0 },
  },
  {
    id: 'character-luna',
    name: 'LUNA laboratory avatar',
    region: 'ecosystem',
    model: model('ch4_char_luna', 4.5, 'center'),
    displayPosition: [485, 8, -405],
    displayRotation: [0, 150, 0],
    bob: { amplitude: 0.55, radiansPerSecond: 1, phase: 1 },
  },
  {
    id: 'character-orion',
    name: 'Orion science avatar',
    region: 'memory-core',
    model: model('ch4_char_orion', 7.5),
    displayPosition: [1511, 88, -1115],
    displayRotation: [0, 160, 0],
  },
  {
    id: 'character-nova',
    name: 'NOVA navigation avatar',
    region: 'earth-orbit',
    model: model('ch4_char_nova', 6),
    displayPosition: [25, 14, 15],
    displayRotation: [0, -145, 0],
    bob: { amplitude: 0.5, radiansPerSecond: 0.75, phase: 2 },
  },

  // Chapter 5: recognizable space infrastructure and small-body fields.
  {
    id: 'earth-orbit-iss',
    name: 'International Space Station archive',
    region: 'earth-orbit',
    model: model('ch5_prop_issstation', 14, 'center'),
    displayPosition: [46, 32, -62],
    displayRotation: [12, 28, 8],
    rotationRadiansPerSecond: [0, 0.006, 0],
    interaction: {
      name: 'International Space Station',
      classification: 'historical orbital research station',
      range: 28,
      knowledgeIds: [
        'iss-orbit',
        'iss-orbital-period',
        'iss-microgravity-laboratory',
        'iss-international-partnership',
      ],
    },
    orbit: {
      targetId: 'earth',
      semiMajorAxis: 62,
      eccentricity: 0,
      inclinationDegrees: 51.6,
      ascendingNodeDegrees: 18,
      meanAnomalyRadians: 0.9,
      meanMotionRadiansPerSecond: 0.055,
    },
  },
  {
    id: 'earth-satellite-1',
    name: 'Earth observation satellite',
    region: 'earth-orbit',
    model: model('ch5_prop_satellite1', 3.5, 'center'),
    displayPosition: [-38, 26, 8],
    displayRotation: [8, -20, 22],
    rotationRadiansPerSecond: [0, 0.025, 0],
    orbit: {
      targetId: 'earth',
      semiMajorAxis: 50,
      eccentricity: 0.02,
      inclinationDegrees: 82,
      ascendingNodeDegrees: 70,
      meanAnomalyRadians: 2.4,
      meanMotionRadiansPerSecond: 0.042,
    },
  },
  {
    id: 'earth-satellite-2',
    name: 'Communications satellite',
    region: 'earth-orbit',
    model: model('ch5_prop_satellite2', 3.5, 'center'),
    displayPosition: [76, -15, 25],
    displayRotation: [-12, 35, 0],
    rotationRadiansPerSecond: [0.01, -0.022, 0],
    orbit: {
      targetId: 'earth',
      semiMajorAxis: 74,
      eccentricity: 0.05,
      inclinationDegrees: 18,
      ascendingNodeDegrees: 135,
      meanAnomalyRadians: 4.1,
      meanMotionRadiansPerSecond: 0.03,
    },
  },
  {
    id: 'earth-satellite-3',
    name: 'Navigation satellite',
    region: 'earth-orbit',
    model: model('ch5_prop_satellite3', 3.5, 'center'),
    displayPosition: [98, 31, -56],
    displayRotation: [18, 15, -14],
    rotationRadiansPerSecond: [0, 0.02, 0.01],
    orbit: {
      targetId: 'earth',
      semiMajorAxis: 92,
      eccentricity: 0.03,
      inclinationDegrees: 56,
      ascendingNodeDegrees: 245,
      meanAnomalyRadians: 5.3,
      meanMotionRadiansPerSecond: 0.024,
    },
  },
  {
    id: 'asteroid-1',
    name: 'Asteroid A1',
    region: 'deep-space',
    model: model('ch5_prop_asteroid1', 20, 'center'),
    displayPosition: [620, 30, -470],
    displayRotation: [18, 32, -12],
    rotationRadiansPerSecond: [0.018, 0.03, 0.01],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 1220,
      eccentricity: 0.04,
      inclinationDegrees: 3,
      ascendingNodeDegrees: 12,
      meanAnomalyRadians: 0.2,
      meanMotionRadiansPerSecond: 0.0018,
    },
  },
  {
    id: 'asteroid-2',
    name: 'Asteroid A2',
    region: 'deep-space',
    model: model('ch5_prop_asteroid2', 26, 'center'),
    displayPosition: [660, -40, -510],
    displayRotation: [-20, 5, 16],
    rotationRadiansPerSecond: [0.012, -0.024, 0.018],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 1300,
      eccentricity: 0.08,
      inclinationDegrees: 7,
      ascendingNodeDegrees: 54,
      meanAnomalyRadians: 0.48,
      meanMotionRadiansPerSecond: 0.00165,
    },
  },
  {
    id: 'asteroid-3',
    name: 'Asteroid A3',
    region: 'deep-space',
    model: model('ch5_prop_asteroid3', 18, 'center'),
    displayPosition: [700, 55, -545],
    displayRotation: [8, -28, 24],
    rotationRadiansPerSecond: [-0.015, 0.028, 0.012],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 1375,
      eccentricity: 0.06,
      inclinationDegrees: 11,
      ascendingNodeDegrees: 98,
      meanAnomalyRadians: 0.72,
      meanMotionRadiansPerSecond: 0.0015,
    },
  },
  {
    id: 'asteroid-4',
    name: 'Asteroid A4',
    region: 'deep-space',
    model: model('ch5_prop_asteroid4', 32, 'center'),
    displayPosition: [742, -15, -580],
    displayRotation: [25, 12, -18],
    rotationRadiansPerSecond: [0.01, 0.018, -0.015],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 1450,
      eccentricity: 0.11,
      inclinationDegrees: 5,
      ascendingNodeDegrees: 160,
      meanAnomalyRadians: 0.95,
      meanMotionRadiansPerSecond: 0.00138,
    },
  },
  {
    id: 'asteroid-5',
    name: 'Asteroid A5',
    region: 'deep-space',
    model: model('ch5_prop_asteroid5', 24, 'center'),
    displayPosition: [790, 70, -620],
    displayRotation: [-12, 40, 10],
    rotationRadiansPerSecond: [-0.012, -0.02, 0.017],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 1540,
      eccentricity: 0.09,
      inclinationDegrees: 14,
      ascendingNodeDegrees: 220,
      meanAnomalyRadians: 1.18,
      meanMotionRadiansPerSecond: 0.00125,
    },
  },
  {
    id: 'comet-1',
    name: 'Outer-system comet C1',
    region: 'deep-space',
    model: model('ch5_prop_comet1', 28, 'center'),
    displayPosition: [1870, 320, -1030],
    displayRotation: [18, -35, 12],
    rotationRadiansPerSecond: [0.004, 0.008, 0],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 2100,
      eccentricity: 0.7,
      inclinationDegrees: 28,
      ascendingNodeDegrees: 32,
      meanAnomalyRadians: 1.3,
      meanMotionRadiansPerSecond: 0.00072,
    },
  },
  {
    id: 'comet-2',
    name: 'Outer-system comet C2',
    region: 'deep-space',
    model: model('ch5_prop_comet2', 34, 'center'),
    displayPosition: [2700, -280, -1450],
    displayRotation: [-15, 22, -8],
    rotationRadiansPerSecond: [0.003, -0.007, 0.002],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 2900,
      eccentricity: 0.82,
      inclinationDegrees: 61,
      ascendingNodeDegrees: 148,
      meanAnomalyRadians: 2.8,
      meanMotionRadiansPerSecond: 0.00046,
    },
  },
  {
    id: 'comet-3',
    name: 'Kuiper-region comet C3',
    region: 'deep-space',
    model: model('ch5_prop_comet3', 30, 'center'),
    displayPosition: [3320, 280, -2080],
    displayRotation: [24, 15, 18],
    rotationRadiansPerSecond: [-0.004, 0.006, 0],
    orbit: {
      targetId: 'sun',
      semiMajorAxis: 4200,
      eccentricity: 0.9,
      inclinationDegrees: 104,
      ascendingNodeDegrees: 275,
      meanAnomalyRadians: 4.5,
      meanMotionRadiansPerSecond: 0.00028,
    },
  },

  // Navigation furniture is attached to the exposed engineering platform.
  {
    id: 'engineering-mission-console',
    name: 'Mission console',
    region: 'engineering',
    model: model('ch6_prop_missionconsole', 8),
    displayPosition: [-63, 5, -63],
    displayRotation: [0, -30, 0],
  },
  {
    id: 'engineering-star-chart',
    name: 'Holographic star chart',
    region: 'engineering',
    model: model('ch6_prop_starcharttable', 7),
    displayPosition: [-61, 5, -76],
    displayRotation: [0, 20, 0],
    rotationRadiansPerSecond: [0, 0.02, 0],
  },
];

export const worldProps: readonly WorldPropDefinition[] = authoredWorldProps.map(
  (definition) => ({
    ...definition,
    orbit: definition.orbit ?? assignedOrbit(definition),
  }),
);

function assignedOrbit(definition: WorldPropDefinition): WorldOrbitDefinition {
  if (definition.id === 'character-nova') {
    return novaLunarOrbit;
  }

  const formation =
    definition.region === 'engineering' ||
    definition.region === 'ecosystem' ||
    definition.region === 'memory-core'
      ? orbitalFormations[definition.region]
      : undefined;
  if (!formation) {
    throw new Error(`World prop ${definition.id} needs an orbital assignment.`);
  }

  const formationOffset: readonly [number, number, number] = [
    definition.displayPosition[0] - formation.origin[0],
    definition.displayPosition[1] - formation.origin[1],
    definition.displayPosition[2] - formation.origin[2],
  ];
  return { ...formation.orbit, formationOffset };
}

export const worldRegionLights = [
  {
    color: 0x55dff6,
    intensity: 3.2,
    distance: 170,
    position: [0, 21, 12],
    anchorPropId: 'engineering-floor-tile',
  },
  {
    color: 0x69f2c2,
    intensity: 3,
    distance: 180,
    position: [0, 22, -5],
    anchorPropId: 'ecosystem-pylon',
  },
  {
    color: 0xffc45d,
    intensity: 4,
    distance: 210,
    position: [0, 37, 0],
    anchorPropId: 'memory-core',
  },
  {
    color: 0xb8e8ff,
    intensity: 2.2,
    distance: 150,
    position: [-1, 10, 17],
    anchorPropId: 'earth-orbit-iss',
  },
] as const satisfies readonly WorldRegionLightDefinition[];
