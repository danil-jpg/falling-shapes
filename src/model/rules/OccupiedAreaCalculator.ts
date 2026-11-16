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
    /** Shapes overlapping the field, sorted by top edge. */
    private readonly candidates: ShapeModel[] = [];
    /** Shapes crossing the current row. */
    private readonly active: ShapeModel[] = [];

    /** @param rowStep Row height in px. Larger is cheaper and less precise. */
    constructor(private readonly rowStep: number) {
    }

    measure(shapes: readonly ShapeModel[], width: number, height: number): number {
        if (shapes.length === 0 || width <= 0 || height <= 0) return 0;

        // Shapes still above the field or already below it never cover a row: skip them up front.
        const {candidates, active} = this;
        candidates.length = 0;
        active.length = 0;
        let maxBottom = -Infinity;
        for (const shape of shapes) {
            if (!shape.intersectsField(width, height)) continue;
            candidates.push(shape);
            if (shape.bottom > maxBottom) maxBottom = shape.bottom;
        }
        if (candidates.length === 0) return 0;
        candidates.sort(byTop);

        const step = this.rowStep;
        const bottom = clamp(maxBottom, 0, height);
        let next = 0; // next candidate not yet active
        let area = 0;
        let y = (Math.floor(clamp(candidates[0].top, 0, height) / step) + 0.5) * step;

        while (y < bottom) {
            // Shapes reach the row in top order; shapes leave once the row passes their bottom.
            while (next < candidates.length && candidates[next].top <= y) {
                active.push(candidates[next++]);
            }
            removeFinished(active, y);

            if (active.length === 0) {
                // Gap with no shapes: jump to the next shape's first row instead of stepping through it.
                if (next >= candidates.length) break;
                y = (Math.floor(candidates[next].top / step) + 0.5) * step;
                if (candidates[next].top > y) y += step;
                continue;
            }

            area += this.coveredLength(active, y, width) * step;
            y += step;
        }
        return area;
    }

    /** Total length of the union of the active shapes' intervals on row `y`, clipped to [0, width]. */
    private coveredLength(shapes: readonly ShapeModel[], y: number, width: number): number {
        const {spans, starts, ends} = this;
        starts.length = 0;
        ends.length = 0;

        for (const shape of shapes) {
            if (y < shape.top) continue;
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
const byTop = (a: ShapeModel, b: ShapeModel): number => a.top - b.top;

/** Drop shapes whose bottom is at or above row `y`, compacting the array in place. */
function removeFinished(active: ShapeModel[], y: number): void {
    let kept = 0;
    for (let i = 0; i < active.length; i++) {
        if (active[i].bottom > y) active[kept++] = active[i];
    }
    active.length = kept;
}
