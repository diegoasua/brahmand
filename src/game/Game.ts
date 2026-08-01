import { Clock, WebGLRenderer } from 'three';
import { commissioningQuests } from '../content/commissioning-quests';
import { QuestDirector } from '../domain/quest';
import { DialogueController } from '../services/DialogueController';
import { GameApiClient } from '../services/GameApiClient';
import { Hud } from '../ui/Hud';
import { ExplorationScene } from './ExplorationScene';

export class Game {
  readonly #renderer: WebGLRenderer;
  readonly #world: ExplorationScene;
  readonly #hud = new Hud();
  readonly #quests = new QuestDirector(commissioningQuests);
  readonly #dialogue: DialogueController;
  readonly #clock = new Clock();
  #animationFrame = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.#renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.#renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.#world = new ExplorationScene(window.innerWidth / window.innerHeight);

    const api = new GameApiClient(import.meta.env.VITE_API_BASE_URL);
    this.#dialogue = new DialogueController(api, {
      onDialogue: (response) => this.#hud.showDialogue(response),
      onNotice: (message) => this.#hud.setNotice(message),
    });

    this.#hud.updateQuest(this.#quests.progress);
    window.addEventListener('resize', this.#onResize);
  }

  start(): void {
    this.#clock.start();
    void this.#world.loadAssets().then((loaded) => {
      this.#hud.setNotice(
        loaded
          ? 'Asteria model loaded. Use W/S to begin the systems check.'
          : 'Asteria model unavailable; procedural flight model active.',
      );
    });
    this.#animationFrame = requestAnimationFrame(this.#tick);
  }

  dispose(): void {
    cancelAnimationFrame(this.#animationFrame);
    window.removeEventListener('resize', this.#onResize);
    this.#world.dispose();
    this.#dialogue.dispose();
    this.#renderer.dispose();
  }

  readonly #tick = (): void => {
    const deltaSeconds = Math.min(this.#clock.getDelta(), 0.05);
    const update = this.#world.update(deltaSeconds);
    const contact = update.nearestContact;

    this.#hud.updateTelemetry(update.speed, contact);
    this.#advanceVisitQuest();

    if (update.interactionRequested && contact?.inRange) {
      void this.#openChannel(contact.id);
    }

    this.#renderer.render(this.#world.scene, this.#world.camera.camera);
    this.#animationFrame = requestAnimationFrame(this.#tick);
  };

  #advanceVisitQuest(): void {
    const current = this.#quests.progress.current;

    if (
      current?.objective.type === 'visited' &&
      this.#world.isInRange(current.objective.targetId) &&
      this.#quests.record({ type: 'visited', targetId: current.objective.targetId })
    ) {
      this.#hud.setNotice('Observation range reached. AURA is analyzing the contact…');
      this.#hud.updateQuest(this.#quests.progress);
      void this.#openChannel(current.objective.targetId);
    }
  }

  async #openChannel(targetId: string): Promise<void> {
    const questId = this.#quests.progress.current?.id;
    const connected = await this.#dialogue.talk(targetId, questId);

    if (
      connected &&
      this.#quests.record({ type: 'talked', targetId })
    ) {
      this.#hud.updateQuest(this.#quests.progress);
    }
  }

  readonly #onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.#renderer.setSize(width, height, false);
    this.#world.resize(width / height);
  };
}
