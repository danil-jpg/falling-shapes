import {TypedEventEmitter, type Listener} from '../../core/TypedEventEmitter';
import type {ShapeModel} from './ShapeModel';
import type {ShapeSpawner} from '../rules/ShapeSpawner';

export interface GameModelEvents {
    shapeAdded: ShapeModel;
    shapeRemoved: ShapeModel;
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

    constructor(
        private readonly spawner: ShapeSpawner,
        /** Acceleration in px/s². */
        public gravity: number,
        /** Shapes spawned per second. */
        public spawnRate: number,
    ) {
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

    remove(shape: ShapeModel): void {
        const index = this._shapes.indexOf(shape);
        if (index === -1) return;
        this.removeAt(index);
    }

    /** Spawn due shapes, move every shape, and drop the ones that have fully left the bottom. */
    update(dt: number): void {
        this.spawner.update(dt, this.spawnRate, this._width, this.addShape);

        // Walk backwards so swap-removal never skips an element.
        for (let i = this._shapes.length - 1; i >= 0; i--) {
            const shape = this._shapes[i];
            shape.update(dt, this.gravity);
            if (shape.top > this._height) {
                this.removeAt(i);
            }
        }
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
