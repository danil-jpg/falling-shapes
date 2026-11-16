import {MAX_GRAVITY, MAX_SPAWN_RATE, MIN_GRAVITY, MIN_SPAWN_RATE, STATS_INTERVAL} from '../../config/game';
import {clamp} from '../../core/math';
import {TypedEventEmitter, type Listener} from '../../core/TypedEventEmitter';
import type {ShapeModel} from './ShapeModel';
import type {OccupiedAreaCalculator} from '../rules/OccupiedAreaCalculator';
import type {ShapeSpawner} from '../rules/ShapeSpawner';

/** What the HUD shows: shapes overlapping the field, and the area they cover. */
export interface FieldStats {
    count: number;
    /**
     * Field area covered by shapes in px², rounded to a whole number.
     * Overlaps count once; parts outside the field don't count.
     */
    area: number;
}

export interface GameModelEvents {
    shapeAdded: ShapeModel;
    shapeRemoved: ShapeModel;
    /** Emitted only when the count or the rounded area actually changes. */
    statsChanged: FieldStats;
    gravityChanged: number;
    spawnRateChanged: number;
}

/**
 * All game state and rules: the live shapes, gravity, spawn rate and field size.
 * `update(dt)` is one full simulation step: spawn, move, despawn.
 * No PIXI or DOM: views learn about changes through events (Observer).
 *
 * The emitter is composed, not inherited: outside code can only subscribe
 * via `on()`; emitting and clearing listeners stay private to the model.
 */
export class GameModel {
    private readonly events = new TypedEventEmitter<GameModelEvents>();
    private readonly _shapes: ShapeModel[] = [];
    private _width = 0;
    private _height = 0;
    private _stats: FieldStats = {count: 0, area: 0};
    /** Seconds since the stats were last recomputed. */
    private statsElapsed = 0;
    private _gravity: number;
    private _spawnRate: number;

    constructor(
        private readonly spawner: ShapeSpawner,
        private readonly areaCalculator: OccupiedAreaCalculator,
        gravity: number,
        spawnRate: number,
    ) {
        this._gravity = clamp(gravity, MIN_GRAVITY, MAX_GRAVITY);
        this._spawnRate = clamp(spawnRate, MIN_SPAWN_RATE, MAX_SPAWN_RATE);
    }

    /** Acceleration in px/s². */
    get gravity(): number {
        return this._gravity;
    }

    /** Shapes spawned per second. */
    get spawnRate(): number {
        return this._spawnRate;
    }

    /** Set gravity, clamped to [MIN_GRAVITY, MAX_GRAVITY]. Emits only if the value changes. */
    setGravity(value: number): void {
        const next = clamp(value, MIN_GRAVITY, MAX_GRAVITY);
        if (next === this._gravity) return;
        this._gravity = next;
        this.events.emit('gravityChanged', next);
    }

    /** Set spawn rate, clamped to [MIN_SPAWN_RATE, MAX_SPAWN_RATE]. Emits only if the value changes. */
    setSpawnRate(value: number): void {
        const next = clamp(value, MIN_SPAWN_RATE, MAX_SPAWN_RATE);
        if (next === this._spawnRate) return;
        this._spawnRate = next;
        this.events.emit('spawnRateChanged', next);
    }

    /** Subscribe to a model event. Returns a function that unsubscribes. */
    on<K extends keyof GameModelEvents>(event: K, listener: Listener<GameModelEvents[K]>): () => void {
        return this.events.on(event, listener);
    }

    destroy(): void {
        this.events.removeAllListeners();
        this._shapes.length = 0;
    }

    get shapes(): readonly ShapeModel[] {
        return this._shapes;
    }

    get stats(): Readonly<FieldStats> {
        return this._stats;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    setFieldSize(width: number, height: number): void {
        this._width = width;
        this._height = height;
    }

    add(shape: ShapeModel): void {
        this._shapes.push(shape);
        this.events.emit('shapeAdded', shape);
    }

    /** Bound once so the spawner callback allocates nothing per frame. */
    private readonly addShape = (shape: ShapeModel): void => this.add(shape);

    /** Spawn a new shape centred at (x, y) in field coordinates; it starts falling from there. */
    spawnAt(x: number, y: number): void {
        this.add(this.spawner.createAt(x, y));
        // A tap should show in the HUD at once, not up to STATS_INTERVAL later.
        this.refreshStats();
    }

    remove(shape: ShapeModel): void {
        const index = this._shapes.indexOf(shape);
        if (index === -1) return;
        this.removeAt(index);
        this.refreshStats();
    }

    /**
     * Spawn due shapes, move every shape, drop the ones that have fully left the bottom.
     * Stats are refreshed every STATS_INTERVAL seconds, not every frame.
     */
    update(dt: number): void {
        this.spawner.update(dt, this._spawnRate, this._width, this.addShape);

        // Walk backwards so swap-removal never skips an element.
        for (let i = this._shapes.length - 1; i >= 0; i--) {
            const shape = this._shapes[i];
            shape.update(dt, this._gravity);
            if (shape.top > this._height) {
                this.removeAt(i);
            }
        }

        this.statsElapsed += dt;
        if (this.statsElapsed >= STATS_INTERVAL) {
            this.refreshStats();
        }
    }

    /**
     * Count: shapes whose bounds overlap the field, including ones only partly inside
     * (shapes still waiting above the top edge don't count).
     * Area: the field surface they cover, with overlaps counted once (OccupiedAreaCalculator).
     * Called at most every STATS_INTERVAL from update(), plus right after a tap.
     * Emits only on change.
     */
    private refreshStats(): void {
        this.statsElapsed = 0;
        let count = 0;
        for (const shape of this._shapes) {
            if (shape.intersectsField(this._width, this._height)) count++;
        }
        const area = Math.round(this.areaCalculator.measure(this._shapes, this._width, this._height));

        if (count === this._stats.count && area === this._stats.area) return;
        this._stats = {count, area};
        this.events.emit('statsChanged', this._stats);
    }

    /** O(1) removal: move the last element into the hole. Draw order is kept by the view, not this array. */
    private removeAt(index: number): void {
        const shape = this._shapes[index];
        const last = this._shapes.pop()!;
        if (index < this._shapes.length) {
            this._shapes[index] = last;
        }
        this.events.emit('shapeRemoved', shape);
    }
}
