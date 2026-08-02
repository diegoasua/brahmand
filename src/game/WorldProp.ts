import { Box3, Group, MathUtils, Vector3 } from 'three';
import type { WorldPropDefinition } from '../content/world-props';
import { loadModelAsset } from './loadModelAsset';

export class WorldProp {
  readonly object = new Group();
  readonly #baseY: number;
  readonly #orbitMajorAxis = new Vector3(1, 0, 0);
  readonly #orbitMinorAxis = new Vector3(0, 0, 1);
  #localCollisionBounds: Box3 | undefined;
  #elapsedSeconds = 0;
  #meanAnomaly = 0;
  #loadPromise: Promise<boolean> | undefined;

  constructor(readonly definition: WorldPropDefinition) {
    this.object.name = definition.name;
    this.object.position.set(...definition.displayPosition);
    this.object.rotation.set(
      MathUtils.degToRad(definition.displayRotation[0]),
      MathUtils.degToRad(definition.displayRotation[1]),
      MathUtils.degToRad(definition.displayRotation[2]),
    );
    this.#baseY = definition.displayPosition[1];

    const orbit = definition.orbit;
    if (orbit) {
      this.#meanAnomaly = orbit.meanAnomalyRadians;
      const ascendingNode = MathUtils.degToRad(orbit.ascendingNodeDegrees);
      this.#orbitMajorAxis.set(
        Math.cos(ascendingNode),
        0,
        -Math.sin(ascendingNode),
      );
      this.#orbitMinorAxis
        .set(Math.sin(ascendingNode), 0, Math.cos(ascendingNode))
        .applyAxisAngle(
          this.#orbitMajorAxis,
          MathUtils.degToRad(orbit.inclinationDegrees),
        );
    }
  }

  update(deltaSeconds: number, orbitCenter?: Vector3): void {
    this.#elapsedSeconds += deltaSeconds;

    const rotation = this.definition.rotationRadiansPerSecond;
    if (rotation) {
      this.object.rotateX(rotation[0] * deltaSeconds);
      this.object.rotateY(rotation[1] * deltaSeconds);
      this.object.rotateZ(rotation[2] * deltaSeconds);
    }

    const orbit = this.definition.orbit;
    if (orbit && orbitCenter) {
      this.#meanAnomaly =
        (this.#meanAnomaly + orbit.meanMotionRadiansPerSecond * deltaSeconds) %
        (Math.PI * 2);
      const eccentricAnomaly = solveEccentricAnomaly(
        this.#meanAnomaly,
        orbit.eccentricity,
      );
      const semiMinorAxis =
        orbit.semiMajorAxis * Math.sqrt(1 - orbit.eccentricity ** 2);
      const majorDistance =
        orbit.semiMajorAxis *
        (Math.cos(eccentricAnomaly) - orbit.eccentricity);
      const minorDistance = semiMinorAxis * Math.sin(eccentricAnomaly);

      this.object.position
        .copy(orbitCenter)
        .addScaledVector(this.#orbitMajorAxis, majorDistance)
        .addScaledVector(this.#orbitMinorAxis, minorDistance);
    }

    const bob = this.definition.bob;
    if (bob) {
      const offset =
        Math.sin(this.#elapsedSeconds * bob.radiansPerSecond + bob.phase) *
        bob.amplitude;
      if (orbit && orbitCenter) {
        this.object.position.y += offset;
      } else {
        this.object.position.y = this.#baseY + offset;
      }
    }
  }

  loadVisual(): Promise<boolean> {
    this.#loadPromise ??= this.#loadVisual();
    return this.#loadPromise;
  }

  copyWorldCollisionBounds(target: Box3): boolean {
    if (!this.#localCollisionBounds) {
      return false;
    }

    this.object.updateWorldMatrix(true, false);
    target
      .copy(this.#localCollisionBounds)
      .applyMatrix4(this.object.matrixWorld);
    return !target.isEmpty();
  }

  async #loadVisual(): Promise<boolean> {
    try {
      const visual = await loadModelAsset(this.definition.model);
      visual.updateMatrixWorld(true);
      this.#localCollisionBounds = new Box3().setFromObject(visual);
      this.object.add(visual);
      return true;
    } catch (error) {
      console.warn(`Unable to load world prop ${this.definition.name}.`, error);
      return false;
    }
  }
}

function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  let eccentricAnomaly = eccentricity < 0.8 ? meanAnomaly : Math.PI;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const residual =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      meanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    eccentricAnomaly -= residual / derivative;
  }

  return eccentricAnomaly;
}
