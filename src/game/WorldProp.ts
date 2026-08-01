import { Group, MathUtils } from 'three';
import type { WorldPropDefinition } from '../content/world-props';
import { loadModelAsset } from './loadModelAsset';

export class WorldProp {
  readonly object = new Group();
  readonly #baseY: number;
  #elapsedSeconds = 0;
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
  }

  update(deltaSeconds: number): void {
    this.#elapsedSeconds += deltaSeconds;

    const rotation = this.definition.rotationRadiansPerSecond;
    if (rotation) {
      this.object.rotateX(rotation[0] * deltaSeconds);
      this.object.rotateY(rotation[1] * deltaSeconds);
      this.object.rotateZ(rotation[2] * deltaSeconds);
    }

    const bob = this.definition.bob;
    if (bob) {
      this.object.position.y =
        this.#baseY +
        Math.sin(this.#elapsedSeconds * bob.radiansPerSecond + bob.phase) *
          bob.amplitude;
    }
  }

  loadVisual(): Promise<boolean> {
    this.#loadPromise ??= this.#loadVisual();
    return this.#loadPromise;
  }

  async #loadVisual(): Promise<boolean> {
    try {
      const visual = await loadModelAsset(this.definition.model);
      this.object.add(visual);
      return true;
    } catch (error) {
      console.warn(`Unable to load world prop ${this.definition.name}.`, error);
      return false;
    }
  }
}
