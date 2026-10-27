export type Range = [number, number];
export type LeafShape = "blade" | "needle" | "fine" | "maple";
export type LeafRecipe = Record<string, string | number | Range>;
export type BlossomStyle = "petal" | "bell" | "puff" | "raceme" | "cup" | "bract";
export type BarkTexture = "grooves" | "dashes" | "lenticels" | "plates" | "folds" | "rings";
export type DetailAtom = "acorn" | "cone" | "catkin" | "samara" | "podStrap" | "podRound" | "coil" | "fruit" | "thorn"
  | "apple" | "lemon" | "olive" | "coconut" | "berry";
export type StrategyId = "branching" | "palm";
export type Habitat = "garden" | "dry" | "wet" | "forest" | "coast";

export interface Blossom { colors: string[]; center: string; share: number; days: number[]; style?: BlossomStyle; scale?: number }
/** `reach` keeps the detail within that distance of its branch base, e.g. coconuts at the frond bases. */
export interface Detail { atom: DetailAtom; from: number; share: number; size: number; waist?: boolean; reach?: number }
export interface Scaffold {
  from: number; to: number; step: Range; whorl?: boolean; ang: (f: number) => number; maxL: (f: number) => number;
  rate: number; bend: number; droop?: number;
}
export interface Sub { first: Range; step: Range; ang: Range; maxL: (s: number, L: number) => number; rate: number; bend: number; droop?: number }
/** Palm crowns: fronds radiating from the trunk tip. Length is a fraction of tree height. */
export interface Crown { fronds: number; length: Range; spread: Range; droop: number; turnover: number }

/** Resolved, flat species. Lengths are tree units and timings are streak days (0 to LIFETIME). */
export interface SpeciesRecipe {
  label: string; strategy: StrategyId; habitat: Habitat;
  /** How far the crown bends in the wind: 0.2 for a baobab, 1.25 for a birch. */
  sway: number;
  TH: number; grow: number; trunkW: number; curve: Range; profile: (u: number) => number; wob: Range;
  stem: string; bark: string; barkMark: string; marks: "v" | "h"; markTop: number;
  leaf: string[]; mass: string[]; massK: number; massFlat: number; shape: LeafShape; leafSize: number; wide: Range;
  per: number[]; sp: number[]; hang: number; zone: number[]; twigs?: boolean;
  scaffold: Scaffold; sub: Sub; crown?: Crown;
  /** Aerial roots dropping from the limbs to the ground, as on a banyan. */
  roots?: { from: number; share: number };
  blossom: Blossom | null; leafKit?: LeafRecipe; juvenile?: { until: number; kit: LeafRecipe };
  barkKit?: { texture: BarkTexture };
  barkTop?: string; thicken?: number; turn?: { from: number; to: number; leaf: string[]; mass: string[] };
  details?: Detail[];
}
export interface Species extends SpeciesRecipe { description: string; traits: string[]; tier: "free" | "plus" }

/**
 * Authoring form: atoms are partial recipes merged in order, then `set`.
 * Scaffold from/to/maxL are fractions of tree height; every timing is maturity 0..1.
 */
export type Part = Partial<Omit<SpeciesRecipe, "scaffold" | "sub" | "blossom">> & {
  scaffold?: Partial<Scaffold>;
  sub?: Partial<Sub>;
  blossom?: (Omit<Blossom, "days"> & { at: number[] }) | null;
};
export interface SpeciesDef { label: string; description: string; traits: string[]; tier: "free" | "plus"; atoms: Part[]; habitat: Habitat; set?: Part }
