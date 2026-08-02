import { Box3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  resolveSolidCollisions,
  type SolidCollider,
} from '../src/game/resolveSolidCollisions';

describe('solid flight collisions', () => {
  it('prevents a boosted ship from tunneling through a planet', () => {
    const position = new Vector3(0, 0, -10);
    const velocity = new Vector3(0, 0, -100);
    const hit = resolveSolidCollisions(
      new Vector3(0, 0, 10),
      position,
      velocity,
      1,
      [sphereCollider(2)],
    );

    expect(hit?.id).toBe('planet');
    expect(position.z).toBeCloseTo(3.04, 6);
    expect(velocity.z).toBeCloseTo(0, 6);
  });

  it('cancels inward velocity while preserving motion along a surface', () => {
    const position = new Vector3(2, 0, 0);
    const velocity = new Vector3(-2, 3, 0);

    resolveSolidCollisions(
      new Vector3(2, 0, 0),
      position,
      velocity,
      1,
      [sphereCollider(2)],
    );

    expect(position.x).toBeCloseTo(3.04, 6);
    expect(velocity.x).toBeCloseTo(0, 6);
    expect(velocity.y).toBe(3);
  });

  it('uses expanded model bounds to stop the ship at authored assets', () => {
    const position = new Vector3(10, 0, 0);
    const velocity = new Vector3(80, 0, 0);
    const collider: SolidCollider = {
      id: 'station',
      name: 'Station',
      kind: 'box',
      bounds: new Box3(new Vector3(-1, -2, -3), new Vector3(1, 2, 3)),
    };

    const hit = resolveSolidCollisions(
      new Vector3(-10, 0, 0),
      position,
      velocity,
      0.5,
      [collider],
    );

    expect(hit?.id).toBe('station');
    expect(position.x).toBeCloseTo(-1.54, 6);
    expect(velocity.x).toBeCloseTo(0, 6);
  });

  it('does not trap a ship that is moving away from a surface', () => {
    const position = new Vector3(5, 0, 0);
    const velocity = new Vector3(2, 0, 0);
    const hit = resolveSolidCollisions(
      new Vector3(3.04, 0, 0),
      position,
      velocity,
      1,
      [sphereCollider(2)],
    );

    expect(hit).toBeUndefined();
    expect(position.x).toBe(5);
    expect(velocity.x).toBe(2);
  });
});

function sphereCollider(radius: number): SolidCollider {
  return {
    id: 'planet',
    name: 'Planet',
    kind: 'sphere',
    center: new Vector3(),
    radius,
  };
}
