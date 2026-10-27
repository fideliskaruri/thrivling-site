import { clamp, rng } from "./util";
import type { Range, Species } from "./species";

/** A streak runs from day 0 to LIFETIME; species timings are authored as maturity 0..1 against it. */
export const LIFETIME = 90;

export interface Axis {
  kids: Axis[];
  wob: number[];
  depth: number;
  pos: number;
  side: number;
  ang: number;
  bend: number;
  /** Pulls the axis down towards the ground as it lengthens, for weeping limbs and palm fronds. */
  droop?: number;
  /** Hangs straight down and stops at the ground, like a banyan's aerial root. */
  plumb?: boolean;
  maxL: number;
  curve?: number;
  rate: number;
  die?: number;
  born: number;
  parent?: Axis;
  len: (d: number) => number;
  when: (s: number) => number;
}

export interface Leaf {
  a: Axis;
  s: number;
  side: number;
  ang: number;
  born: number;
  size: number;
  shade: number;
  round?: boolean;
  drop?: number;
  wide?: number;
  curl?: number;
  flower?: number;
  hold?: number;
}

export interface Skeleton {
  trunk: Axis;
  axes: Axis[];
  leaves: Leaf[];
  grass: { x: number; h: number; n: number; ph: number }[];
  fissures: { u: number; on: number }[];
}

export type AxisInit = Pick<Axis, "depth" | "pos" | "side" | "ang" | "bend" | "maxL"> & Partial<Pick<Axis, "curve" | "rate" | "die" | "droop" | "plumb">>;
export type Strategy = (seed: number, S: Species) => Skeleton;

/** Shared parts every growth strategy is built from: the seeded random source, axes, the trunk and the leaf pass. */
export function builder(seed: number, S: Species) {
  const rand = rng(seed);
  const r = (a: number, b: number) => a + (b - a) * rand();
  const pick = (range: Range) => r(range[0], range[1]);
  const axes: Axis[] = [];
  const axis = (o: AxisInit): Axis => {
    const a: Axis = { kids: [], wob: Array.from({ length: 120 }, () => r(-1, 1)), rate: 0, born: 0, len: () => 0, when: () => 0, ...o };
    axes.push(a); return a;
  };
  const TH = S.TH;
  const trunk = axis({ depth: 0, pos: 0, side: 0, ang: 0, bend: 0.02, maxL: TH, curve: (rand() < 0.5 ? -1 : 1) * pick(S.curve) });
  const span = LIFETIME - 0.5;
  trunk.len = d => d <= 0.5 ? 0 : TH * Math.pow(Math.min(1, (d - 0.5) / span), S.grow);
  trunk.when = s => 0.5 + span * Math.pow(Math.min(1, s / TH), 1 / S.grow);
  /** A side axis that starts growing once its parent has passed the joint, then eases towards maxL. */
  const kid = (p: Axis, o: AxisInit, born = p.when(Math.min(o.pos + 30, p.maxL))) => {
    const a = axis(o);
    a.born = born;
    a.len = d => d <= a.born ? 0 : a.maxL * (1 - Math.exp(-(d - a.born) * a.rate / a.maxL));
    a.when = s => s >= a.maxL * 0.995 ? Infinity : a.born - a.maxL / a.rate * Math.log(1 - s / a.maxL);
    a.parent = p; p.kids.push(a); return a;
  };
  const finish = (): Skeleton => {
    const leaves: Leaf[] = [];
    for (const side of [-1, 1]) leaves.push({ a: trunk, s: 14, side, ang: 62, born: trunk.when(14), size: 11, round: true, shade: 0.8, drop: 9 });
    for (const a of axes) {
      const per = S.per[a.depth], sp = S.sp[a.depth];
      if (!per || !sp || a.plumb) continue;
      for (let s = a.depth ? 8 : 20, side = 1; s < a.maxL; s += sp * r(0.8, 1.2), side = -side) {
        const born = a.when(s + 3);
        if (!isFinite(born)) break;
        for (let j = 0; j < per; j++) {
          const l: Leaf = { a, s, side: j % 2 ? -side : side, ang: per === 1 ? r(38, 60) : 22 + 60 / per * j + r(0, 16),
                      born: born + j * 0.3, shade: rand(), size: (11 + 15 * clamp(born / 40)) * S.leafSize * r(0.75, 1.25),
                      wide: pick(S.wide), curl: r(-0.25, 0.25) };
          if (S.blossom && a.depth && rand() < S.blossom.share)
            l.flower = Math.max(l.born + 2, S.blossom.days[Math.floor(rand() * S.blossom.days.length)]!);
          const frac = (l.shade * 7.31 + s * 0.0137 + j * 0.29) % 1;
          l.hold = frac * (1 - 0.3 * clamp(s / a.maxL)) - 0.06;
          leaves.push(l);
        }
      }
    }
    const grass = Array.from({ length: 14 }, () => ({ x: r(-0.46, 0.46), h: r(0.012, 0.026), n: 3 + Math.floor(rand() * 3), ph: r(0, 6) }));
    const fissures = Array.from({ length: 5 }, (_, i) => ({ u: -0.32 + i * 0.16 + r(-0.04, 0.04), on: r(0, 1) }));
    return { trunk, axes, leaves, grass, fissures };
  };
  return { rand, r, pick, trunk, kid, finish };
}
