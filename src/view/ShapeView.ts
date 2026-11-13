import {Graphics} from 'pixi.js';
import type {ShapeModel} from '../model/entities/ShapeModel';

export type ShapeTapHandler = (model: ShapeModel) => void;

/**
 * Display object for one ShapeModel. Draws the geometry once when bound,
 * then only copies the position each frame.
 *
 * Instances are pooled: `bind`/`unbind` switch the model, so one Graphics
 * can show a triangle now and a star later. The tap listener is attached
 * once in the constructor, not on every bind, so reuse adds no listeners.
 */
export class ShapeView {
    readonly graphics = new Graphics();
    private model: ShapeModel | null = null;

    constructor(private readonly onTap: ShapeTapHandler) {
        this.graphics.eventMode = 'static';
        this.graphics.cursor = 'pointer';
        this.graphics.on('pointerdown', this.handlePointerDown);
    }

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
        this.graphics.clear();
        this.graphics.hitArea = null;
        this.graphics.visible = false;
    }

    sync(): void {
        if (this.model) {
            this.graphics.position.set(this.model.x, this.model.y);
        }
    }

    destroy(): void {
        this.model = null;
        this.graphics.off('pointerdown', this.handlePointerDown);
        this.graphics.destroy();
    }

    private readonly handlePointerDown = (): void => {
        if (this.model) this.onTap(this.model);
    };
}
