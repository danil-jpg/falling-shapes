import {ELLIPSE_ASPECT, SHAPE_MAX_RADIUS, SHAPE_MIN_RADIUS} from '../config/geometry';
import {SHAPE_LIGHTNESS, SHAPE_SATURATION} from '../config/visual';
import {hslToHex} from '../core/color';
import type {RandomFn} from '../core/random';
import type {ShapeGeometry} from '../geometry/base/ShapeGeometry';
import {CircleGeometry} from '../geometry/shapes/CircleGeometry';
import {EllipseGeometry} from '../geometry/shapes/EllipseGeometry';
import {IrregularPolygonGeometry} from '../geometry/shapes/IrregularPolygonGeometry';
import {RegularPolygonGeometry} from '../geometry/shapes/RegularPolygonGeometry';
import {StarGeometry} from '../geometry/shapes/StarGeometry';
import {ShapeModel} from '../model/entities/ShapeModel';

export type ShapeType = 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'circle' | 'ellipse' | 'star';

/** Builds a geometry of a given size (see SHAPE_MIN_RADIUS for what "size" means). */
export type GeometryCreator = (size: number) => ShapeGeometry;

/** The shape types from the spec (bonus 2h). */
export function createDefaultRegistry(): Map<ShapeType, GeometryCreator> {
    return new Map<ShapeType, GeometryCreator>([
        ['triangle', (size) => new RegularPolygonGeometry(3, size)],
        ['square', (size) => new RegularPolygonGeometry(4, size)],
        ['pentagon', (size) => new RegularPolygonGeometry(5, size)],
        ['hexagon', (size) => new RegularPolygonGeometry(6, size)],
        ['circle', (size) => new CircleGeometry(size)],
        ['ellipse', (size) => new EllipseGeometry(size, size * ELLIPSE_ASPECT)],
        ['star', (size) => new StarGeometry(size)],
    ]);
}

/**
 * Factory: the one place that decides a new shape's type, size and colour.
 * Callers (spawner, tap handler) only position the result.
 *
 * Shape types come from a registry instead of a switch, so adding a type
 * is one `register()` call and this class doesn't change (Open/Closed).
 */
export class ShapeFactory {
    private types: ShapeType[];

    constructor(
        private readonly registry: Map<ShapeType, GeometryCreator> = createDefaultRegistry(),
        private readonly random: RandomFn = Math.random,
    ) {
        this.types = [...registry.keys()];
    }

    register(type: ShapeType, create: GeometryCreator): void {
        this.registry.set(type, create);
        this.types = [...this.registry.keys()];
    }

    /** A random registered type with a random size and colour, at the origin. */
    createRandom(): ShapeModel {
        const type = this.types[Math.floor(this.random() * this.types.length)];
        const create = this.registry.get(type)!;
        return new ShapeModel(create(this.randomSize()), this.randomColor());
    }

    /** A random irregular polygon (bonus 3a) with a random colour, at the origin. */
    createIrregular(): ShapeModel {
        return new ShapeModel(new IrregularPolygonGeometry(this.randomSize(), this.random), this.randomColor());
    }

    private randomSize(): number {
        return SHAPE_MIN_RADIUS + this.random() * (SHAPE_MAX_RADIUS - SHAPE_MIN_RADIUS);
    }

    private randomColor(): number {
        return hslToHex(this.random() * 360, SHAPE_SATURATION, SHAPE_LIGHTNESS);
    }
}
