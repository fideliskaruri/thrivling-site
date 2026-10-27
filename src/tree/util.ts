export type RGB = [number, number, number];

export const DS = 6;
export const DEG = Math.PI / 180;
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const hex = (c: string): RGB => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) as RGB;
export const mix = (a: RGB, b: RGB, k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * k)).join(",")})`;
export const WILT: RGB[] = ["#A9925B", "#CDB77A", "#E3D3A1"].map(hex);
export const SEED = hex("#A9825C");
export const rx0 = (d: number) => 34 + 40 * clamp(d / 90);
export const rng = (seed: number) => () => {
  seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
