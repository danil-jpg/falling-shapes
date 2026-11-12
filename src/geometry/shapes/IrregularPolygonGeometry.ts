import {PolygonGeometry, radialPoints} from '../base/PolygonGeometry';
import {MAX_VERTICES, MIN_RADIUS_RATIO, MIN_VERTICES} from '../../config/geometry';
import type {RandomFn} from '../../core/random';

// todo double check if this true
/**
 * Random irregular polygon (bonus 3a).
 *
 * The vertex angles are random but sorted, and each vertex gets a random
 * radius. Walking around the centre in angle order means edges can never
 * cross, so the polygon is always simple (possibly concave) and the shoelace
 * area stays exact.
 */
export class IrregularPolygonGeometry extends PolygonGeometry {
    constructor(maxRadius: number, random: RandomFn = Math.random) {
        const count = MIN_VERTICES + Math.floor(random() * (MAX_VERTICES - MIN_VERTICES + 1));

        const angles = new Array<number>(count);
        for (let i = 0; i < count; i++) {
            // Jitter within equal slices: angles come out sorted, and no two vertices
            // bunch up so closely that the shape turns into a thin sliver.
            angles[i] = ((i + 0.15 + random() * 0.7) / count) * Math.PI * 2;
        }

        super(
            radialPoints(
                count,
                () => maxRadius * (MIN_RADIUS_RATIO + random() * (1 - MIN_RADIUS_RATIO)),
                (i) => angles[i],
            ),
        );
    }
}
