import { Application } from 'pixi.js';
import { DEFAULT_GRAVITY, DEFAULT_SPAWN_RATE } from './config/game';
import { GameController } from './controller/GameController';
import { ShapeFactory } from './factory/ShapeFactory';
import { GameModel } from './model/entities/GameModel';
import { ShapeSpawner } from './model/rules/ShapeSpawner';
import { HudView } from './view/HudView';
import { StageView } from './view/StageView';

/** DOM elements the game renders into. */
export interface GameHosts {
  /** Element the PIXI canvas is appended to and sized to. */
  stage: HTMLElement;
  /** Element the HTML counters are rendered into. */
  hud: HTMLElement;
}

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
    private readonly hudView: HudView,
    private readonly controller: GameController,
  ) {
    app.renderer.on('resize', this.handleResize);
    this.handleResize(app.screen.width, app.screen.height);
  }

  static async create(hosts: GameHosts): Promise<Game> {
    const app = new Application();
    await app.init({
      resizeTo: hosts.stage,
      antialias: true,
      backgroundAlpha: 0,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_RESOLUTION),
      autoDensity: true,
      preference: 'webgl',
    });
    hosts.stage.appendChild(app.canvas);

    const spawner = new ShapeSpawner(new ShapeFactory());
    const model = new GameModel(spawner, DEFAULT_GRAVITY, DEFAULT_SPAWN_RATE);
    const stageView = new StageView();
    app.stage.addChild(stageView);

    const hudView = new HudView(hosts.hud);

    const controller = new GameController(app.ticker, model, stageView, hudView);

    return new Game(app, model, stageView, hudView, controller);
  }

  // destroy - for dev reason,to avoid hot reload vite bug
  destroy(): void {
    this.app.renderer.off('resize', this.handleResize);
    this.controller.destroy();
    this.model.destroy();
    this.stageView.destroy();
    this.hudView.destroy();
    this.app.destroy({ removeView: true }, { children: true });
  }

  private readonly handleResize = (width: number, height: number): void => {
    this.stageView.layout(width, height);
    const field = this.stageView.size;
    this.model.setFieldSize(field.width, field.height);
  };
}
