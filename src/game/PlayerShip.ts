import {
  AdditiveBlending,
  ConeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { modelAssets } from '../content/assets';
import type { InputController } from './InputController';
import { loadModelAsset } from './loadModelAsset';

const FORWARD = new Vector3(0, 0, -1);

export class PlayerShip {
  readonly object = new Group();
  readonly velocity = new Vector3();
  readonly collisionRadius = modelAssets.asteria.targetSize / 2;

  readonly #placeholder = new Group();
  readonly #thrustGlow = new Group();
  readonly #acceleration = 18;
  readonly #turnRate = 1.15;
  readonly #maxSpeed = 56;

  constructor() {
    const hull = new Mesh(
      new ConeGeometry(1.35, 5.5, 6),
      new MeshStandardMaterial({
        color: 0xd7e3e8,
        metalness: 0.72,
        roughness: 0.3,
      }),
    );
    hull.rotation.x = -Math.PI / 2;

    const cockpit = new Mesh(
      new SphereGeometry(0.78, 18, 12),
      new MeshStandardMaterial({
        color: 0x49c7df,
        emissive: 0x103f55,
        metalness: 0.45,
        roughness: 0.18,
      }),
    );
    cockpit.scale.set(0.82, 0.5, 1.45);
    cockpit.position.z = -1.05;

    this.#thrustGlow.name = 'asteria-engine-plumes';
    for (const plume of modelAssets.asteria.enginePlumes) {
      const outer = new Mesh(
        new ConeGeometry(plume.radius, plume.length, 16),
        new MeshBasicMaterial({
          color: 0x22ccea,
          transparent: true,
          opacity: 0.48,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      outer.rotation.x = Math.PI / 2;
      outer.position.set(
        plume.position[0],
        plume.position[1],
        plume.position[2] + plume.length / 2,
      );

      const innerLength = plume.length * 0.68;
      const inner = new Mesh(
        new ConeGeometry(plume.radius * 0.48, innerLength, 12),
        new MeshBasicMaterial({
          color: 0xd9fcff,
          transparent: true,
          opacity: 0.82,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      );
      inner.rotation.x = Math.PI / 2;
      inner.position.set(
        plume.position[0],
        plume.position[1],
        plume.position[2] + innerLength / 2,
      );
      this.#thrustGlow.add(outer, inner);
    }
    this.#thrustGlow.visible = false;

    this.#placeholder.name = 'procedural-ship-fallback';
    this.#placeholder.add(hull, cockpit);
    this.object.add(this.#placeholder, this.#thrustGlow);
    this.object.position.set(0, 3, 92);
  }

  get speed(): number {
    return this.velocity.length();
  }

  async loadVisual(): Promise<boolean> {
    try {
      const visual = await loadModelAsset(modelAssets.asteria);
      this.object.add(visual);
      this.#placeholder.visible = false;
      return true;
    } catch (error) {
      console.warn('Unable to load Asteria model; using procedural fallback.', error);
      return false;
    }
  }

  update(deltaSeconds: number, input: InputController): void {
    const pitch = input.axis('ArrowUp', 'ArrowDown');
    const yaw = input.axis('KeyD', 'KeyA');
    const roll = input.axis('KeyE', 'KeyQ');
    const thrust = input.axis('KeyS', 'KeyW');
    const boosting = input.isHeld('ShiftLeft') || input.isHeld('ShiftRight');
    const boostMultiplier = boosting ? 2.2 : 1;

    this.object.rotateX(pitch * this.#turnRate * deltaSeconds);
    this.object.rotateY(yaw * this.#turnRate * deltaSeconds);
    this.object.rotateZ(roll * this.#turnRate * deltaSeconds);

    if (thrust !== 0) {
      const direction = FORWARD.clone().applyQuaternion(this.object.quaternion);
      this.velocity.addScaledVector(
        direction,
        thrust * this.#acceleration * boostMultiplier * deltaSeconds,
      );
    }

    const currentMaxSpeed = this.#maxSpeed * boostMultiplier;
    if (this.velocity.lengthSq() > currentMaxSpeed * currentMaxSpeed) {
      this.velocity.setLength(currentMaxSpeed);
    }

    const damping = Math.exp(-0.075 * deltaSeconds);
    this.velocity.multiplyScalar(damping);
    this.object.position.addScaledVector(this.velocity, deltaSeconds);

    this.#thrustGlow.visible = thrust > 0;
    this.#thrustGlow.scale.z = boosting ? 1.7 : 1;
  }
}
