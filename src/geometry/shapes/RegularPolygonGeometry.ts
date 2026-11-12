import { PolygonGeometry, radialPoints } from '../base/PolygonGeometry';

/** Regular polygon with 3+ sides, inscribed in a circle of `radius`. */
export class RegularPolygonGeometry extends PolygonGeometry {
  constructor(
    readonly sides: number,
    readonly radius: number,
  ) {
    if (!Number.isInteger(sides) || sides < 3) {
      throw new RangeError(`sides must be an integer >= 3, got ${sides}`);
    }
    const step = (Math.PI * 2) / sides;
    // Odd sides point up (triangle, pentagon); even sides sit on a flat base (square, hexagon).
    const start = -Math.PI / 2 + (sides % 2 === 0 ? step / 2 : 0);
    super(radialPoints(sides, () => radius, (i) => start + i * step));
  }
}
