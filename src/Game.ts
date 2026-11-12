import { Application } from 'pixi.js';
import { DEFAULT_GRAVITY, DEFAULT_SPAWN_RATE } from './config/game';
import { GameController } from './controller/GameController';
import { SpawnController } from './controller/SpawnController';
import { ShapeFactory } from './factory/ShapeFactory';
import { GameModel } from './model/GameModel';
import { StageView } from './view/StageView';

/** Cap device pixel ratio: 3x phones gain little visually but pay 2.25x fill-rate vs 2x. */
const MAX_RESOLUTION = 2;

/**
 * Owns the application lifecycle. `create()` builds and wires every object
 * (composition root); `destroy()` tears everything down so nothing leaks
 * (listeners, GPU textures, the canvas element).
 */
export class Game {
  private constructor(
    private readonly app: Application,
    private readonly model: GameModel,
    private readonly stageView: StageView,
    private readonly controller: GameController,
  ) {
    app.renderer.on('resize', this.handleResize);
    this.handleResize(app.screen.width, app.screen.height);
  }

  static async create(host: HTMLElement): Promise<Game> {
    const app = new Application();
    await app.init({
      resizeTo: host,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_RESOLUTION),
      autoDensity: true,
      preference: 'webgl',
    });
    host.appendChild(app.canvas);

    const model = new GameModel(DEFAULT_GRAVITY, DEFAULT_SPAWN_RATE);
    const stageView = new StageView();
    app.stage.addChild(stageView);

    const spawner = new SpawnController(model, new ShapeFactory());
    const controller = new GameController(app.ticker, model, stageView, spawner);

    return new Game(app, model, stageView, controller);
  }

  // destroy - for dev reason,to avoid hot reload vite bug
  destroy(): void {
    this.app.renderer.off('resize', this.handleResize);
    this.controller.destroy();
    this.model.removeAllListeners();
    this.stageView.destroy();
    this.app.destroy({ removeView: true }, { children: true });
  }

  private readonly handleResize = (width: number, height: number): void => {
    this.stageView.layout(width, height);
    const field = this.stageView.size;
    this.model.setFieldSize(field.width, field.height);
  };
}
