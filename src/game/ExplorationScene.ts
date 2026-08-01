import {
  AmbientLight,
  Color,
  DirectionalLight,
  HemisphereLight,
  Scene,
  Vector3,
} from 'three';
import { celestialBodies } from '../content/celestial-bodies';
import { CelestialObject } from './CelestialObject';
import { ChaseCamera } from './ChaseCamera';
import { createStarField } from './createStarField';
import { InputController } from './InputController';
import { PlayerShip } from './PlayerShip';

export interface NearbyContact {
  id: string;
  name: string;
  distance: number;
  inRange: boolean;
}

export interface ExplorationUpdate {
  speed: number;
  nearestContact: NearbyContact | undefined;
  interactionRequested: boolean;
}

export class ExplorationScene {
  static readonly #DETAIL_LOAD_DISTANCE = 360;

  readonly scene = new Scene();
  readonly input = new InputController();
  readonly ship = new PlayerShip();
  readonly camera: ChaseCamera;
  readonly #celestialObjects: CelestialObject[];
  readonly #distanceVector = new Vector3();

  constructor(aspect: number) {
    this.scene.background = new Color(0x01040b);
    this.scene.add(new AmbientLight(0x8ba9cc, 0.38));
    this.scene.add(new HemisphereLight(0xa8d8ff, 0x111620, 0.72));

    const navigationFill = new DirectionalLight(0xe8f5ff, 1.4);
    navigationFill.position.set(90, 120, 160);
    this.scene.add(navigationFill);
    this.scene.add(createStarField());
    this.scene.add(this.ship.object);

    this.#celestialObjects = celestialBodies.map(
      (definition) => new CelestialObject(definition),
    );
    for (const celestialObject of this.#celestialObjects) {
      this.scene.add(celestialObject.object);
    }

    this.camera = new ChaseCamera(aspect);
    this.camera.snapTo(this.ship);
  }

  update(deltaSeconds: number): ExplorationUpdate {
    this.ship.update(deltaSeconds, this.input);
    this.camera.update(deltaSeconds, this.ship);

    for (const celestialObject of this.#celestialObjects) {
      celestialObject.update(deltaSeconds);
      if (
        celestialObject.definition.modelAssetId &&
        celestialObject.object.position.distanceTo(this.ship.object.position) <=
          ExplorationScene.#DETAIL_LOAD_DISTANCE
      ) {
        void celestialObject.loadVisual();
      }
    }

    return {
      speed: this.ship.speed,
      nearestContact: this.#findNearestContact(),
      interactionRequested: this.input.consumePress('KeyF'),
    };
  }

  async loadAssets(): Promise<boolean> {
    const earth = this.#celestialObjects.find(
      (object) => object.definition.id === 'earth',
    );
    const [shipLoaded, earthLoaded] = await Promise.all([
      this.ship.loadVisual(),
      earth?.loadVisual() ?? Promise.resolve(true),
    ]);
    return shipLoaded && earthLoaded;
  }

  isInRange(targetId: string): boolean {
    const target = this.#celestialObjects.find(
      (object) => object.definition.id === targetId,
    );

    return target
      ? target.object.position.distanceTo(this.ship.object.position) <=
          target.definition.interactionRange
      : false;
  }

  resize(aspect: number): void {
    this.camera.resize(aspect);
  }

  dispose(): void {
    this.input.dispose();
  }

  #findNearestContact(): NearbyContact | undefined {
    let nearest: NearbyContact | undefined;

    for (const celestialObject of this.#celestialObjects) {
      this.#distanceVector.subVectors(
        celestialObject.object.position,
        this.ship.object.position,
      );
      const distance = this.#distanceVector.length();

      if (!nearest || distance < nearest.distance) {
        nearest = {
          id: celestialObject.definition.id,
          name: celestialObject.definition.name,
          distance,
          inRange: distance <= celestialObject.definition.interactionRange,
        };
      }
    }

    return nearest;
  }
}
