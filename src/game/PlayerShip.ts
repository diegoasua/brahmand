import {
  ConeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import type { InputController } from './InputController';

const FORWARD = new Vector3(0, 0, -1);

export class PlayerShip {
  readonly object = new Group();
  readonly velocity = new Vector3();

  readonly #thrustGlow: Mesh;
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

    this.#thrustGlow = new Mesh(
      new ConeGeometry(0.62, 2.2, 12),
      new MeshBasicMaterial({ color: 0x62f5ff }),
    );
    this.#thrustGlow.rotation.x = Math.PI / 2;
    this.#thrustGlow.position.z = 3.25;
    this.#thrustGlow.visible = false;

    this.object.add(hull, cockpit, this.#thrustGlow);
    this.object.position.set(0, 3, 92);
  }

  get speed(): number {
    return this.velocity.length();
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
    this.#thrustGlow.scale.y = boosting ? 1.7 : 1;
  }
}
