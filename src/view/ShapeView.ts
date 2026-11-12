import {Graphics} from 'pixi.js';
import type {ShapeModel} from '../model/ShapeModel';

/**
 * Display object for one ShapeModel. Draws the geometry once when bound,
 * then only copies the position each frame.
 *
 * `bind`/`unbind` are separate from construction so step 4 can reuse
 * instances from an object pool instead of allocating a new Graphics per shape.
 */
export class ShapeView {
    readonly graphics = new Graphics();
    private model: ShapeModel | null = null;

    bind(model: ShapeModel): void {
        this.model = model;
        this.graphics.clear();
        model.geometry.draw(this.graphics, model.color);
        this.graphics.hitArea = model.geometry.hitArea;
        this.graphics.visible = true;
        this.sync();
    }

    unbind(): void {
        this.model = null;
        this.graphics.visible = false;
    }

    sync(): void {
        if (this.model) {
            this.graphics.position.set(this.model.x, this.model.y);
        }
    }

    destroy(): void {
        this.model = null;
        this.graphics.destroy();
    }
}
