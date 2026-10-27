import { DS, DEG, clamp } from "./util";
import { LIFETIME, type Axis, type Leaf, type Skeleton } from "./generator";
import type { Species } from "./species";

type Pt = [number, number, number];

export interface AxisGeo {
  P: Pt[] | null;
  L: number;
  bw: number;
  alpha: number;
  gone: boolean;
}

export interface LeafEntry {
  l: Leaf;
  sx: number;
  sy: number;
  dir: number;
  size: number;
  mx: number;
  my: number;
  lit: number;
}

export interface Layout {
  W: number; CX: number; GY: number; z: number;
  X: (x: number) => number; Y: (y: number) => number;
  k: number; ret: number; mass: number; thin: number;
  geo: Map<Axis, AxisGeo>;
  L: LeafEntry[]; flowers: LeafEntry[]; loose: LeafEntry[];
  minX: number; maxX: number; minY: number; maxY: number; cx: number;
  seedA: number; trunkW: number; widthAt: (a: Axis, s: number) => number;
  leaf: [number, number][]; newest: [number, number][]; top: [number, number][];
  d: number; day: number; health: number;
}

// Pure: lays out the skeleton for a day and health without mutating it.
export function grow(skel: Skeleton, S: Species, d: number, health: number, W: number, day = d): Layout {
  const { trunk, axes, leaves } = skel;
  const CX = W / 2, GY = W * 0.935;
  const k = clamp((100 - health) / 90);
  const ret = 0.06 + 0.94 * Math.pow(clamp((health - 10) / 90), 0.55);
  const geo = new Map<Axis, AxisGeo>();
  const G = (a: Axis) => geo.get(a)!;
  let H = 0, Wd = 0;
  for (const a of axes) {
    const g: AxisGeo = { P: null, L: 0, bw: 0, alpha: 1, gone: true };
    geo.set(a, g);
    let L = a.len(d);
    if (L <= 0) continue;
    let x = 0, y = 0, th = 0;
    if (a.parent) {
      const P = G(a.parent).P;
      if (!P) continue;
      [x, y, th] = P[Math.min(P.length - 1, Math.round(a.pos / DS))]!;
      th = a.plumb ? Math.PI : th + a.side * a.ang * DEG;
      if (a.plumb) L = Math.min(L, y);
      if (L <= 0) continue;
    }
    const P: Pt[] = [[x, y, th]];
    for (let s = 0, i = 0; s < L; s += DS, i++) {
      const step = Math.min(DS, L - s);
      th += a.wob[i % a.wob.length]! * S.wob[a.depth ? 1 : 0];
      if (a.curve) th += a.curve * step * Math.cos(Math.PI * s / S.TH);
      th -= th * a.bend * step;
      if (a.droop) th += ((th < 0 ? -1 : 1) * Math.PI - th) * Math.min(1, a.droop * step * s / Math.max(60, a.maxL));
      if (a.plumb) th = Math.PI;
      x += Math.sin(th) * step; y += Math.cos(th) * step;
      P.push([x, y, th]);
      if (!a.die) { H = Math.max(H, y); Wd = Math.max(Wd, Math.abs(x)); }
    }
    g.P = P; g.L = L;
  }

  const pad = 30 * S.leafSize;
  const z = Math.min(6, W / 920 * (180 + 560 * Math.pow(clamp(d / LIFETIME), 0.6)) / (H + pad * 0.5 + 12), 0.47 * W / (Wd + pad));
  const X = (x: number) => CX + x * z, Y = (y: number) => GY - y * z;
  const seedA = 1 - clamp((d - 1) / 2);
  const at = (a: Axis, s: number) => { const P = G(a).P!; return P[Math.min(P.length - 1, Math.max(0, Math.round(s / DS)))]!; };
  const L: LeafEntry[] = [];
  let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
  for (const l of leaves) {
    const a = l.a, ag = G(a);
    if (!ag.P || d <= l.born) continue;
    if (a.die && d > a.die) continue;
    const grown = clamp((d - l.born) / (l.round ? 0.4 : 1.5));
    let life = l.drop ? 1 - clamp((d - l.drop) / 3) : 1;
    const zone = S.zone[a.depth];
    if (zone !== undefined && !l.round) life *= clamp((zone - (ag.L - l.s)) / 30);
    if (a.die) life *= 1 - clamp((d - a.die + 6) / 5);
    if (!l.round) life *= clamp((ret - l.hold!) / 0.06);
    const size = l.size * grown * life * z;
    if (size < 0.6) continue;
    const [wx, wy, th] = at(a, l.s);
    let dir = th + l.side * (l.ang + 35 * k) * DEG;
    if (S.hang && !l.round) dir += ((dir >= 0 ? 1 : -1) * Math.PI - dir) * S.hang;
    const sx = X(wx), sy = Y(wy);
    const mx = sx + Math.sin(dir) * size * 0.5, my = sy - Math.cos(dir) * size * 0.5;
    L.push({ l, sx, sy, dir, size, mx, my, lit: 0 });
    if (!l.round) { minY = Math.min(minY, my); maxY = Math.max(maxY, my); minX = Math.min(minX, mx); maxX = Math.max(maxX, mx); }
  }
  const spanY = Math.max(1, maxY - minY), spanX = Math.max(1, maxX - minX), cx = (minX + maxX) / 2;
  for (const e of L) e.lit = 0.55 * (1 - (e.my - minY) / spanY) + 0.2 * clamp(0.5 - (e.mx - cx) / spanX) + 0.35 * e.l.shade;
  L.sort((p, q) => p.lit - q.lit);
  const mass = clamp((d - 16) / 24);
  const thin = clamp((ret - 0.15) / 0.6);
  const trunkW = 1.6 + S.trunkW * Math.pow(clamp(d / LIFETIME), S.thicken ?? 1.8);
  const widthAt = (a: Axis, s: number) => {
    const ag = G(a);
    if (a.plumb) return ag.bw * (0.75 + 0.25 * Math.max(0, 1 - s / ag.L)) + 0.7;
    return a.depth ? ag.bw * Math.pow(Math.max(0, 1 - s / ag.L), 0.7) + 0.7 : ag.bw * S.profile(clamp(s / ag.L)) + 1.1;
  };
  for (const a of axes) {
    const ag = G(a);
    if (!ag.P) continue;
    ag.bw = a.parent ? Math.min(widthAt(a.parent, a.pos) * 0.7, 0.9 + ag.L * 0.05) : trunkW;
    ag.alpha = a.die ? 1 - clamp((d - a.die + 3) / 3) : 1;
    ag.gone = ag.alpha <= 0;
  }
  const flowers: LeafEntry[] = [], leaf: [number, number][] = [], newest: [number, number][] = [];
  for (const e of L) {
    if (G(e.l.a).gone) continue;
    if (e.l.flower && day > e.l.flower) flowers.push(e);
    leaf.push([e.mx / W, e.my / W]);
    if (d - e.l.born < 1.2) newest.push([e.mx / W, e.my / W]);
  }
  const TP = G(trunk).P;
  const tip = TP ? TP[TP.length - 1]! : [0, 0];
  const top: [number, number][] = [[X(tip[0]!) / W, Y(tip[1]!) / W]];
  const loose = L.filter(e => !e.l.round && e.l.a.depth && !G(e.l.a).gone);
  return { W, CX, GY, z, X, Y, k, ret, mass, thin, geo, L, flowers, loose, minX, maxX, minY, maxY, cx, seedA, trunkW, widthAt, leaf, newest, top, d, day, health };
}
