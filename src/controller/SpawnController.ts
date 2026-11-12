import type {RandomFn} from '../core/random';
import type {ShapeFactory} from '../factory/ShapeFactory';
import type {GameModel} from '../model/GameModel';

/**
 * Spawns shapes above the field at `model.spawnRate` per second.
 *
 * Uses a time accumulator driven by the game loop instead of `setInterval`:
 * it pauses with the ticker (and in hidden tabs), picks up rate changes
 * on the next frame, and never drifts from the simulation clock.
 */
export class SpawnController {
    private elapsed = 0;

    constructor(
        private readonly model: GameModel,
        private readonly factory: ShapeFactory,
        private readonly random: RandomFn = Math.random,
    ) {
    }

    update(dt: number): void {
        const rate = this.model.spawnRate;
        if (rate <= 0 || this.model.width <= 0) return;

        const interval = 1 / rate;
        this.elapsed += dt;
        while (this.elapsed >= interval) {
            this.elapsed -= interval;
            this.spawnAboveField();
        }
    }

    /** Random x where the whole shape fits horizontally; y so its bottom edge touches the field top. */
    private spawnAboveField(): void {
        const shape = this.factory.createRandom();
        const {left, right, bottom} = shape.geometry.bounds;

        const minX = -left;
        const maxX = this.model.width - right;
        shape.x = maxX > minX ? minX + this.random() * (maxX - minX) : this.model.width / 2;
        shape.y = -bottom;

        this.model.add(shape);
    }
}
