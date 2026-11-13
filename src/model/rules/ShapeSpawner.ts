import type {RandomFn} from '../../core/random';
import type {ShapeFactory} from '../../factory/ShapeFactory';
import type {ShapeModel} from '../entities/ShapeModel';

/**
 * Simulation rule: "spawn `rate` shapes per second at a random x above the field".
 * Owned and driven by GameModel, so the whole simulation step lives in the model.
 *
 * Uses a time accumulator on the game clock instead of `setInterval`:
 * it pauses with the loop (and in hidden tabs), picks up rate changes
 * on the next frame, and never drifts from the simulation.
 */
export class ShapeSpawner {
    private elapsed = 0;

    constructor(
        private readonly factory: ShapeFactory,
        private readonly random: RandomFn = Math.random,
    ) {
    }

    /** Advance the timer and hand every shape that is due to `spawn`. */
    update(dt: number, rate: number, fieldWidth: number, spawn: (shape: ShapeModel) => void): void {
        if (rate <= 0 || fieldWidth <= 0) return;

        const interval = 1 / rate;
        this.elapsed += dt;
        while (this.elapsed >= interval) {
            this.elapsed -= interval;
            spawn(this.createAboveField(fieldWidth));
        }
    }

    /** Random x where the whole shape fits horizontally; y so its bottom edge touches the field top. */
    private createAboveField(fieldWidth: number): ShapeModel {
        const shape = this.factory.createRandom();
        const {left, right, bottom} = shape.geometry.bounds;

        const minX = -left;
        const maxX = fieldWidth - right;
        shape.x = maxX > minX ? minX + this.random() * (maxX - minX) : fieldWidth / 2;
        shape.y = -bottom;
        return shape;
    }
}
