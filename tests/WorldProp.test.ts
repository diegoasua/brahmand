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

  it('keeps an authored installation assembled along its shared orbit', () => {
    const platformDefinition = worldProps.find(
      (candidate) => candidate.id === 'engineering-floor-tile',
    );
    const panelDefinition = worldProps.find(
      (candidate) => candidate.id === 'engineering-wall-panel',
    );
    if (!platformDefinition?.orbit || !panelDefinition?.orbit) {
      throw new Error('Engineering formation orbit is missing.');
    }

    const earth = new Vector3();
    const platform = new WorldProp(platformDefinition);
    const panel = new WorldProp(panelDefinition);
    platform.update(0, earth);
    panel.update(0, earth);
    const initialSeparation = panel.object.position
      .clone()
      .sub(platform.object.position);

    platform.update(12, earth);
    panel.update(12, earth);

    expect(
      panel.object.position.clone().sub(platform.object.position),
    ).toEqual(initialSeparation);
    expect(initialSeparation).toEqual(new Vector3(-12, 1, 0));
  });
});
