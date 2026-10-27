import type { Pen } from "../pen";
import type { LeafEntry } from "../grow";
import type { LeafRecipe } from "../species";

type Range = [number, number];
type Kind = "blade" | "palmate" | "digitate" | "bipinnate" | "needles" | "fan" | "scale";
type Params = Record<string, number | string>;
type LeafPainter = (ctx: Pen, e: LeafEntry, col: string) => void;
type Molecule = (ctx: Pen, size: number, p: Params, col: string, curl: number) => void;
const PI = Math.PI;
const frac = (x: number) => x - Math.floor(x);
const smooth = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const n = (p: Params, key: string) => p[key] as number;
const s = (p: Params, key: string) => p[key] as string;

export const OUTLINES: Record<string, (t: number) => number> = {
  elliptic: t => Math.sin(PI * t),
  ovate: t => Math.sin(PI * Math.pow(t, 0.75)),
  obovate: t => Math.sin(PI * Math.pow(t, 1.4)),
  triangle: t => t < 0.24 ? Math.pow(t / 0.24, 0.55) : Math.pow((1 - t) / 0.76, 1.1),
  almond: t => Math.sin(PI * Math.pow(t, 0.8)) * Math.pow(1 - t, 0.3) * 1.18,
  oblong: t => Math.pow(Math.sin(PI * t), 0.4),
};
type Edge = (t: number, p: Params) => number;
export const EDGES: Record<string, Edge> = {
  smooth: () => 1,
  serrate: (t, p) => 1 - n(p, "tooth") * (1 - frac(t * n(p, "teeth"))),
  double: (t, p) => 1 - n(p, "tooth") * (0.7 * (1 - frac(t * n(p, "teeth"))) + 0.3 * (1 - frac(t * n(p, "teeth") * 2))),
  lobed: (t, p) => 1 - n(p, "lobe") * (1 - Math.pow(Math.abs(Math.sin(PI * (t * n(p, "lobes") + 0.15))), 0.6)),
};
const pick = (v: string | number | Range, rand: () => number): string | number =>
  Array.isArray(v) ? v[0] + (v[1] - v[0]) * rand() : v;
