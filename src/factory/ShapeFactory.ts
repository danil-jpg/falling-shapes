import {SHAPE_RADIUS} from '../config/geometry';
import {DEFAULT_SHAPE_COLOR} from '../config/visual';
import {RegularPolygonGeometry} from '../geometry/shapes/RegularPolygonGeometry';
import {ShapeModel} from '../model/ShapeModel';

/**
 * Factory: the one place that decides a new shape's type and colour.
 * Callers (spawner, click handler) only position the result.
 *
 * Step 3: triangles in a single colour. Step 6 adds the registry of all
 * shape types, random colours and irregular shapes.
 */
export class ShapeFactory {
    /** Create a shape at the origin; the caller sets its position. */
    createRandom(): ShapeModel {
        return new ShapeModel(new RegularPolygonGeometry(3, SHAPE_RADIUS), DEFAULT_SHAPE_COLOR);
    }
}
