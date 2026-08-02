import { Vector3 } from 'three';

// Reused across calls; safe because resolveSphereCollision is synchronous and never re-entered.
const SCRATCH_OFFSET = new Vector3();

export function resolveSphereCollision(
  shipPosition: Vector3,
  shipVelocity: Vector3,
  shipRadius: number,
  bodyPosition: Vector3,
  bodyRadius: number,
): void {
  const minDistance = shipRadius + bodyRadius;
  SCRATCH_OFFSET.subVectors(shipPosition, bodyPosition);
  const distance = SCRATCH_OFFSET.length();

  // Coincident centers give no usable normal; skip rather than divide by zero.
  if (distance >= minDistance || distance === 0) {
    return;
  }

  const normal = SCRATCH_OFFSET.divideScalar(distance);
  shipPosition.copy(bodyPosition).addScaledVector(normal, minDistance);

  const inwardSpeed = shipVelocity.dot(normal);
  if (inwardSpeed < 0) {
    shipVelocity.addScaledVector(normal, -inwardSpeed);
  }
}
