import { build } from "./strategies";
import { LIFETIME } from "./generator";
import { grow, type Layout } from "./grow";
import { render } from "./render";
import { renderFallen } from "./fallen";
import { createAmbient } from "./ambient";
import { palette } from "./palette";
import { SPECIES, type SpeciesId } from "./species";
import type { Pen } from "./pen";
import { createRig } from "./rig";

export { SPECIES };
export type { Pen, Layout, SpeciesId };
export type { PenGradient } from "./pen";
export type { Species, Blossom, Habitat, LeafShape } from "./species";
export { LIFETIME };
export type { Ambient } from "./ambient";
export { LANDSCAPE_SIZE, paintLandscape, type GroveItem, type CurrentTree, type Hotspot } from "./landscape";
export { KIT, makeLeaf, OUTLINES, EDGES } from "./painters/leafkit";
export { BARK } from "./painters/barkkit";
export { DETAILS } from "./painters/details";
export { GROUND, SKY, clearing, sky } from "./envkit";
export { rng } from "./util";

export const PLANTED = 20;
const age = (d: number) => PLANTED + Math.min(LIFETIME, Math.max(0, d)) * (LIFETIME - PLANTED) / LIFETIME;
export const isFreeSpecies = (id: SpeciesId) => SPECIES[id].tier === "free";
export const speciesList = (Object.keys(SPECIES) as SpeciesId[]).map(id => ({ id, label: SPECIES[id].label, tier: SPECIES[id].tier }));
const fallenPainters = new WeakMap<Layout, (ctx: Pen) => void>();

/** Paints a layout previously returned by a tree's fallenLayout method. */
export function paintFallen(ctx: Pen, lay: Layout) {
  const paint = fallenPainters.get(lay);
  if (!paint) throw new Error("The layout was not created by a tree's fallenLayout method.");
  paint(ctx);
}

/** A tree has a fixed skeleton for a seed/species and can be laid out for any streak day. */
export function createTree(seed = 7, speciesId: SpeciesId = "oak") {
  const S = SPECIES[speciesId] ?? SPECIES.oak;
  const pal = palette(S, seed);
  const skel = build(seed, S);
  const makeLayout = (d: number, health: number, W: number) => {
    const lay = grow(skel, S, age(d), health, W, d);
    fallenPainters.set(lay, ctx => renderFallen(ctx, skel, S, pal, lay,
      pal.juvFn && S.juvenile && lay.d < S.juvenile.until ? pal.juvFn : pal.leafFn));
    return lay;
  };
  const fallenLayout = (d: number, W: number) => makeLayout(d, 30, W);
  return {
    species: S,
    layout: makeLayout,
    fallenLayout,
    paint: (ctx: Pen, lay: Layout) => render(ctx, skel, S, pal, lay),
    rig: (lay: Layout) => createRig(skel, S, pal, lay),
    createAmbient: () => createAmbient(S, pal),
  };
}
export type Tree = ReturnType<typeof createTree>;

export { bendAngle, type RigBone, type RigBoneData, type TreeRig } from "./rig";
export { createAmbient } from "./ambient";
export type { AmbientEnvironment } from "./ambient";
export { createLife } from "./life";
export type { Life, LifeMax, LifePoint, LifeGround, LifeScene, LifeTime, LifeWeather } from "./life";
