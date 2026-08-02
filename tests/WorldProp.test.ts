import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { worldProps } from '../src/content/world-props';
import { WorldProp } from '../src/game/WorldProp';

describe('WorldProp orbital motion', () => {
  it('moves the ISS around Earth while preserving its circular radius', () => {
    const definition = worldProps.find(
      (candidate) => candidate.id === 'earth-orbit-iss',
    );
    if (!definition?.orbit) {
      throw new Error('ISS orbit definition is missing.');
    }

    const earth = new Vector3(12, -4, 30);
    const prop = new WorldProp(definition);
    prop.update(0, earth);
    const initialPosition = prop.object.position.clone();

    expect(initialPosition.distanceTo(earth)).toBeCloseTo(
      definition.orbit.semiMajorAxis,
      6,
    );

    prop.update(1, earth);

    expect(prop.object.position.distanceTo(earth)).toBeCloseTo(
      definition.orbit.semiMajorAxis,
      6,
    );
    expect(prop.object.position.distanceTo(initialPosition)).toBeGreaterThan(0);
  });
});
