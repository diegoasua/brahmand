import {
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
} from 'three';
import type { CelestialBodyDefinition } from '../content/celestial-bodies';

export class CelestialObject {
  readonly mesh: Mesh;

  constructor(readonly definition: CelestialBodyDefinition) {
    const material =
      definition.kind === 'star'
        ? new MeshBasicMaterial({ color: definition.color })
        : new MeshStandardMaterial({
            color: definition.color,
            roughness: 0.82,
            metalness: 0.02,
          });

    this.mesh = new Mesh(
      new SphereGeometry(definition.displayRadius, 40, 24),
      material,
    );
    this.mesh.position.set(...definition.displayPosition);
    this.mesh.name = definition.name;

    if (definition.kind === 'star') {
      const light = new PointLight(definition.color, 2.4, 2500, 0.45);
      this.mesh.add(light);
    }
  }

  update(deltaSeconds: number): void {
    this.mesh.rotation.y += this.definition.rotationRadiansPerSecond * deltaSeconds;
  }
}
