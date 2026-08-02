import { Box3, Vector3 } from 'three';

export type SolidCollider =
  | {
      id: string;
      name: string;
      kind: 'sphere';
      center: Vector3;
      radius: number;
    }
  | {
      id: string;
      name: string;
      kind: 'box';
      bounds: Box3;
    };

export interface SolidCollisionHit {
  id: string;
  name: string;
  normal: Vector3;
}

interface CollisionCandidate extends SolidCollisionHit {
  time: number;
  resolvedPosition: Vector3;
}

const COLLISION_SKIN = 0.04;
const EPSILON = 1e-8;

export function resolveSolidCollisions(
  previousPosition: Vector3,
  position: Vector3,
  velocity: Vector3,
  movingRadius: number,
  colliders: readonly SolidCollider[],
): SolidCollisionHit | undefined {
  let earliest: CollisionCandidate | undefined;

  for (const collider of colliders) {
    const candidate =
      collider.kind === 'sphere'
        ? collideWithSphere(
            previousPosition,
            position,
            movingRadius,
            collider,
          )
        : collideWithBox(
            previousPosition,
            position,
            movingRadius,
            collider,
          );

    if (candidate && (!earliest || candidate.time < earliest.time)) {
      earliest = candidate;
    }
  }

  if (!earliest) {
    return undefined;
  }

  position.copy(earliest.resolvedPosition);
  const inwardSpeed = velocity.dot(earliest.normal);
  if (inwardSpeed < 0) {
    velocity.addScaledVector(earliest.normal, -inwardSpeed);
  }

  return {
    id: earliest.id,
    name: earliest.name,
    normal: earliest.normal,
  };
}

function collideWithSphere(
  start: Vector3,
  end: Vector3,
  movingRadius: number,
  collider: Extract<SolidCollider, { kind: 'sphere' }>,
): CollisionCandidate | undefined {
  const radius = movingRadius + collider.radius;
  const movement = new Vector3().subVectors(end, start);
  const fromCenter = new Vector3().subVectors(start, collider.center);
  const startDistanceSquared = fromCenter.lengthSq();
  const radiusSquared = radius * radius;

  if (startDistanceSquared < radiusSquared - EPSILON) {
    const normal = collisionNormal(end, start, collider.center);
    return {
      id: collider.id,
      name: collider.name,
      normal,
      time: 0,
      resolvedPosition: collider.center
        .clone()
        .addScaledVector(normal, radius + COLLISION_SKIN),
    };
  }

  const movementLengthSquared = movement.lengthSq();
  if (movementLengthSquared <= EPSILON) {
    return undefined;
  }

  const projection = fromCenter.dot(movement);
  if (projection >= 0) {
    return undefined;
  }

  const discriminant =
    projection * projection -
    movementLengthSquared * (startDistanceSquared - radiusSquared);
  if (discriminant < 0) {
    return undefined;
  }

  const time =
    (-projection - Math.sqrt(discriminant)) / movementLengthSquared;
  if (time < 0 || time > 1) {
    return undefined;
  }

  const impactPosition = start.clone().addScaledVector(movement, time);
  const normal = impactPosition.clone().sub(collider.center).normalize();
  return {
    id: collider.id,
    name: collider.name,
    normal,
    time,
    resolvedPosition: impactPosition.addScaledVector(normal, COLLISION_SKIN),
  };
}

function collideWithBox(
  start: Vector3,
  end: Vector3,
  movingRadius: number,
  collider: Extract<SolidCollider, { kind: 'box' }>,
): CollisionCandidate | undefined {
  const expanded = collider.bounds.clone().expandByScalar(movingRadius);
  const startsInside = expanded.containsPoint(start);
  const endsInside = expanded.containsPoint(end);

  if (startsInside) {
    if (!endsInside) {
      return undefined;
    }

    const { normal, position } = pushOutOfBox(end, expanded);
    return {
      id: collider.id,
      name: collider.name,
      normal,
      time: 0,
      resolvedPosition: position,
    };
  }

  const movement = new Vector3().subVectors(end, start);
  let entryTime = 0;
  let exitTime = 1;
  let entryNormal = new Vector3();

  for (const axis of ['x', 'y', 'z'] as const) {
    const direction = movement[axis];
    if (Math.abs(direction) <= EPSILON) {
      if (start[axis] < expanded.min[axis] || start[axis] > expanded.max[axis]) {
        return undefined;
      }
      continue;
    }

    let nearTime = (expanded.min[axis] - start[axis]) / direction;
    let farTime = (expanded.max[axis] - start[axis]) / direction;
    let nearNormalDirection = -1;
    if (nearTime > farTime) {
      [nearTime, farTime] = [farTime, nearTime];
      nearNormalDirection = 1;
    }

    if (nearTime > entryTime) {
      entryTime = nearTime;
      entryNormal = new Vector3();
      entryNormal[axis] = nearNormalDirection;
    }
    exitTime = Math.min(exitTime, farTime);
    if (entryTime > exitTime) {
      return undefined;
    }
  }

  if (entryTime < 0 || entryTime > 1 || entryNormal.lengthSq() === 0) {
    return undefined;
  }

  const impactPosition = start.clone().addScaledVector(movement, entryTime);
  return {
    id: collider.id,
    name: collider.name,
    normal: entryNormal,
    time: entryTime,
    resolvedPosition: impactPosition.addScaledVector(
      entryNormal,
      COLLISION_SKIN,
    ),
  };
}

function collisionNormal(end: Vector3, start: Vector3, center: Vector3): Vector3 {
  const normal = end.clone().sub(center);
  if (normal.lengthSq() <= EPSILON) {
    normal.copy(start).sub(center);
  }
  return normal.lengthSq() > EPSILON
    ? normal.normalize()
    : new Vector3(0, 1, 0);
}

function pushOutOfBox(
  position: Vector3,
  bounds: Box3,
): { normal: Vector3; position: Vector3 } {
  const distances = [
    { axis: 'x' as const, direction: -1, distance: position.x - bounds.min.x },
    { axis: 'x' as const, direction: 1, distance: bounds.max.x - position.x },
    { axis: 'y' as const, direction: -1, distance: position.y - bounds.min.y },
    { axis: 'y' as const, direction: 1, distance: bounds.max.y - position.y },
    { axis: 'z' as const, direction: -1, distance: position.z - bounds.min.z },
    { axis: 'z' as const, direction: 1, distance: bounds.max.z - position.z },
  ];
  const nearest = distances.reduce((best, candidate) =>
    candidate.distance < best.distance ? candidate : best,
  );
  const normal = new Vector3();
  normal[nearest.axis] = nearest.direction;
  const resolvedPosition = position.clone();
  resolvedPosition[nearest.axis] =
    nearest.direction < 0
      ? bounds.min[nearest.axis] - COLLISION_SKIN
      : bounds.max[nearest.axis] + COLLISION_SKIN;

  return { normal, position: resolvedPosition };
}
