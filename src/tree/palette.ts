import { hex, type RGB } from "./util";
import { rng } from "./util";
import type { LeafEntry } from "./grow";
import type { Pen } from "./pen";
import type { Species } from "./species";
import { makeLeaf } from "./painters/leafkit";

export type TreeLeafPainter = (ctx: Pen, e: LeafEntry, col: string) => void;

export interface Palette {
  LEAF: RGB[];
  STEM: RGB;
  BARK: RGB;
  MASS: RGB[];
  B: RGB[] | null;
  C: RGB | null;
  TURN: RGB[] | null;
  TURNM: RGB[] | null;
  BARK2: RGB | null;
  leafFn: TreeLeafPainter | null;
  juvFn: TreeLeafPainter | null;
}

export function palette(S: Species, seed = 7): Palette {
  const rand = rng(seed * 7919 + 13);
  return {
    LEAF: S.leaf.map(hex), STEM: hex(S.stem), BARK: hex(S.bark), MASS: S.mass.map(hex),
    B: S.blossom ? S.blossom.colors.map(hex) : null, C: S.blossom ? hex(S.blossom.center) : null,
    TURN: S.turn ? S.turn.leaf.map(hex) : null,
    TURNM: S.turn ? S.turn.mass.map(hex) : null,
    BARK2: S.barkTop ? hex(S.barkTop) : null,
    leafFn: S.leafKit ? makeLeaf(S.leafKit, rand) : null,
    juvFn: S.juvenile ? makeLeaf(S.juvenile.kit, rand) : null,
  };
}
