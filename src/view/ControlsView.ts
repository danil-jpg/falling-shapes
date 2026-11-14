export type ControlName = 'spawnRate' | 'gravity';

/** -1 for the "−" button, +1 for the "+" button. */
export type StepDirection = -1 | 1;

export type StepHandler = (control: ControlName, direction: StepDirection) => void;

interface ControlElements {
    value: HTMLElement;
    decrease: HTMLButtonElement;
    increase: HTMLButtonElement;
}

/**
 * HTML +/- controls under the field (bonus 6).
 *
 * The markup lives in index.html. One click listener on the root handles every
 * button (event delegation), so there's a single listener to remove in `destroy()`.
 * The view only reports "which control, which direction"; the controller decides what that means.
 */
export class ControlsView {
    private readonly controls: Record<ControlName, ControlElements>;
    private stepHandler: StepHandler | null = null;

    constructor(private readonly root: HTMLElement) {
        this.controls = {
            spawnRate: this.findControl('spawnRate'),
            gravity: this.findControl('gravity'),
        };
        root.addEventListener('click', this.handleClick);
    }

    onStep(handler: StepHandler | null): void {
        this.stepHandler = handler;
    }

    /** Show a value and disable the buttons that can't change it any further. */
    render(control: ControlName, text: string, atMin: boolean, atMax: boolean): void {
        const elements = this.controls[control];
        elements.value.textContent = text;
        elements.decrease.disabled = atMin;
        elements.increase.disabled = atMax;
    }

    destroy(): void {
        this.root.removeEventListener('click', this.handleClick);
        this.stepHandler = null;
    }

    private readonly handleClick = (e: MouseEvent): void => {
        const button = (e.target as Element).closest<HTMLButtonElement>('button[data-step]');
        const control = button?.closest<HTMLElement>('[data-control]')?.dataset.control as ControlName | undefined;
        if (!button || !control || button.disabled) return;
        this.stepHandler?.(control, Number(button.dataset.step) < 0 ? -1 : 1);
    };

    private findControl(name: ControlName): ControlElements {
        const el = this.root.querySelector<HTMLElement>(`[data-control="${name}"]`);
        const value = el?.querySelector<HTMLElement>('[data-value]');
        const decrease = el?.querySelector<HTMLButtonElement>('button[data-step="-1"]');
        const increase = el?.querySelector<HTMLButtonElement>('button[data-step="1"]');
        if (!value || !decrease || !increase) {
            throw new Error(`Control [data-control="${name}"] markup is incomplete in #${this.root.id}`);
        }
        return {value, decrease, increase};
    }
}
