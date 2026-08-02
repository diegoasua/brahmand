import { Clock, WebGLRenderer } from 'three';
import { commissioningQuests } from '../content/commissioning-quests';
import { QuestDirector } from '../domain/quest';
import type { DialogueIntent } from '../shared/contracts';
import { DialogueController } from '../services/DialogueController';
import { GameApiClient } from '../services/GameApiClient';
import { Hud } from '../ui/Hud';
import { ExplorationScene } from './ExplorationScene';

export class Game {
  readonly #renderer: WebGLRenderer;
  readonly #world: ExplorationScene;
  readonly #hud: Hud;
  readonly #quests = new QuestDirector(commissioningQuests);
  readonly #dialogue: DialogueController;
  readonly #clock = new Clock();
  readonly #introducedContactIds = new Set<string>();
  #conversationTargetId: string | undefined;
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
    this.#hud = new Hud({
      onConversationSubmit: this.#onConversationSubmit,
      onConversationClose: this.#onConversationClose,
    });

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
          ? 'Asteria, planetary models, and nearby encounters loaded. Use W/S to begin the systems check.'
          : 'Some models are unavailable; fallback visuals are active.',
      );
    });
    this.#animationFrame = requestAnimationFrame(this.#tick);
  }

  dispose(): void {
    cancelAnimationFrame(this.#animationFrame);
    window.removeEventListener('resize', this.#onResize);
    this.#world.dispose();
    this.#dialogue.dispose();
    this.#hud.dispose();
    this.#renderer.dispose();
  }

  readonly #tick = (): void => {
    const deltaSeconds = Math.min(this.#clock.getDelta(), 0.05);
    const update = this.#world.update(deltaSeconds);
    const contact = update.nearestContact;

    this.#hud.updateTelemetry(update.speed, contact);
    this.#advanceVisitQuest();

    if (
      update.enteredContactId &&
      !this.#introducedContactIds.has(update.enteredContactId)
    ) {
      this.#introducedContactIds.add(update.enteredContactId);
      void this.#openChannel(update.enteredContactId, 'arrival');
    } else if (update.interactionRequested && contact?.inRange) {
      void this.#openChannel(contact.id, 'fact');
    }

    if (update.conversationRequested) {
      if (contact?.inRange) {
        this.#conversationTargetId = contact.id;
        this.#hud.openConversation(contact.name);
        this.#hud.setNotice(`Conversation channel open with AURA about ${contact.name}.`);
      } else {
        this.#hud.setNotice('Move within observation range before opening a conversation.');
      }
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
    }
  }

  async #openChannel(
    targetId: string,
    intent: DialogueIntent,
    playerMessage?: string,
  ): Promise<void> {
    const currentQuest = this.#quests.progress.current;
    const questId =
      currentQuest?.objective.targetId === targetId ? currentQuest.id : undefined;
    const connected = await this.#dialogue.talk(targetId, {
      questId,
      intent,
      playerMessage,
    });

    if (
      connected &&
      this.#quests.record({ type: 'talked', targetId })
    ) {
      this.#hud.updateQuest(this.#quests.progress);
    }
  }

  readonly #onConversationSubmit = (message: string): void => {
    if (!this.#conversationTargetId) {
      this.#hud.setNotice('No conversation target is selected.');
      return;
    }

    void this.#openChannel(
      this.#conversationTargetId,
      'conversation',
      message,
    );
  };

  readonly #onConversationClose = (): void => {
    this.#conversationTargetId = undefined;
    this.#hud.setNotice('Conversation channel closed.');
  };

  readonly #onResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.#renderer.setSize(width, height, false);
    this.#world.resize(width / height);
  };
}
