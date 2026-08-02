import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { modelAssets } from '../src/content/assets';
import { celestialBodies } from '../src/content/celestial-bodies';
import {
  type WorldPropDefinition,
  worldProps,
} from '../src/content/world-props';

describe('world prop manifest', () => {
  const definitions = worldProps as readonly WorldPropDefinition[];

  it('uses the Chapter 0 ship as the player vessel', () => {
    expect(modelAssets.asteria.url).toBe(
      '/assets/assets_glb/ch0_prop_ship.glb',
    );
  });

  it('places every delivered chapter prop exactly once', () => {
    const delivered = readdirSync(
      resolve(process.cwd(), 'public/assets/assets_glb'),
    )
      .filter((filename) => /^ch[1-6]_.*\.glb$/.test(filename))
      .sort();
    const placed = worldProps
      .map((definition) => definition.model.url.split('/').at(-1) ?? '')
      .sort();

    expect(placed).toEqual(delivered);
  });

  it('keeps IDs and primary placements unique', () => {
    const ids = new Set(worldProps.map((definition) => definition.id));
    const positions = new Set(
      worldProps.map((definition) => definition.displayPosition.join(',')),
    );

    expect(ids.size).toBe(worldProps.length);
    expect(positions.size).toBe(worldProps.length);
  });

  it('gives space-native moving assets valid orbital relationships', () => {
    const targetIds = new Set(celestialBodies.map((body) => body.id));
    const orbitingProps = definitions.filter(
      (definition) => definition.orbit !== undefined,
    );

    expect(orbitingProps).toHaveLength(12);
    for (const definition of orbitingProps) {
      const orbit = definition.orbit;
      expect(orbit && targetIds.has(orbit.targetId)).toBe(true);
      expect(orbit?.semiMajorAxis).toBeGreaterThan(0);
      expect(orbit?.eccentricity).toBeGreaterThanOrEqual(0);
      expect(orbit?.eccentricity).toBeLessThan(1);
      expect(orbit?.meanMotionRadiansPerSecond).toBeGreaterThan(0);
    }

    const iss = definitions.find(
      (definition) => definition.id === 'earth-orbit-iss',
    );
    expect(iss?.orbit).toMatchObject({
      targetId: 'earth',
      eccentricity: 0,
      inclinationDegrees: 51.6,
    });
    expect(iss?.model.targetSize).toBeLessThan(modelAssets.earth.targetSize);

    for (const satellite of definitions.filter((definition) =>
      definition.id.startsWith('earth-satellite-'),
    )) {
      expect(satellite.model.targetSize).toBeLessThan(
        modelAssets.asteria.targetSize,
      );
    }

    for (const definition of definitions.filter((prop) =>
      /^(asteroid|comet)-/.test(prop.id),
    )) {
      expect(definition.orbit?.targetId).toBe('sun');
    }
  });
});
