import {clamp} from '../../core/math';
import type {ShapeModel} from '../entities/ShapeModel';

/**
 * Simulation rule: how many px² of the field are covered by shapes.
 * Overlapping regions count once, and parts outside the field don't count.
 *
 * Scan-line method: sample the field in horizontal rows. On each row every shape
 * covers a few x-intervals (`geometry.spansAt`). Clip them to the field, merge
 * them so overlaps count once, and add `merged length × row height`.
 * Exact horizontally; vertically the only error is from sampling row midpoints
 * (about 0.1% at 1 px rows, mostly on curved edges). No library, no pixel buffer.
 *
 * All scratch arrays are reused, so a measurement allocates nothing.
 */
export class OccupiedAreaCalculator {
    private readonly spans: number[] = [];
    private readonly starts: number[] = [];
    private readonly ends: number[] = [];

    /** @param rowStep Row height in px. Larger is cheaper and less precise. */
    constructor(private readonly rowStep: number) {
    }

    measure(shapes: readonly ShapeModel[], width: number, height: number): number {
        if (shapes.length === 0 || width <= 0 || height <= 0) return 0;

        // Only sample rows where at least one shape can be.
        let minTop = Infinity;
        let maxBottom = -Infinity;
        for (const shape of shapes) {
            if (shape.top < minTop) minTop = shape.top;
            if (shape.bottom > maxBottom) maxBottom = shape.bottom;
        }
        const top = clamp(minTop, 0, height);
        const bottom = clamp(maxBottom, 0, height);

        const step = this.rowStep;
        let area = 0;
        for (let y = (Math.floor(top / step) + 0.5) * step; y < bottom; y += step) {
            area += this.coveredLength(shapes, y, width) * step;
        }
        return area;
    }

    /** Total length of the union of all shapes' intervals on row `y`, clipped to [0, width]. */
    private coveredLength(shapes: readonly ShapeModel[], y: number, width: number): number {
        const {spans, starts, ends} = this;
        starts.length = 0;
        ends.length = 0;

        for (const shape of shapes) {
            if (y < shape.top || y >= shape.bottom) continue;
            spans.length = 0;
            shape.geometry.spansAt(y - shape.y, spans);
            for (let k = 0; k < spans.length; k += 2) {
                const a = clamp(shape.x + spans[k], 0, width);
                const b = clamp(shape.x + spans[k + 1], 0, width);
                if (b > a) {
                    starts.push(a);
                    ends.push(b);
                }
            }
        }

        const n = starts.length;
        if (n === 0) return 0;
        if (n === 1) return ends[0] - starts[0];

        // Union length depends only on the sets of starts and ends, so sort them
        // separately and sweep with a depth counter: covered while depth > 0.
        starts.sort(ascending);
        ends.sort(ascending);
        let covered = 0;
        let depth = 0;
        let openedAt = 0;
        let i = 0;
        let j = 0;
        while (i < n) {
            if (starts[i] <= ends[j]) {
                if (depth === 0) openedAt = starts[i];
                depth++;
                i++;
            } else {
                depth--;
                if (depth === 0) covered += ends[j] - openedAt;
                j++;
            }
        }
        // All starts used: the remaining ends close the last open run at the largest end.
        return covered + (ends[n - 1] - openedAt);
    }
}

const ascending = (a: number, b: number): number => a - b;