function strokeEdge(ctx: Pen, size: number) {
  if (size > 5) { ctx.strokeStyle = "rgba(28,36,26,0.34)"; ctx.lineWidth = Math.max(0.6, Math.min(1.4, size * 0.03)); ctx.lineJoin = "round"; ctx.stroke(); }
}
function blade(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  // Points along each side; leaves are only a few dozen pixels on screen, so more is invisible work.
  const toothed = s(p, "edge") !== "smooth";
  const N = size < 9 ? 8 : size < 28 ? (toothed ? 24 : 14) : toothed ? 48 : 28;
  const s0 = size * n(p, "stalk"), L = size - s0, W = L * n(p, "width");
  const outline = OUTLINES[s(p, "outline")]!, edgeFn = EDGES[s(p, "edge")]!;
  const mid = (t: number) => n(p, "arc") * L * Math.sin(PI * t) + curl * L * 0.35 * t * t;
  const half = (t: number, phase: number) => {
    let w = outline(t) + n(p, "ears") * Math.exp(-(((t - 0.05) / 0.035) ** 2));
    if (size >= 8 && s(p, "edge") !== "smooth") {
      const env = smooth(n(p, "edgeFrom") || 0, (n(p, "edgeFrom") || 0) + 0.08, t) * smooth(1, 0.94, t);
      w *= 1 - (1 - edgeFn(t + phase, p)) * env;
    }
    return Math.max(0, w) * W;
  };
  const right: [number, number][] = [], left: [number, number][] = [];
  for (let i = 0; i <= N; i++) { const t = i / N, y = -s0 - t * L, c = mid(t); right.push([c + half(t, 0), y]); left.push([c - half(t, 0.12), y]); }
  if (s0 > 0 && size > 5) { ctx.strokeStyle = (p.stalkCol as string | undefined) || "rgba(60,70,40,0.7)"; ctx.lineWidth = Math.max(0.6, size * 0.025); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s0 - 1); ctx.stroke(); }
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -s0);
  for (const point of right) ctx.lineTo(point[0], point[1]);
  for (let i = left.length - 1; i >= 0; i--) ctx.lineTo(left[i]![0], left[i]![1]);
  ctx.closePath(); ctx.fill(); strokeEdge(ctx, size);
  if (size > 40) { ctx.fillStyle = "rgba(20,40,20,0.10)"; ctx.beginPath(); ctx.moveTo(0, -s0); for (const point of left) ctx.lineTo(point[0], point[1]); for (let i = N; i >= 0; i--) ctx.lineTo(mid(i / N), -s0 - (i / N) * L); ctx.fill(); }
  if (size > 9 && s(p, "veins") !== "none") {
    ctx.strokeStyle = "rgba(255,255,240,0.28)"; ctx.lineWidth = Math.max(0.5, size * 0.018); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, -s0);
    for (let i = 0; i <= 12; i++) ctx.lineTo(mid(i / 12), -s0 - (i / 12) * L * 0.96);
    if (size > 24 && s(p, "veins") === "pinnate") {
      const count = n(p, "lobes") ? Math.round(n(p, "lobes")) : 6;
      for (let k = 1; k <= count; k++) { const t = (k - 0.4) / (count + 0.4), c = mid(t), y = -s0 - t * L; for (const sg of [1, -1]) { const reach = half(t, sg > 0 ? 0 : 0.12) * 0.82, t2 = Math.min(1, t + 0.12 * n(p, "width") * 2); ctx.moveTo(c, y); ctx.quadraticCurveTo(c + sg * reach * 0.5, y - L * 0.02, mid(t2) + sg * reach * 0.9, -s0 - t2 * L); } }
    }
    ctx.stroke();
  }
}
function palmate(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  const s0 = size * n(p, "stalk"), L = size - s0, cy = -s0 - L * 0.32, R = L * 0.7, m = Math.round(n(p, "lobes")), angles: number[] = [], lengths: number[] = [];
  for (let i = 0; i < m; i++) { const u = m === 1 ? 0 : (i / (m - 1)) * 2 - 1; angles.push(u * n(p, "spread") + curl * 0.3); lengths.push(1 - (1 - n(p, "side")) * Math.abs(u) ** 1.3); }
  const N = size < 9 ? 20 : size < 28 ? 40 : 96;
  const radius = (th: number) => { let v = n(p, "base"); for (let i = 0; i < m; i++) { const d = Math.abs(Math.atan2(Math.sin(th - angles[i]!), Math.cos(th - angles[i]!))); v = Math.max(v, lengths[i]! * Math.pow(Math.max(0, 1 - d / n(p, "lobeW")), n(p, "sharp"))); } if (size >= 8) v *= 1 - n(p, "tooth") * (1 - frac(Math.abs(th) * n(p, "teeth") / PI)) * smooth(0, 0.3, v - n(p, "base")); return v * R; };
  if (size > 5) { ctx.strokeStyle = (p.stalkCol as string | undefined) || "rgba(60,70,40,0.7)"; ctx.lineWidth = Math.max(0.6, size * 0.025); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, cy + R * n(p, "base") * 0.5); ctx.stroke(); }
  ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i <= N; i++) { const th = -PI + (i / N) * 2 * PI, rr = radius(th); ctx.lineTo(Math.sin(th) * rr, cy - Math.cos(th) * rr); } ctx.closePath(); ctx.fill(); strokeEdge(ctx, size);
  if (size > 9) { ctx.strokeStyle = "rgba(255,255,240,0.28)"; ctx.lineWidth = Math.max(0.5, size * 0.016); ctx.lineCap = "round"; ctx.beginPath(); for (let i = 0; i < m; i++) { const rr = radius(angles[i]!) * 0.9; ctx.moveTo(0, cy + R * n(p, "base") * 0.4); ctx.lineTo(Math.sin(angles[i]!) * rr, cy - Math.cos(angles[i]!) * rr); } ctx.stroke(); }
}
function digitate(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  const s0 = size * n(p, "stalk"), m = Math.round(n(p, "leaflets")), middle = (m - 1) / 2;
  if (size > 4) { ctx.strokeStyle = (p.stalkCol as string | undefined) || "rgba(60,70,40,0.7)"; ctx.lineWidth = Math.max(0.6, size * 0.025); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s0); ctx.stroke(); }
  const sub: Params = { ...p, stalk: 0.04, arc: 0, ears: 0 };
  for (let i = 0; i < m; i++) { const u = middle ? (i - middle) / middle : 0, k = 1 - 0.38 * Math.abs(u) ** 1.4; ctx.save(); ctx.translate(0, -s0); ctx.rotate(u * n(p, "fan") + curl * 0.2); blade(ctx, (size - s0) * k, sub, col, curl * 0.3); ctx.restore(); }
}
function bipinnate(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  const count = Math.round(n(p, "pairs")), rach = (t: number): [number, number] => [curl * size * 0.3 * t * t, -t * size];
  ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineWidth = Math.max(0.5, size * 0.02); ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 1; i <= 10; i++) { const [x, y] = rach(i / 10); ctx.lineTo(x, y); } ctx.stroke();
  for (let k = 0; k < count; k++) { const t = n(p, "start") + (1 - n(p, "start")) * (k + 0.5) / count, [x, y] = rach(t), pl = size * n(p, "pinna") * (1 - 0.45 * t); for (const sg of [1, -1]) { const a = sg * n(p, "angle") + curl * 0.2, dx = Math.sin(a), dy = -Math.cos(a); if (size < 18) { ctx.lineWidth = Math.max(0.6, pl * n(p, "leaflet") * 1.4); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * pl, y + dy * pl); ctx.stroke(); continue; } ctx.lineWidth = Math.max(0.4, size * 0.008); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * pl, y + dy * pl); ctx.stroke();
        const ll = pl * n(p, "leaflet"); ctx.fillStyle = col; ctx.beginPath();
        if (size < 40) { const ex = x + dx * pl, ey = y + dy * pl, mx = x + dx * pl * 0.45, my = y + dy * pl * 0.45, w = ll * 1.6; ctx.moveTo(x, y); ctx.quadraticCurveTo(mx - dy * w, my + dx * w, ex, ey); ctx.quadraticCurveTo(mx + dy * w, my - dx * w, x, y); ctx.fill(); continue; }
        // All leaflets of a pinna go into one path; per-leaflet save/rotate/fill cost thousands of draw calls per leaf.
        const m = Math.round(n(p, "per")), wide = s(p, "tip") === "point" ? 0.42 : 0.52;
      for (let j = 0; j < m; j++) { const f = (j + 0.6) / (m + 0.2), px = x + dx * pl * f, py = y + dy * pl * f, l2 = ll * (1 - 0.35 * f); for (const s2 of [1, -1]) { const r = a + s2 * 1.15, cr = Math.cos(r), sr = Math.sin(r), at = (u: number, v: number): [number, number] => [px + u * cr - v * sr, py + u * sr + v * cr], tip = at(0, -l2), c1 = at(l2 * wide, -l2 * 0.5), c2 = at(-l2 * wide, -l2 * 0.5); ctx.moveTo(px, py); ctx.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1]); ctx.quadraticCurveTo(c2[0], c2[1], px, py); } }
      ctx.fill(); } }
}
function needles(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  const sheath = size * 0.1; ctx.lineCap = "round";
  if (size > 10) { ctx.strokeStyle = "rgba(110,80,50,0.8)"; ctx.lineWidth = Math.max(0.8, size * 0.035); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -sheath); ctx.stroke(); }
  const count = Math.round(n(p, "count")); ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.7, size * n(p, "thick")); ctx.beginPath();
  for (let i = 0; i < count; i++) { const u = count === 1 ? 0 : (i / (count - 1)) * 2 - 1, a = u * n(p, "splay") / 2 + curl * 0.25, tw = n(p, "twist") * u, ex = Math.sin(a) * size, ey = -sheath - Math.cos(a) * (size - sheath); ctx.moveTo(0, -sheath); ctx.quadraticCurveTo(ex * 0.5 + tw * size, (ey - sheath) * 0.5, ex, ey); }
  ctx.stroke(); if (size > 40) { ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = Math.max(0.5, size * n(p, "thick") * 0.35); ctx.stroke(); }
}
function fan(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  const s0 = size * n(p, "stalk"), R = size - s0, half = n(p, "spread"), notch = n(p, "notch"), N = size < 12 ? 8 : 20;
  if (size > 5) { ctx.strokeStyle = "rgba(60,70,40,0.7)"; ctx.lineWidth = Math.max(0.6, size * 0.025); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s0); ctx.stroke(); }
  ctx.save(); ctx.translate(0, -s0); ctx.rotate(curl * 0.3);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0);
  for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1, a = u * half, r = R * (1 - notch * Math.exp(-((u / 0.12) ** 2))) * (0.92 + 0.08 * Math.cos(u * 6)); ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
  ctx.closePath(); ctx.fill(); strokeEdge(ctx, size);
  if (size > 12) { ctx.strokeStyle = "rgba(255,255,240,0.22)"; ctx.lineWidth = Math.max(0.4, size * 0.012); ctx.beginPath(); for (let k = -3; k <= 3; k++) { const a = k / 3.5 * half; ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * R * 0.85, -Math.cos(a) * R * 0.85); } ctx.stroke(); }
  ctx.restore();
}
function scale(ctx: Pen, size: number, p: Params, col: string, curl: number) {
  const m = Math.round(n(p, "sprigs")), rach = (t: number): [number, number] => [curl * size * 0.25 * t * t, -t * size];
  ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = Math.max(0.8, size * n(p, "thick")); ctx.beginPath(); ctx.moveTo(0, 0);
  for (let i = 1; i <= 8; i++) { const [x, y] = rach(i / 8); ctx.lineTo(x, y); }
  for (let k = 0; k < m; k++) { const t = 0.2 + 0.75 * k / m, [x, y] = rach(t), l = size * 0.32 * (1 - 0.6 * t), sg = k % 2 ? 1 : -1, a = sg * n(p, "spread") + curl * 0.2; ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); }
  ctx.stroke();
}
const MOLECULES: Record<Kind, Molecule> = { blade, palmate, digitate, bipinnate, needles, fan, scale };
export function makeLeaf(recipe: LeafRecipe, rand: () => number = Math.random): LeafPainter & { params: Params } {
  const params: Params = {};
  for (const key in recipe) params[key] = pick(recipe[key]!, rand);
  const draw = MOLECULES[recipe.kind as Kind]!;
  const painter = ((ctx: Pen, e: LeafEntry, col: string) => draw(ctx, e.size, params, col, e.l.curl || 0)) as LeafPainter & { params: Params };
  painter.params = params;
  return painter;
}
export const KIT = {
  blade: { kind: "blade", outline: "ovate", edge: "smooth", width: 0.34, stalk: 0.1, arc: 0, veins: "pinnate", ears: 0, tooth: 0.12, teeth: 12, lobe: 0, lobes: 0, edgeFrom: 0 },
  palmate: { kind: "palmate", lobes: 5, spread: 1.6, side: 0.45, lobeW: 0.7, sharp: 0.9, base: 0.3, tooth: 0.08, teeth: 14, stalk: 0.22 },
  digitate: { kind: "digitate", leaflets: 5, fan: 1.15, outline: "elliptic", edge: "smooth", width: 0.2, stalk: 0.28, veins: "pinnate" },
  bipinnate: { kind: "bipinnate", pairs: 8, start: 0.12, pinna: 0.3, angle: 1.2, per: 10, leaflet: 0.1, tip: "point" },
  needles: { kind: "needles", count: 2, splay: 0.35, twist: 0.05, thick: 0.035 },
};
