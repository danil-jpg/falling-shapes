// todo rename configs

/** Gameplay tuning values. */

/** Starting gravity, in px/s². */
export const DEFAULT_GRAVITY = 300;
/** Starting spawn rate, in shapes per second. */
export const DEFAULT_SPAWN_RATE = 1;

/** +/- control steps and limits. */
export const GRAVITY_STEP = 50;
/** Kept above 0: with no gravity, shapes spawned above the field would never fall in and would pile up forever. */
export const MIN_GRAVITY = 50;
export const MAX_GRAVITY = 2000;
export const SPAWN_RATE_STEP = 1;
/** 0 pauses automatic spawning; taps still spawn. */
export const MIN_SPAWN_RATE = 0;
export const MAX_SPAWN_RATE = 20;
/**
 * Longest frame step the simulation accepts, in seconds. After a stall
 * (e.g. returning to the tab), shapes move a little instead of teleporting.
 */
export const MAX_FRAME_DT = 0.1;
