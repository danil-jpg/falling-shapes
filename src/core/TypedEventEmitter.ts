export type Listener<T> = (data: T) => void;

/**
 * Observer: a small event emitter.
 *
 * `Events` maps each event name to the data it carries, e.g.
 * `{shapeAdded: ShapeModel}`. TypeScript then checks names and data
 * in `on`/`emit` calls.
 */
export class TypedEventEmitter<Events> {
    private readonly listeners = new Map<keyof Events, Set<Listener<any>>>();

    /** Subscribe. Returns a function that unsubscribes. */
    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
        return () => this.off(event, listener);
    }

    off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
        this.listeners.get(event)?.delete(listener);
    }

    emit<K extends keyof Events>(event: K, data: Events[K]): void {
        this.listeners.get(event)?.forEach((listener) => listener(data));
    }

    removeAllListeners(): void {
        this.listeners.clear();
    }
}
