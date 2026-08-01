import { PerspectiveCamera, Vector3 } from 'three';
import type { PlayerShip } from './PlayerShip';

const CAMERA_OFFSET = new Vector3(0, 5, 14);
const LOOK_OFFSET = new Vector3(0, 0, -12);

export class ChaseCamera {
  readonly camera: PerspectiveCamera;
  readonly #desiredPosition = new Vector3();
  readonly #lookAt = new Vector3();

  constructor(aspect: number) {
    this.camera = new PerspectiveCamera(64, aspect, 0.1, 6000);
  }

  snapTo(ship: PlayerShip): void {
    this.#desiredPosition
      .copy(CAMERA_OFFSET)
      .applyQuaternion(ship.object.quaternion)
      .add(ship.object.position);
    this.camera.position.copy(this.#desiredPosition);
    this.#orient(ship);
  }

  update(deltaSeconds: number, ship: PlayerShip): void {
    this.#desiredPosition
      .copy(CAMERA_OFFSET)
      .applyQuaternion(ship.object.quaternion)
      .add(ship.object.position);

    const blend = 1 - Math.exp(-5 * deltaSeconds);
    this.camera.position.lerp(this.#desiredPosition, blend);
    this.#orient(ship);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  #orient(ship: PlayerShip): void {
    this.#lookAt
      .copy(LOOK_OFFSET)
      .applyQuaternion(ship.object.quaternion)
      .add(ship.object.position);
    this.camera.lookAt(this.#lookAt);
  }
}
