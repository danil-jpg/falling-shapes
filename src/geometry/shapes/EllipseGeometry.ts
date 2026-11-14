import {Ellipse, type Graphics} from 'pixi.js';
import type {LocalBounds, ShapeGeometry} from '../base/ShapeGeometry';

export class EllipseGeometry implements ShapeGeometry {
    readonly area: number;
    readonly bounds: LocalBounds;
    readonly hitArea: Ellipse;

    /** `radiusX` and `radiusY` are the semi-axes (half of width and height). */
    constructor(
        readonly radiusX: number,
        readonly radiusY: number,
    ) {
        this.area = Math.PI * radiusX * radiusY;
        this.bounds = {left: -radiusX, top: -radiusY, right: radiusX, bottom: radiusY};
        this.hitArea = new Ellipse(0, 0, radiusX, radiusY);
    }

    draw(g: Graphics, color: number): void {
        g.ellipse(0, 0, this.radiusX, this.radiusY).fill(color);
    }

    spansAt(y: number, out: number[]): void {
        if (Math.abs(y) >= this.radiusY) return;
        const t = y / this.radiusY;
        const half = this.radiusX * Math.sqrt(1 - t * t);
        out.push(-half, half);
    }
}
