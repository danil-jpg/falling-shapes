import type {ShapeGeometry} from '../geometry/base/ShapeGeometry';

/**
 * One falling shape: position, velocity, colour, plus a geometry (Strategy).
 * Pure data and physics; knows nothing about PIXI display objects.
 * `x`/`y` is the shape's centre in field coordinates.
 */
export class ShapeModel {
    /** Vertical velocity in px/s (positive = down). */
    vy = 0;

    constructor(
        readonly geometry: ShapeGeometry,
        readonly color: number,
        public x = 0,
        public y = 0,
    ) {
    }

    /** Update Method: advance one frame under constant acceleration `gravity` (px/s²). */
    update(dt: number, gravity: number): void {
        this.vy += gravity * dt;
        this.y += this.vy * dt;
    }

    get top(): number {
        return this.y + this.geometry.bounds.top;
    }

    get bottom(): number {
        return this.y + this.geometry.bounds.bottom;
    }

    get left(): number {
        return this.x + this.geometry.bounds.left;
    }

    get right(): number {
        return this.x + this.geometry.bounds.right;
    }

    /** True if any part of the shape's bounds overlaps the field. */
    intersectsField(width: number, height: number): boolean {
        return this.right > 0 && this.left < width && this.bottom > 0 && this.top < height;
    }
}
