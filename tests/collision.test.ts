import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { resolveSphereCollision } from '../src/game/collision';

describe('resolveSphereCollision', () => {
  it('does nothing when the ship is outside the combined radius', () => {
    const shipPosition = new Vector3(0, 0, 20);
    const shipVelocity = new Vector3(0, 0, -5);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipPosition).toEqual(new Vector3(0, 0, 20));
    expect(shipVelocity).toEqual(new Vector3(0, 0, -5));
  });

  it('stops head-on penetration exactly at the combined radius with zero inward velocity', () => {
    const shipPosition = new Vector3(0, 0, 5);
    const shipVelocity = new Vector3(0, 0, -8);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipPosition.distanceTo(bodyPosition)).toBeCloseTo(11.5, 5);
    const outwardNormal = shipPosition.clone().sub(bodyPosition).normalize();
    expect(shipVelocity.dot(outwardNormal)).toBeCloseTo(0, 5);
  });

  it('preserves the tangential velocity component while zeroing the inward one', () => {
    const shipPosition = new Vector3(0, 0, 5);
    const shipVelocity = new Vector3(3, 0, -8);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipVelocity.x).toBeCloseTo(3, 5);
  });

  it('leaves outward-moving velocity untouched but still corrects an overlapping position', () => {
    const shipPosition = new Vector3(0, 0, 5);
    const shipVelocity = new Vector3(0, 0, 8);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1.5, bodyPosition, 10);

    expect(shipVelocity).toEqual(new Vector3(0, 0, 8));
    expect(shipPosition.distanceTo(bodyPosition)).toBeCloseTo(11.5, 5);
  });

  it('resolves a diagonal approach onto the exact surface distance', () => {
    const shipPosition = new Vector3(3, 4, 0);
    const shipVelocity = new Vector3(-3, -4, 0);
    const bodyPosition = new Vector3(0, 0, 0);

    resolveSphereCollision(shipPosition, shipVelocity, 1, bodyPosition, 6);

    expect(shipPosition.distanceTo(bodyPosition)).toBeCloseTo(7, 5);
  });
});
