import type { Axis, Skeleton } from "./generator";
import type { Layout } from "./grow";
import type { Palette } from "./palette";
import type { Species } from "./species";
import type { Pen } from "./pen";
import { paintRigLayer, type RigLayer } from "./render";

const FLEX = [0.035, 0.09, 0.15] as const;

export interface RigBone {
  id: number;
  parent: number;
  depth: number;
  px: number;
  py: number;
  flex: number;
  phase: number;
  maxL: number;
}

export type RigBoneData = readonly [id: number, parent: number, depth: number, px: number, py: number, flex: number, phase: number, maxL: number];

export interface TreeRig {
  bones: RigBone[];
  paintPart: (ctx: Pen, layer: RigLayer, bone?: number, band?: number) => void;
  hasPart: (layer: RigLayer, bone?: number, band?: number) => boolean;
}

/** A bone's rotation in radians at `t` seconds; runs on the UI thread, so it takes the plain tuple form. */
export function bendAngle(bone: RigBoneData, t: number, amp: number) {
  "worklet";
  const depth = bone[2], flex = bone[5];
  const phase = bone[6] + depth * 0.62;
  const gust = Math.sin(t * 1.25 + phase) + 0.35 * Math.sin(t * 2.9 + phase * 1.7);
  const lag = 0.35 * depth * Math.sin(t * 2.3 + phase);
  return amp * flex * 0.24 * (gust + lag);
}

export function createRig(skel: Skeleton, S: Species, pal: Palette, lay: Layout): TreeRig {
  const present = (a: Axis) => {
    const geo = lay.geo.get(a);
    return !!geo?.P && !geo.gone;
  };
  const trunk = skel.trunk;
  const depth1 = skel.axes.filter(a => a.depth === 1 && present(a));
  const depth2 = skel.axes.filter(a => a.depth === 2 && present(a))
    .sort((a, b) => b.maxL - a.maxL || skel.axes.indexOf(a) - skel.axes.indexOf(b));
  const selected = new Set<Axis>([trunk, ...depth1, ...depth2.slice(0, Math.max(0, 48 - 1 - depth1.length))]);
  const boneAxes = [trunk, ...skel.axes.filter(a => a !== trunk && selected.has(a))];
  const indices = new Map(boneAxes.map((a, i) => [a, i]));
  const boneOf = (axis: Axis) => {
    let a: Axis | undefined = axis;
    while (a && !indices.has(a)) a = a.parent;
    return indices.get(a ?? trunk) ?? 0;
  };
  const bones = boneAxes.map((a, id): RigBone => {
    let parent = a.parent;
    while (parent && !indices.has(parent)) parent = parent.parent;
    const point = lay.geo.get(a)?.P?.[0] ?? [0, 0, 0];
    return {
      id,
      parent: id === 0 ? -1 : indices.get(parent ?? trunk) ?? 0,
      depth: Math.min(2, a.depth),
      px: lay.X(point[0]),
      py: lay.Y(point[1]),
      flex: FLEX[Math.min(2, a.depth)]!,
      phase: (a.wob[0] ?? 0) * Math.PI + (a.wob[11] ?? 0) * 0.35,
      maxL: a.maxL,
    };
  });
  const entriesFor = (layer: RigLayer, bone?: number, band?: number) => {
    const source = layer === "blossoms" ? lay.flowers : lay.L;
    return source.filter(e => (bone === undefined || boneOf(e.l.a) === bone)
      && (band === undefined || (e.lit < 0.42 ? 0 : e.lit < 0.72 ? 1 : 2) === band)
      && (layer === "details" || !lay.geo.get(e.l.a)!.gone));
  };
  // Only skips bones with nothing of a layer; painters still decide what is visible.
  const hasPart = (layer: RigLayer, bone?: number, band?: number) => {
    if (layer === "trunkDetail") return bone === undefined || bone === 0;
    if (layer === "wood") return skel.axes.some(a => (bone === undefined || boneOf(a) === bone) && !!lay.geo.get(a)?.P);
    return entriesFor(layer, bone, band).length > 0;
  };
  return {
    bones,
    paintPart: (ctx, layer, bone, band) =>
      paintRigLayer(ctx, skel, S, pal, lay, layer, { bone, boneOf, band }),
    hasPart,
  };
}
