import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { BORDER_COLOR, BORDER_WIDTH, FIELD_FILL, FIELD_INSET } from '../config/visual';
import type { ShapeModel } from '../model/ShapeModel';
import { ShapeView } from './ShapeView';

export type FieldTapHandler = (x: number, y: number) => void;

/**
 * Passive view for the play field (the "rectangle" from the spec).
 *
 * Display tree:
 *   StageView
 *   └─ field (positioned at the inset, so children use field-local coords 0..width)
 *      ├─ background   – fill + hit area; taps on empty space land here
 *      ├─ shapeLayer   – falling shapes live here, clipped by `clipMask`
 *      ├─ clipMask     – rectangular mask (PIXI renders it as a cheap GPU scissor)
 *      └─ border       – drawn on top so shapes slide under the frame
 *
 * The view holds no game rules; it only knows geometry and forwards input.
 */
export class StageView extends Container {
  /** Container that shape views are added to. Coordinates are field-local. */
  public readonly shapeLayer = new Container();

  private readonly field = new Container();
  private readonly background = new Graphics();
  private readonly clipMask = new Graphics();
  private readonly border = new Graphics();
  private readonly hitRect = new Rectangle();
  private readonly shapeViews = new Map<ShapeModel, ShapeView>();

  private fieldWidth = 0;
  private fieldHeight = 0;
  private tapHandler: FieldTapHandler | null = null;

  constructor() {
    super();

    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';
    this.background.hitArea = this.hitRect;
    this.background.on('pointerdown', this.handleBackgroundPointerDown);

    // Mask must be in the display list so it follows the field transform.
    this.shapeLayer.mask = this.clipMask;
    // Shapes are not interactive yet; avoid hit-testing their subtree until they are.
    this.shapeLayer.eventMode = 'passive';
    this.border.eventMode = 'none';
    this.clipMask.eventMode = 'none';

    this.field.addChild(this.background, this.shapeLayer, this.clipMask, this.border);
    this.addChild(this.field);
  }

  /** Field size in px; the model uses this for spawn/despawn bounds. */
  get size(): Readonly<{ width: number; height: number }> {
    return { width: this.fieldWidth, height: this.fieldHeight };
  }

  /** Register the controller callback for taps on empty field space. */
  onFieldTap(handler: FieldTapHandler | null): void {
    this.tapHandler = handler;
  }

  /**
   * Fit the field to the canvas. Called on init and on every renderer resize.
   * Redrawing three rectangles is cheap and only happens on resize, never per frame.
   */
  layout(screenWidth: number, screenHeight: number): void {
    const w = Math.max(0, Math.floor(screenWidth - FIELD_INSET * 2));
    const h = Math.max(0, Math.floor(screenHeight - FIELD_INSET * 2));
    if (w === this.fieldWidth && h === this.fieldHeight) return;

    this.fieldWidth = w;
    this.fieldHeight = h;
    this.field.position.set(FIELD_INSET, FIELD_INSET);

    this.background.clear().rect(0, 0, w, h).fill(FIELD_FILL);
    this.hitRect.width = w;
    this.hitRect.height = h;

    this.clipMask.clear().rect(0, 0, w, h).fill(0xffffff);

    // Stroke centred on the field edge, drawn above shapes so they slide under the frame.
    this.border
      .clear()
      .rect(0, 0, w, h)
      .stroke({ width: BORDER_WIDTH, color: BORDER_COLOR, alignment: 0.5 });
  }

  addShape(model: ShapeModel): void {
    const view = new ShapeView();
    view.bind(model);
    this.shapeLayer.addChild(view.graphics);
    this.shapeViews.set(model, view);
  }

  removeShape(model: ShapeModel): void {
    const view = this.shapeViews.get(model);
    if (!view) return;
    this.shapeViews.delete(model);
    this.shapeLayer.removeChild(view.graphics);
    view.destroy();
  }

  /** Copy model positions to their display objects. Called once per frame. */
  syncShapes(): void {
    for (const view of this.shapeViews.values()) {
      view.sync();
    }
  }

  override destroy(): void {
    this.background.off('pointerdown', this.handleBackgroundPointerDown);
    this.tapHandler = null;
    for (const view of this.shapeViews.values()) {
      view.destroy();
    }
    this.shapeViews.clear();
    super.destroy({ children: true });
  }

  private readonly handleBackgroundPointerDown = (e: FederatedPointerEvent): void => {
    if (!this.tapHandler) return;
    const local = this.field.toLocal(e.global);
    this.tapHandler(local.x, local.y);
  };
}
