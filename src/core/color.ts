/**
 * Convert HSL to a 0xRRGGBB number (the format PIXI uses).
 * `h` in degrees [0, 360), `s` and `l` in [0, 1].
 */
export function hslToHex(h: number, s: number, l: number): number {
    const a = s * Math.min(l, 1 - l);
    const channel = (n: number): number => {
        const k = (n + h / 30) % 12;
        const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(value * 255);
    };
    return (channel(0) << 16) | (channel(8) << 8) | channel(4);
}
