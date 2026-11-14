import type { Graphics, IHitArea } from 'pixi.js';

/** Axis-aligned bounds relative to the shape's origin (its centre). */
export interface LocalBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Strategy: everything that differs between shape types.
 *
 * A shape (model) holds one geometry and treats all types the same way;
 * only drawing, area and bounds vary. Geometries are immutable, and every
 * derived value is computed once in the constructor, so nothing is
 * recalculated per frame.
 */
export interface ShapeGeometry {
  /** Surface area in px². */
  readonly area: number;
  /** Bounds around the origin; used for spawn/despawn and visibility checks. */
  readonly bounds: LocalBounds;
  /** Exact clickable region (cheaper than hit-testing the Graphics path). */
  readonly hitArea: IHitArea;
  /** Draw into `g` centred on its origin. The caller clears `g` first. */
  draw(g: Graphics, color: number): void;
  /**
   * Cross-section: push [x0, x1, x2, x3, ...] pairs (local x) where the shape
   * covers the horizontal line at local `y`. Pushes nothing if the line misses.
   * Used to measure the area covered by overlapping shapes.
   */
  spansAt(y: number, out: number[]): void;
}
