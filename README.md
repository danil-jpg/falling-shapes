# Falling Shapes

Shapes fall through a rectangle under gravity. Tap empty space to add a shape, tap a shape to remove it.
Built with **PIXI.js 8 + TypeScript (strict) + Vite**. Works with mouse and touch.

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

To try it on a phone on the same network: `npm run dev -- --host`.

## Features

| Spec item | Status |
|---|---|
| 1. Rectangle (canvas area) | ✅ resizes with the window |
| 2a–g. Shapes fall from above the field, random x, removed fully below, masked, gravity-driven, 1/s | ✅ |
| 2h. (Bonus) Random type (3–6 sides, circle, ellipse, star) and random colour, chosen at creation | ✅ |
| 3. Tap inside the field spawns a shape at the pointer | ✅ |
| 3a. (Bonus) That shape is a random irregular polygon with a random colour | ✅ |
| 4. Tap a shape to remove it | ✅ hit-test uses the exact outline, not the bounding box |
| 5a–b. Shape count and occupied area (px²) | ✅ |
| 5c. (Bonus) Counters are HTML | ✅ |
| 6. (Bonus) HTML +/- for shapes per second and gravity | ✅ buttons disable at their limits |

## Architecture: MVC

```
src/
  main.ts                 finds DOM elements, starts the game
  Game.ts                 composition root: creates and wires everything, destroy() tears it down
  config/                 tuning values (game, geometry, visual)
  core/                   framework-free helpers: TypedEventEmitter, Pool, color, random
  geometry/
    base/                 ShapeGeometry interface, PolygonGeometry abstract base
    shapes/               RegularPolygon, Star, Circle, Ellipse, IrregularPolygon
  factory/ShapeFactory    decides type, size, colour of new shapes
  model/
    entities/             GameModel (state + rules), ShapeModel (one shape)
    rules/ShapeSpawner    "N shapes per second above the field"
  controller/             GameController (loop, taps), ControlsController (+/-)
  view/                   StageView + ShapeView (PIXI), HudView + ControlsView (HTML)
```

- **Model**: all state and game rules: physics, spawn timing, despawn, stats, limits on settings. It has no PIXI or DOM code, and reports changes through events.
- **View**: drawing and reading input. It holds no game rules.
- **Controller**: turns input into model calls, and model events into view updates. It also drives the frame loop.

The model and the views never reference each other. The controllers are the only place they meet.

## Design patterns, and why

| Pattern | Where | Why this, not the alternative |
|---|---|---|
| **Strategy** | `ShapeGeometry` + implementations | Shape types differ only in drawing, area and bounds. One `ShapeModel` class holds a geometry, instead of one subclass per type that repeats the falling logic. It also lets a pooled view show any shape type. |
| **Template base class** | `PolygonGeometry` | Every vertex-based shape shares area (shoelace), bounds, hit area and drawing. Subclasses only generate vertices. |
| **Factory + registry** | `ShapeFactory` | Type and colour are decided in one place at creation. A `Map` of creators instead of a `switch`: adding a type is one `register()` call (Open/Closed). Abstract Factory / Builder would be empty layers here. |
| **Object Pool** | `Pool<ShapeView>` in `StageView` | Shapes are created and removed constantly. Reusing `Graphics` avoids allocating GPU buffers and garbage-collection pauses, which cause stutter on phones. |
| **Observer** | `TypedEventEmitter`, `GameModel.on()` | The model doesn't know the views exist. Stats are emitted **only when they change**, so the DOM is written a few times per second, not every frame. The emitter is composed into the model, so only the model can emit. |
| **Game Loop + Update Method** | `GameController`, `ShapeModel.update()` | One `model.update(dt)` per frame. `dt` is capped (`MAX_FRAME_DT`) so returning to the tab doesn't teleport shapes. |
| **Composition root / constructor injection** | `Game.create()` | Everything is built in one place and passed in. No singletons, so every class can be created and checked on its own. |

**Considered and rejected:**
- **Singleton:** it hides dependencies.
- **Command (for buttons):** there's no undo or replay to justify it.
- **State:** the game has no modes.
- **ECS:** it suits many entity types that mix components; this game has one entity type.
- **`setInterval` for spawning:** it keeps firing in hidden tabs and drifts from the frame clock. Spawning uses a time accumulator on the game loop instead.

## Decisions worth knowing

- **What counts as "displayed":** a shape whose bounds overlap the field, including shapes only partly inside.
- **Area:** each counted shape's exact area, computed once when it's created: shoelace formula for polygons, πr² for circles, πab for ellipses. Overlaps between shapes are not merged. Exact clipped area would need polygon clipping every frame, which isn't worth the cost here.
- **Gravity:** a real acceleration (px/s²), so shapes speed up as they fall. The minimum is above 0, because with zero gravity shapes spawned above the field would never fall in and would pile up forever.
- **Spawn rate:** can go down to 0, which pauses automatic spawning. Taps still work.
- **Irregular polygons:** random sorted angles with random radii. Walking around the centre in angle order means edges never cross, so the shoelace area stays exact.
- **Masking:** a rectangular mask on the shape layer, which PIXI renders cheaply. The canvas is larger than the field, so the clipping is real, not a side effect of the canvas size.

## Mobile and performance

- Pointer events handle mouse and touch the same way. `touch-action: none` on the canvas stops scrolling and zooming while playing. Buttons are at least 44 px tall and don't double-tap zoom.
- Rendering resolution is capped at 2× the CSS size, which saves GPU work on high-density phones.
- Shape views are pooled. In a 60-second run at 5 shapes/s the pool levelled off at 10 views and stopped growing.
- Each shape's area, bounds and hit area are computed once. Per frame, a shape only updates its position.
- `Game.destroy()` removes all listeners (ticker, resize, DOM, model) and destroys PIXI objects. Vite hot reload uses it during development.
