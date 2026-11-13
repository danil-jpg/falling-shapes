import type {FieldStats} from '../model/entities/GameModel';

const numberFormat = new Intl.NumberFormat('en-US');

/**
 * HTML counters in the top-left of the field (bonus 5c: HTML instead of canvas text).
 *
 * The markup lives in index.html; this view only finds the value spans once
 * (by `data-hud` attribute) and writes their `textContent` when the model
 * reports a change.
 */
export class HudView {
    private readonly countValue: HTMLElement;
    private readonly areaValue: HTMLElement;

    constructor(private readonly root: HTMLElement) {
        this.countValue = this.findValue('count');
        this.areaValue = this.findValue('area');
    }

    render(stats: Readonly<FieldStats>): void {
        this.countValue.textContent = numberFormat.format(stats.count);
        this.areaValue.textContent = `${numberFormat.format(stats.area)} px²`;
    }

    /** Markup is static, so only reset the values (e.g. before a hot reload re-creates the game). */
    destroy(): void {
        this.render({count: 0, area: 0});
    }

    private findValue(name: string): HTMLElement {
        const el = this.root.querySelector<HTMLElement>(`[data-hud="${name}"]`);
        if (!el) throw new Error(`HUD element [data-hud="${name}"] not found in #${this.root.id}`);
        return el;
    }
}
