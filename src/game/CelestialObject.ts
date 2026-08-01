import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
} from 'three';
import { modelAssets } from '../content/assets';
import type { CelestialBodyDefinition } from '../content/celestial-bodies';
import { loadModelAsset } from './loadModelAsset';

export class CelestialObject {
  readonly object = new Group();
  readonly #fallback: Mesh;
  #loadPromise: Promise<boolean> | undefined;

  constructor(readonly definition: CelestialBodyDefinition) {
    const material =
      definition.kind === 'star'
        ? new MeshBasicMaterial({ color: definition.color })
        : new MeshStandardMaterial({
            color: definition.color,
            roughness: 0.82,
            metalness: 0.02,
          });

    this.#fallback = new Mesh(
      new SphereGeometry(definition.displayRadius, 40, 24),
      material,
    );
    this.object.position.set(...definition.displayPosition);
    this.object.name = definition.name;
    this.object.add(this.#fallback);

    if (definition.kind === 'star') {
      const light = new PointLight(definition.color, 2.4, 2500, 0.45);
      this.object.add(light);
    }
  }

  update(deltaSeconds: number): void {
    this.object.rotation.y +=
      this.definition.rotationRadiansPerSecond * deltaSeconds;
  }

  loadVisual(): Promise<boolean> {
    if (!this.definition.modelAssetId) {
      return Promise.resolve(true);
    }

    this.#loadPromise ??= this.#loadVisual();
    return this.#loadPromise;
  }

  async #loadVisual(): Promise<boolean> {
    const assetId = this.definition.modelAssetId;
    if (!assetId) {
      return true;
    }

    try {
      const visual = await loadModelAsset(modelAssets[assetId]);
      this.object.add(visual);
      this.#fallback.visible = false;
      return true;
    } catch (error) {
      console.warn(
        `Unable to load ${this.definition.name} model; using sphere fallback.`,
        error,
      );
      return false;
    }
  }
}
