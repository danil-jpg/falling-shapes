/**
 * Object Pool: reuses objects instead of creating and garbage-collecting them.
 *
 * `acquire()` returns a free object, or creates one if none are left.
 * `release()` resets an object and keeps it for the next `acquire()`.
 */
export class Pool<T> {
    private readonly free: T[] = [];
    private created = 0;

    constructor(
        private readonly create: () => T,
        private readonly reset: (item: T) => void = () => {},
    ) {
    }

    acquire(): T {
        const item = this.free.pop();
        if (item !== undefined) return item;
        this.created++;
        return this.create();
    }

    release(item: T): void {
        this.reset(item);
        this.free.push(item);
    }

    /** Total objects ever created by this pool (active + free). */
    get createdCount(): number {
        return this.created;
    }

    get freeCount(): number {
        return this.free.length;
    }

    /** Dispose every free object and empty the pool. */
    clear(dispose: (item: T) => void): void {
        for (const item of this.free) dispose(item);
        this.free.length = 0;
    }
}
