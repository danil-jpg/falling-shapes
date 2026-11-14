import {Polygon, type Graphics} from 'pixi.js';
import type {LocalBounds, ShapeGeometry} from './ShapeGeometry';

/**
 * Base for every vertex-based shape (regular polygons, star, irregular).
 * Subclasses only generate vertices; area, bounds, hit area and drawing
 * are shared here.
 */
export abstract class PolygonGeometry implements ShapeGeometry {
    readonly area: number;
    readonly bounds: LocalBounds;
    readonly hitArea: Polygon;

    /** Flat [x0, y0, x1, y1, ...] list, the format PIXI uses. */
    protected readonly points: readonly number[];

    protected constructor(points: number[]) {
        this.points = points;
        this.area = polygonArea(points);
        this.bounds = polygonBounds(points);
        this.hitArea = new Polygon(points);
    }

    draw(g: Graphics, color: number): void {
        g.poly(this.points as number[]).fill(color);
    }

    /**
     * Find where each edge crosses the line, sort the crossings, and pair them up
     * (even-odd rule). Works for concave shapes like the star and irregular polygons.
     * Half-open edge test (y1 <= y < y2) so a vertex exactly on the line counts once.
     */
    spansAt(y: number, out: number[]): void {
        if (y < this.bounds.top || y >= this.bounds.bottom) return;

        const crossings = scratchCrossings;
        crossings.length = 0;
        const p = this.points;
        const n = p.length;
        for (let i = 0; i < n; i += 2) {
            const j = (i + 2) % n;
            const y1 = p[i + 1];
            const y2 = p[j + 1];
            if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
                const x1 = p[i];
                crossings.push(x1 + ((y - y1) / (y2 - y1)) * (p[j] - x1));
            }
        }

        crossings.sort(ascending);
        for (let k = 0; k + 1 < crossings.length; k += 2) {
            out.push(crossings[k], crossings[k + 1]);
        }
    }
}

/** Reused by every spansAt() call so measuring area allocates nothing per frame. */
const scratchCrossings: number[] = [];
const ascending = (a: number, b: number): number => a - b;

/**
 * Shoelace formula. Exact for any simple (non-self-intersecting) polygon,
 * convex or concave, whatever the winding direction.
 */
export function polygonArea(points: readonly number[]): number {
    let twiceArea = 0;
    const n = points.length;
    for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        twiceArea += points[i] * points[j + 1] - points[j] * points[i + 1];
    }
    return Math.abs(twiceArea) / 2;
}

function polygonBounds(points: readonly number[]): LocalBounds {
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (let i = 0; i < points.length; i += 2) {
        const x = points[i];
        const y = points[i + 1];
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
    }
    return {left, top, right, bottom};
}

/** Build `count` vertices around the origin from per-vertex radius and angle (radians). */
export function radialPoints(
    count: number,
    radiusAt: (index: number) => number,
    angleAt: (index: number) => number,
): number[] {
    const points = new Array<number>(count * 2);
    for (let i = 0; i < count; i++) {
        const r = radiusAt(i);
        const a = angleAt(i);
        points[i * 2] = Math.cos(a) * r;
        points[i * 2 + 1] = Math.sin(a) * r;
    }
    return points;
}
