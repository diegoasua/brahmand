export interface ModelAssetDefinition {
  url: string;
  /** Longest rendered dimension in artistic game units. */
  targetSize: number;
  /** Runtime forward is -Z. Rotations adapt authored orientation to that convention. */
  rotation: readonly [number, number, number];
  /** Correct incomplete or unsuitable authored PBR defaults without changing textures. */
  material?: {
    metalness: number;
    roughness: number;
  };
  enginePlumes?: readonly {
    /** Engine exit point; generated plume geometry extends toward +Z. */
    position: readonly [number, number, number];
    radius: number;
    length: number;
  }[];
}

const planetMaterial = {
  metalness: 0,
  roughness: 0.88,
} as const;

export const modelAssets = {
  asteria: {
    url: '/assets/models/asteria/asteria.glb',
    targetSize: 5.5,
    rotation: [0, 0, 0],
    // The exported GLB omits these factors, so glTF defaults metalness to 1.
    // With no environment map that makes the textured hull appear almost black.
    material: {
      metalness: 0.18,
      roughness: 0.62,
    },
    enginePlumes: [
      { position: [-0.42, -0.12, 2.62], radius: 0.34, length: 1.9 },
      { position: [0.42, -0.12, 2.62], radius: 0.34, length: 1.9 },
    ],
  },
  mercury: {
    url: '/assets/assets_glb/planets/mercury.glb',
    targetSize: 10,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  venus: {
    url: '/assets/assets_glb/planets/venus.glb',
    targetSize: 29,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  earth: {
    url: '/assets/assets_glb/planets/earth.glb',
    targetSize: 32,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  mars: {
    url: '/assets/assets_glb/planets/mars.glb',
    targetSize: 19,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  jupiter: {
    url: '/assets/assets_glb/planets/jupiter.glb',
    targetSize: 70,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  saturn: {
    // Saturn's target size includes the rings, which are the asset's widest dimension.
    url: '/assets/assets_glb/planets/saturn.glb',
    targetSize: 88,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  uranus: {
    url: '/assets/assets_glb/planets/uranus.glb',
    targetSize: 40,
    rotation: [0, 0, 97.77],
    material: planetMaterial,
  },
  neptune: {
    url: '/assets/assets_glb/planets/neptune.glb',
    targetSize: 38,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
  pluto: {
    url: '/assets/assets_glb/planets/pluto.glb',
    targetSize: 8,
    rotation: [0, 0, 0],
    material: planetMaterial,
  },
} as const satisfies Record<string, ModelAssetDefinition>;

export type ModelAssetId = keyof typeof modelAssets;
