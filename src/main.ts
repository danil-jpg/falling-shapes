import './styles.css';
import { Game } from './Game';

const host = document.getElementById('stage');
if (!host) throw new Error('#stage element not found');

const game = await Game.create(host);

if (import.meta.hot) {
  // Dev only: dispose the old instance on hot reload so canvases/listeners don't stack up.
  import.meta.hot.dispose(() => game.destroy());
}
