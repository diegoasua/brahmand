export type QuestEventType = 'visited' | 'talked';

export interface QuestEvent {
  type: QuestEventType;
  targetId: string;
}

export interface QuestDefinition {
  id: string;
  title: string;
  summary: string;
  objective: QuestEvent;
}

export interface QuestProgress {
  current: QuestDefinition | undefined;
  completedIds: readonly string[];
  isComplete: boolean;
}

export class QuestDirector {
  readonly #quests: readonly QuestDefinition[];
  readonly #completedIds: string[] = [];
  #currentIndex = 0;

  constructor(quests: readonly QuestDefinition[]) {
    const ids = new Set(quests.map((quest) => quest.id));

    if (ids.size !== quests.length) {
      throw new Error('Quest IDs must be unique.');
    }

    this.#quests = quests;
  }

  get progress(): QuestProgress {
    return {
      current: this.#quests[this.#currentIndex],
      completedIds: [...this.#completedIds],
      isComplete: this.#currentIndex >= this.#quests.length,
    };
  }

  record(event: QuestEvent): boolean {
    const quest = this.#quests[this.#currentIndex];

    if (
      !quest ||
      quest.objective.type !== event.type ||
      quest.objective.targetId !== event.targetId
    ) {
      return false;
    }

    this.#completedIds.push(quest.id);
    this.#currentIndex += 1;
    return true;
  }
}
