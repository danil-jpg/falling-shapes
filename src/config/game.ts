/** Gameplay tuning values. */

/** Starting gravity, in px/s². */
export const DEFAULT_GRAVITY = 300;
/** Starting spawn rate, in shapes per second. */
export const DEFAULT_SPAWN_RATE = 1;
/**
 * Longest frame step the simulation accepts, in seconds. After a stall
 * (e.g. returning to the tab), shapes move a little instead of teleporting.
 */
export const MAX_FRAME_DT = 0.1;
