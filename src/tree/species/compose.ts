import { LIFETIME } from "../generator";
import type { Part, Species, SpeciesDef, SpeciesRecipe } from "./types";

/** Broadleaf defaults every species starts from; lengths here are already fractions of height. */
const BASE: Omit<SpeciesRecipe, "habitat"> = {
  label: "", strategy: "branching", sway: 0.7,
  TH: 560, grow: 0.62, trunkW: 28, curve: [0.0012, 0.002], profile: u => Math.pow(1 - u, 0.75), wob: [0.012, 0.03],
  stem: "#6F9A5E", bark: "#8A6A55", barkMark: "#5C4334", marks: "v", markTop: 0.55,
  leaf: ["#4E9563", "#7DBE8A", "#A9D9A4"], mass: ["#3B7550", "#5C9C68"], massK: 1, massFlat: 1,
  shape: "blade", leafSize: 1, wide: [0.24, 0.4], per: [1, 2, 3], sp: [10, 9, 8], hang: 0, zone: [150, 210],
  twigs: true,
  scaffold: { from: 0.31, to: 0.955, step: [26, 32], ang: f => 64 - 34 * f, maxL: f => 0.08 + 0.59 * (1 - Math.pow(f, 1.4)), rate: 7, bend: 0.0035 },
  sub: { first: [30, 45], step: [28, 38], ang: [30, 48], maxL: (s, L) => 50 + 70 * (1 - s / L), rate: 4, bend: 0.003 },
  blossom: null,
};

/** Merges parts in order; scaffold and sub merge key by key so an atom can tweak one setting. */
function merge(parts: Part[]): Part {
  const out: Part = {};
  for (const p of parts) {
    const { scaffold, sub, ...rest } = p;
    Object.assign(out, rest);
    if (scaffold) out.scaffold = { ...out.scaffold, ...scaffold };
    if (sub) out.sub = { ...out.sub, ...sub };
  }
  return out;
}

/** Turns an authored definition into the flat recipe the strategies and painters read. */
export function compose(def: SpeciesDef): Species {
  const { blossom, ...rest } = merge([{ ...BASE, blossom: null }, ...def.atoms, def.set ?? {}]);
  const S = rest as Omit<SpeciesRecipe, "habitat">;
  const day = (m: number) => m * LIFETIME;
  const h = S.TH, sc = S.scaffold, maxL = sc.maxL;
  return {
    ...S,
    label: def.label, description: def.description, traits: def.traits, tier: def.tier, habitat: def.habitat,
    scaffold: { ...sc, from: sc.from * h, to: sc.to * h, maxL: f => maxL(f) * h },
    blossom: blossom ? { ...blossom, days: blossom.at.map(day) } : null,
    turn: S.turn && { ...S.turn, from: day(S.turn.from), to: day(S.turn.to) },
    juvenile: S.juvenile && { ...S.juvenile, until: day(S.juvenile.until) },
    details: S.details?.map(d => ({ ...d, from: day(d.from) })),
    roots: S.roots && { ...S.roots, from: day(S.roots.from) },
  };
}
