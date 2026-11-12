import { PolygonGeometry, radialPoints } from '../base/PolygonGeometry';

/** Star with `spikes` points, alternating outer and inner radius. */
export class StarGeometry extends PolygonGeometry {
  constructor(
    readonly outerRadius: number,
    readonly spikes = 5,
    readonly innerRatio = 0.45,
  ) {
    if (!Number.isInteger(spikes) || spikes < 3) {
      throw new RangeError(`spikes must be an integer >= 3, got ${spikes}`);
    }
    const inner = outerRadius * innerRatio;
    const step = Math.PI / spikes;
    super(
      radialPoints(
        spikes * 2,
        (i) => (i % 2 === 0 ? outerRadius : inner),
        (i) => -Math.PI / 2 + i * step,
      ),
    );
  }
}
