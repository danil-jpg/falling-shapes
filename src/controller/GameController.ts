import type {Ticker} from 'pixi.js';
import {MAX_FRAME_DT} from '../config/game';
import type {GameModel} from '../model/entities/GameModel';
import type {StageView} from '../view/StageView';

/**
 * Game Loop: once per frame it steps the model, then copies the result to the view.
 * It also connects model events to the view, so neither knows about the other.
 */
export class GameController {
    private readonly unsubscribers: Array<() => void>;

    constructor(
        private readonly ticker: Ticker,
        private readonly model: GameModel,
        private readonly stageView: StageView,
    ) {
        this.unsubscribers = [
            model.on('shapeAdded', (shape) => stageView.addShape(shape)),
            model.on('shapeRemoved', (shape) => stageView.removeShape(shape)),
        ];
        ticker.add(this.update);
    }

    destroy(): void {
        this.ticker.remove(this.update);
        for (const unsubscribe of this.unsubscribers) unsubscribe();
        this.unsubscribers.length = 0;
    }

    private readonly update = (ticker: Ticker): void => {
        const dt = Math.min(ticker.deltaMS / 1000, MAX_FRAME_DT);
        this.model.update(dt);
        this.stageView.syncShapes();
    };
}
