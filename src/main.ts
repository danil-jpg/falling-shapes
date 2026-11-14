import './styles.css';
import { Game } from './Game';

function requireElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} element not found`);
  return el;
}

const game = await Game.create({
  stage: requireElement('stage'),
  hud: requireElement('hud'),
  controls: requireElement('controls'),
});

if (import.meta.hot) {
  // Dev only: dispose the old instance on hot reload so canvases/listeners don't stack up.
  import.meta.hot.dispose(() => game.destroy());
}
