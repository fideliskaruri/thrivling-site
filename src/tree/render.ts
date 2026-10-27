import { seed, shadow, soil, grass } from "./painters/ground";
import { massLayer } from "./painters/crown";
import { wood, trunkDetail } from "./painters/wood";
import { leafPainters } from "./painters/leaves";
import { paintBlossoms } from "./painters/blossoms";
import { paintDetails } from "./painters/details";
import { clamp, mix, WILT } from "./util";
import type { RGB } from "./util";
import type { Pen } from "./pen";
import type { Axis, Skeleton } from "./generator";
import type { Species } from "./species";
import type { Palette } from "./palette";
import type { Layout, LeafEntry } from "./grow";

export type RigLayer = "seed" | "shadow" | "backMass" | "wood" | "trunkDetail" | "soil" | "grass" | "frontMass" | "leaves" | "details" | "blossoms";
export interface RigPaintFilter {
  bone?: number;
  boneOf?: (a: Axis) => number;
  band?: number;
}

const leafBand = (lit: number) => lit < 0.42 ? 0 : lit < 0.72 ? 1 : 2;

function colorsFor(S: Species, pal: Palette, lay: Layout) {
  const lerp = (a: RGB[], b: RGB[], t: number): RGB[] => a.map((row, i) => row.map((v, j) => v + (b[i]![j]! - v) * t) as RGB);
  const turn = S.turn ? clamp((lay.day - S.turn.from) / (S.turn.to - S.turn.from)) : 0;
  return turn && pal.TURN && pal.TURNM ? { ...pal, LEAF: lerp(pal.LEAF, pal.TURN, turn), MASS: lerp(pal.MASS, pal.TURNM, turn) } : pal;
}

function forBone<T extends { l: { a: Axis } }>(items: T[], filter?: RigPaintFilter) {
  return filter?.bone === undefined || !filter.boneOf ? items : items.filter(e => filter.boneOf!(e.l.a) === filter.bone);
}

/** Paints one ordered render layer, optionally restricted to a rig bone and lit band. */
export function paintRigLayer(ctx: Pen, skel: Skeleton, S: Species, pal: Palette, lay: Layout, layer: RigLayer, filter?: RigPaintFilter) {
  const { L, geo, k } = lay;
  const colors = colorsFor(S, pal, lay);
  if (layer === "seed") return seed(ctx, lay);
  if (layer === "shadow") return shadow(ctx, lay);
  if (layer === "soil") return soil(ctx, lay, S);
  if (layer === "grass") return grass(ctx, skel, S, lay);
  if (layer === "backMass" || layer === "frontMass") {
    const i = layer === "backMass" ? 0 : 1;
    const entries = forBone(L, filter);
    const part = entries === L ? lay : { ...lay, L: entries };
    return massLayer(ctx, S, colors, part, i, i ? 0.62 : 0.95, i ? -0.1 : 0.12, i ? -0.14 : 0.14);
  }
  if (layer === "wood") {
    const axes = filter?.bone === undefined || !filter.boneOf
      ? skel.axes : skel.axes.filter(a => filter.boneOf!(a) === filter.bone);
    return wood(ctx, axes === skel.axes ? skel : { ...skel, axes }, S, colors, lay);
  }
  if (layer === "trunkDetail") {
    if (filter?.bone !== undefined && filter.bone !== 0) return;
    return trunkDetail(ctx, skel, S, colors, lay);
  }
  if (layer === "leaves") {
    const leafFn = (colors.juvFn && S.juvenile && lay.d < S.juvenile.until ? colors.juvFn : colors.leafFn)
      ?? leafPainters[S.shape] ?? leafPainters.blade;
    for (const e of forBone(L, filter)) {
      const { l, sx, sy, dir, lit } = e;
      if (geo.get(l.a)!.gone || (filter?.band !== undefined && leafBand(lit) !== filter.band)) continue;
      const c = leafBand(lit);
      const col = mix(l.round ? colors.LEAF[2]! : colors.LEAF[c]!, WILT[c]!, k);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(dir);
      (l.round ? leafPainters.blade : leafFn)(ctx, e, col);
      ctx.restore();
    }
    return;
  }
  if (layer === "details") {
    const entries = forBone(L, filter);
    const part = entries === L ? lay : { ...lay, L: entries };
    return paintDetails(ctx, S, part);
  }
  const flowers: LeafEntry[] = forBone(lay.flowers, filter);
  return paintBlossoms(ctx, S, colors, flowers === lay.flowers ? lay : { ...lay, flowers });
}

/** Paints the still tree in the same layer order used by rig recording. */
export function render(ctx: Pen, skel: Skeleton, S: Species, pal: Palette, lay: Layout) {
  const { W } = lay;
  ctx.reset?.();
  ctx.clearRect(0, 0, W, W);
  for (const layer of ["seed", "shadow", "backMass", "wood", "trunkDetail", "soil", "grass", "frontMass", "leaves", "details", "blossoms"] as const)
    paintRigLayer(ctx, skel, S, pal, lay, layer);
}
