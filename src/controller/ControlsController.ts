import {
    GRAVITY_STEP,
    MAX_GRAVITY,
    MAX_SPAWN_RATE,
    MIN_GRAVITY,
    MIN_SPAWN_RATE,
    SPAWN_RATE_STEP,
} from '../config/game';
import type {GameModel} from '../model/entities/GameModel';
import type {ControlName, ControlsView, StepDirection} from '../view/ControlsView';

/**
 * Connects the +/- controls to the model's settings.
 *
 * Button press → model setter (the model clamps the value).
 * Model change event → updated text and button states.
 * The view is updated from the model's events, not from the click,
 * so it always shows the model's real (clamped) value.
 */
export class ControlsController {
    private readonly unsubscribers: Array<() => void>;

    constructor(
        private readonly model: GameModel,
        private readonly view: ControlsView,
    ) {
        this.unsubscribers = [
            model.on('spawnRateChanged', this.renderSpawnRate),
            model.on('gravityChanged', this.renderGravity),
        ];
        view.onStep(this.handleStep);
        this.renderSpawnRate();
        this.renderGravity();
    }

    destroy(): void {
        this.view.onStep(null);
        for (const unsubscribe of this.unsubscribers) unsubscribe();
        this.unsubscribers.length = 0;
    }

    private readonly handleStep = (control: ControlName, direction: StepDirection): void => {
        if (control === 'spawnRate') {
            this.model.setSpawnRate(this.model.spawnRate + direction * SPAWN_RATE_STEP);
        } else {
            this.model.setGravity(this.model.gravity + direction * GRAVITY_STEP);
        }
    };

    // Arrow-function fields keep `this` bound, so they can be passed to model.on() directly.
    private readonly renderSpawnRate = (): void => {
        const rate = this.model.spawnRate;
        this.view.render('spawnRate', `${rate} /s`, rate <= MIN_SPAWN_RATE, rate >= MAX_SPAWN_RATE);
    };

    private readonly renderGravity = (): void => {
        const gravity = this.model.gravity;
        this.view.render('gravity', `${gravity}`, gravity <= MIN_GRAVITY, gravity >= MAX_GRAVITY);
    };
}
