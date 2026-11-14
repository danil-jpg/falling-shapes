import {Circle, type Graphics} from 'pixi.js';
import type {LocalBounds, ShapeGeometry} from '../base/ShapeGeometry';

export class CircleGeometry implements ShapeGeometry {
    readonly area: number;
    readonly bounds: LocalBounds;
    readonly hitArea: Circle;

    constructor(readonly radius: number) {
        // todo double check if this correct formula
        this.area = Math.PI * radius * radius;
        this.bounds = {left: -radius, top: -radius, right: radius, bottom: radius};
        this.hitArea = new Circle(0, 0, radius);
    }

    draw(g: Graphics, color: number): void {
        g.circle(0, 0, this.radius).fill(color);
    }

    spansAt(y: number, out: number[]): void {
        if (Math.abs(y) >= this.radius) return;
        const half = Math.sqrt(this.radius * this.radius - y * y);
        out.push(-half, half);
    }
}
