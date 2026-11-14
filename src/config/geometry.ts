/** Generation parameters for shape geometries. */

/**
 * Shape size range, picked at random per shape: circumradius for polygons and
 * stars, radius for circles, horizontal semi-axis for ellipses.
 */
export const SHAPE_MIN_RADIUS = 20;
export const SHAPE_MAX_RADIUS = 40;

/** Ellipse height as a fraction of its width. */
export const ELLIPSE_ASPECT = 0.55;

/** Irregular polygon (bonus 3a): vertex count range, inclusive. */
export const MIN_VERTICES = 5;
export const MAX_VERTICES = 12;
/** Smallest vertex radius, as a fraction of the polygon's max radius. */
export const MIN_RADIUS_RATIO = 0.4;
