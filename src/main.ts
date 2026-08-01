import './styles.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');

if (!canvas) {
  throw new Error('Unable to start Brahmand: #game-canvas is missing.');
}

const game = new Game(canvas);
game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.dispose());
}
