const CONTROLLED_KEYS = new Set([
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
  'KeyQ',
  'KeyE',
  'KeyF',
  'KeyC',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ShiftLeft',
  'ShiftRight',
]);

export class InputController {
  readonly #held = new Set<string>();
  readonly #pressed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('keyup', this.#onKeyUp);
    window.addEventListener('blur', this.#onBlur);
  }

  isHeld(code: string): boolean {
    return this.#held.has(code);
  }

  axis(negativeCode: string, positiveCode: string): number {
    return Number(this.isHeld(positiveCode)) - Number(this.isHeld(negativeCode));
  }

  consumePress(code: string): boolean {
    const wasPressed = this.#pressed.has(code);
    this.#pressed.delete(code);
    return wasPressed;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.#onKeyDown);
    window.removeEventListener('keyup', this.#onKeyUp);
    window.removeEventListener('blur', this.#onBlur);
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (CONTROLLED_KEYS.has(event.code)) {
      event.preventDefault();
    }

    if (!event.repeat) {
      this.#pressed.add(event.code);
    }

    this.#held.add(event.code);
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    this.#held.delete(event.code);
  };

  readonly #onBlur = (): void => {
    this.#held.clear();
    this.#pressed.clear();
  };
}
