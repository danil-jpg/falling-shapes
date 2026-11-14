import type {Ticker} from 'pixi.js';
import {MAX_FRAME_DT} from '../config/game';
import type {FieldStats, GameModel} from '../model/entities/GameModel';
import type {ShapeModel} from '../model/entities/ShapeModel';
import type {HudView} from '../view/HudView';
import type {StageView} from '../view/StageView';

/**
 * Game Loop: once per frame it steps the model, then copies the result to the view.
 * It also connects model and view in both directions, so neither knows about the other:
 * model events → view updates, and view input (taps) → model actions.
 */
export class GameController {
    private readonly unsubscribers: Array<() => void>;

    constructor(
        private readonly ticker: Ticker,
        private readonly model: GameModel,
        private readonly stageView: StageView,
        private readonly hudView: HudView,
    ) {
        this.unsubscribers = [
            model.on('shapeAdded', this.handleShapeAdded),
            model.on('shapeRemoved', this.handleShapeRemoved),
            model.on('statsChanged', this.handleStatsChanged),
        ];
        hudView.render(model.stats);
        stageView.onFieldTap((x, y) => model.spawnAt(x, y));
        stageView.onShapeTap((shape) => model.remove(shape));
        ticker.add(this.update);
    }

    destroy(): void {
        this.ticker.remove(this.update);
        this.stageView.onFieldTap(null);
        this.stageView.onShapeTap(null);
        for (const unsubscribe of this.unsubscribers) unsubscribe();
        this.unsubscribers.length = 0;
    }

    // Arrow-function fields keep `this` bound, so they can be passed to model.on() directly.
    private readonly handleShapeAdded = (shape: ShapeModel): void => {
        this.stageView.addShape(shape);
    };

    private readonly handleShapeRemoved = (shape: ShapeModel): void => {
        this.stageView.removeShape(shape);
    };

    private readonly handleStatsChanged = (stats: FieldStats): void => {
        this.hudView.render(stats);
    };

    private readonly update = (ticker: Ticker): void => {
        const dt = Math.min(ticker.deltaMS / 1000, MAX_FRAME_DT);
        this.model.update(dt);
        this.stageView.syncShapes();
    };
}
