import {
  AmbientLight,
  Color,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  Scene,
  Vector3,
} from 'three';
import { celestialBodies } from '../content/celestial-bodies';
import { worldProps, worldRegionLights } from '../content/world-props';
import { CelestialObject } from './CelestialObject';
import { ChaseCamera } from './ChaseCamera';
import { resolveSphereCollision } from './collision';
import { createStarField } from './createStarField';
import { InputController } from './InputController';
import { PlayerShip } from './PlayerShip';
import { WorldProp } from './WorldProp';

export interface NearbyContact {
  id: string;
  name: string;
  distance: number;
  inRange: boolean;
}

export interface ExplorationUpdate {
  speed: number;
  nearestContact: NearbyContact | undefined;
  enteredContactId: string | undefined;
  interactionRequested: boolean;
}

export class ExplorationScene {
  static readonly #WORLD_PROP_LOAD_DISTANCE = 700;
  static readonly #SHIP_COLLISION_RADIUS = 1.5;

  readonly scene = new Scene();
  readonly input = new InputController();
  readonly ship = new PlayerShip();
  readonly camera: ChaseCamera;
  readonly #celestialObjects: CelestialObject[];
  readonly #worldProps: WorldProp[];
  readonly #distanceVector = new Vector3();
  readonly #contactsInRange = new Set<string>();

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

    this.#worldProps = worldProps.map((definition) => new WorldProp(definition));
    for (const worldProp of this.#worldProps) {
      this.scene.add(worldProp.object);
    }

    for (const definition of worldRegionLights) {
      const light = new PointLight(
        definition.color,
        definition.intensity,
        definition.distance,
        1.4,
      );
      light.position.set(
        definition.position[0],
        definition.position[1],
        definition.position[2],
      );
      this.scene.add(light);
    }

    this.camera = new ChaseCamera(aspect);
    this.camera.snapTo(this.ship);
  }

  update(deltaSeconds: number): ExplorationUpdate {
    this.ship.update(deltaSeconds, this.input);

    for (const celestialObject of this.#celestialObjects) {
      resolveSphereCollision(
        this.ship.object.position,
        this.ship.velocity,
        ExplorationScene.#SHIP_COLLISION_RADIUS,
        celestialObject.object.position,
        celestialObject.definition.displayRadius,
      );
    }

    this.camera.update(deltaSeconds, this.ship);

    for (const celestialObject of this.#celestialObjects) {
      celestialObject.update(deltaSeconds);
    }

    for (const worldProp of this.#worldProps) {
      worldProp.update(deltaSeconds);
      if (
        worldProp.object.position.distanceTo(this.ship.object.position) <=
        ExplorationScene.#WORLD_PROP_LOAD_DISTANCE
      ) {
        void worldProp.loadVisual();
      }
    }

    const { nearestContact, enteredContactId } = this.#updateContacts();

    return {
      speed: this.ship.speed,
      nearestContact,
      enteredContactId,
      interactionRequested: this.input.consumePress('KeyF'),
    };
  }

  async loadAssets(): Promise<boolean> {
    const nearbyWorldProps = this.#worldProps.filter(
      (worldProp) =>
        worldProp.object.position.distanceTo(this.ship.object.position) <=
        ExplorationScene.#WORLD_PROP_LOAD_DISTANCE,
    );
    const results = await Promise.all([
      this.ship.loadVisual(),
      ...this.#celestialObjects.map((object) => object.loadVisual()),
      ...nearbyWorldProps.map((worldProp) => worldProp.loadVisual()),
    ]);
    return results.every(Boolean);
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

  #updateContacts(): {
    nearestContact: NearbyContact | undefined;
    enteredContactId: string | undefined;
  } {
    let nearest: NearbyContact | undefined;
    let entered: NearbyContact | undefined;
    const currentlyInRange = new Set<string>();

    for (const celestialObject of this.#celestialObjects) {
      this.#distanceVector.subVectors(
        celestialObject.object.position,
        this.ship.object.position,
      );
      const distance = this.#distanceVector.length();
      const inRange = distance <= celestialObject.definition.interactionRange;
      const contact: NearbyContact = {
        id: celestialObject.definition.id,
        name: celestialObject.definition.name,
        distance,
        inRange,
      };

      if (!nearest || distance < nearest.distance) {
        nearest = contact;
      }

      if (inRange) {
        currentlyInRange.add(contact.id);
        if (
          !this.#contactsInRange.has(contact.id) &&
          (!entered || distance < entered.distance)
        ) {
          entered = contact;
        }
      }
    }

    this.#contactsInRange.clear();
    for (const id of currentlyInRange) {
      this.#contactsInRange.add(id);
    }

    return {
      nearestContact: nearest,
      enteredContactId: entered?.id,
    };
  }
}
