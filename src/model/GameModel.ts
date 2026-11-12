import {TypedEventEmitter} from '../core/TypedEventEmitter';
import type {ShapeModel} from './ShapeModel';

export interface GameModelEvents {
    shapeAdded: ShapeModel;
    shapeRemoved: ShapeModel;
}

/**
 * All game state and rules: the live shapes, gravity, spawn rate and field size.
 * No PIXI or DOM: views learn about changes through events (Observer).
 */
export class GameModel extends TypedEventEmitter<GameModelEvents> {
    private readonly _shapes: ShapeModel[] = [];
    private _width = 0;
    private _height = 0;

    constructor(
        /** Acceleration in px/s². */
        public gravity: number,
        /** Shapes spawned per second. */
        public spawnRate: number,
    ) {
        super();
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
        this.emit('shapeAdded', shape);
    }

    remove(shape: ShapeModel): void {
        const index = this._shapes.indexOf(shape);
        if (index === -1) return;
        this.removeAt(index);
    }

    /** Move every shape and drop the ones that have fully left the bottom of the field. */
    update(dt: number): void {
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
        this.emit('shapeRemoved', shape);
    }
}
