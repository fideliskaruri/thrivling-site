import { KIT } from "../painters/leafkit";
import type { Part } from "./types";

/**
 * Reusable building blocks. A species lists a FORM, a LEAF and usually a BARK atom, then sets its own colours.
 * Scaffold from/to/maxL are fractions of tree height; timings are maturity 0..1.
 */
export const FORM = {
  /** Rounded broadleaf crown on one trunk (the defaults). */
  rounded: {},
  /** Low and broad: a stout trunk that splits early into wide, heavy limbs. */
  spreading: {
    TH: 470, trunkW: 38, zone: [180, 240],
    scaffold: { from: 0.28, to: 0.96, step: [26, 32], ang: f => 72 - 36 * f, maxL: f => 0.255 + 0.64 * (1 - Math.pow(f, 1.2)), rate: 7, bend: 0.0028 },
  },
  /** Flat-topped: a short leaning trunk, limbs that rise then spread level. */
  umbrella: {
    TH: 350, curve: [0.002, 0.004], wob: [0.014, 0.04], massFlat: 0.42, massK: 1.1, zone: [100, 130],
    scaffold: { from: 0.39, to: 0.885, step: [24, 30], ang: f => 52 - 12 * f, maxL: f => 0.86 - 0.3 * f, rate: 8, bend: -0.0021 },
    sub: { first: [40, 60], step: [22, 30], ang: [45, 70], maxL: (s, L) => 40 + 60 * (1 - s / L), rate: 4, bend: -0.0012 },
  },
  /** A short trunk, then a few long limbs that rise and fan outward. */
  vase: {
    TH: 380, zone: [170, 220],
    scaffold: { from: 0.29, to: 0.895, step: [26, 34], ang: f => 40 - 8 * f, maxL: f => 0.605 + 0.237 * (1 - f), rate: 8, bend: -0.0012 },
    sub: { first: [40, 55], step: [26, 34], ang: [32, 50], maxL: (s, L) => 45 + 70 * (1 - s / L), rate: 4, bend: -0.001 },
  },
  /** A straight leader with whorls of level limbs, long at the bottom and short at the top. */
  conical: {
    TH: 640, grow: 0.7, trunkW: 22, curve: [0.0003, 0.0006], profile: u => Math.pow(1 - u, 0.9), markTop: 0.4,
    massK: 0.6, massFlat: 0.6, zone: [130, 999], twigs: false, sway: 0.8,
    scaffold: { from: 0.19, to: 0.953, step: [38, 46], whorl: true, ang: f => 84 - 24 * f, maxL: f => 0.047 + 0.36 * Math.pow(1 - f, 1.1), rate: 6, bend: 0 },
    sub: { first: [22, 32], step: [24, 32], ang: [45, 60], maxL: (s, L) => 22 + 34 * (1 - s / L), rate: 3, bend: 0 },
  },
  /** A tight column: many short limbs held almost upright against the trunk. */
  columnar: {
    TH: 620, grow: 0.72, trunkW: 18, curve: [0.0002, 0.0005], wob: [0.006, 0.014], profile: u => Math.pow(1 - u, 0.9),
    twigs: false, zone: [999, 999], massK: 0.9, massFlat: 1, sway: 0.6,
    scaffold: { from: 0.06, to: 0.95, step: [14, 20], ang: f => 16 - 8 * f, maxL: f => 0.1 + 0.32 * Math.sin(Math.PI * (0.25 + 0.75 * f)) * (1 - 0.6 * f), rate: 6, bend: 0.004 },
    sub: { first: [12, 20], step: [16, 22], ang: [18, 30], maxL: (s, L) => 18 + 22 * (1 - s / L), rate: 3, bend: 0.006 },
  },
  /** Broad flat layers on a stout trunk, like a cedar of Lebanon or a dogwood. */
  tiered: {
    TH: 520, grow: 0.66, trunkW: 30, curve: [0.0008, 0.0016], zone: [999, 999], twigs: false, massFlat: 0.32, massK: 1.05,
    scaffold: { from: 0.3, to: 0.95, step: [62, 80], whorl: true, ang: f => 86 - 18 * f, maxL: f => 0.16 + 0.62 * Math.pow(1 - f, 1.05), rate: 7, bend: -0.0004 },
    sub: { first: [20, 30], step: [16, 22], ang: [55, 80], maxL: (s, L) => 28 + 46 * (1 - s / L), rate: 3.5, bend: 0.0015 },
  },
  /** Limbs that arch up and out, then fall in long curtains. */
  weeping: {
    TH: 440, grow: 0.62, trunkW: 30, curve: [0.0015, 0.003], hang: 0.75, zone: [400, 600], twigs: false, massFlat: 1.2, massK: 0.35, sway: 1.3,
    scaffold: { from: 0.42, to: 0.97, step: [18, 24], ang: f => 58 - 26 * f, maxL: f => 0.62 + 0.25 * (1 - f), rate: 8, bend: 0.0015, droop: 0.012 },
    sub: { first: [22, 34], step: [14, 20], ang: [18, 32], maxL: (s, L) => 150 + 170 * (1 - s / L), rate: 7, bend: 0, droop: 0.1 },
  },
  /** Stems that fork almost from the ground into a low, wide dome. */
  bushy: {
    TH: 330, trunkW: 16, curve: [0.002, 0.004], markTop: 0.4, zone: [160, 200], twigs: false, sway: 1.1,
    scaffold: { from: 0.12, to: 0.94, step: [20, 26], ang: f => 46 - 14 * f, maxL: f => 0.485 + 0.364 * (1 - f), rate: 7, bend: -0.0006 },
  },
  /** A bottle trunk that fattens early, under stubby limbs that splay like roots in the sky. */
  bottle: {
    TH: 300, grow: 0.45, trunkW: 66, thicken: 1.1, profile: u => (1 - 0.4 * Math.pow(u, 1.6)) * (1 - Math.pow(u, 6)), wob: [0.01, 0.06],
    massK: 0.55, sp: [12, 12, 11], zone: [45, 70], sway: 0.2,
    scaffold: { from: 0.583, to: 0.973, step: [11, 15], ang: f => 82 - 22 * f, maxL: f => 0.567 - 0.167 * f, rate: 7, bend: 0.0022 },
    sub: { first: [30, 40], step: [26, 34], ang: [30, 50], maxL: (s, L) => 26 + 30 * (1 - s / L), rate: 3, bend: 0.004 },
  },
  /** Cloud pruning: a sinuous trunk with level limbs that end in rounded pads of foliage. */
  cloud: {
    TH: 400, grow: 0.62, trunkW: 30, curve: [0.004, 0.007], wob: [0.02, 0.045], twigs: false, zone: [55, 50, 60],
    massK: 1.25, massFlat: 0.55, sway: 0.5,
    scaffold: { from: 0.3, to: 0.92, step: [44, 60], ang: f => 80 - 22 * f, maxL: f => 0.55 - 0.32 * f, rate: 7, bend: -0.0006 },
    sub: { first: [24, 34], step: [26, 34], ang: [40, 65], maxL: (s, L) => 28 + 26 * (1 - s / L), rate: 3.5, bend: 0.002 },
  },
  /** Forks repeatedly into thick upturned arms, each ending in a spiky rosette. */
  forked: {
    TH: 300, grow: 0.55, trunkW: 22, thicken: 1.3, curve: [0.002, 0.005], wob: [0.015, 0.04], twigs: false,
    per: [3, 3, 3], sp: [4, 4, 4], zone: [34, 34, 34], massK: 0, sway: 0.3,
    scaffold: { from: 0.45, to: 0.96, step: [34, 46], ang: f => 52 - 14 * f, maxL: f => 0.55 - 0.2 * f, rate: 5, bend: 0.006 },
    sub: { first: [40, 55], step: [40, 55], ang: [35, 55], maxL: (s, L) => 45 + 30 * (1 - s / L), rate: 3, bend: 0.008 },
  },
  /** One unbranched trunk crowned with fronds. */
  palm: {
    strategy: "palm", TH: 420, grow: 0.85, trunkW: 16, thicken: 1.2, profile: u => 1 - 0.3 * u, curve: [0.0006, 0.0014], wob: [0.004, 0.01],
    twigs: false, per: [0, 2], sp: [99, 5], zone: [0, 999], hang: 0, massK: 0.22, massFlat: 0.5, marks: "h", markTop: 0.97, sway: 1.1,
    barkKit: { texture: "rings" },
    crown: { fronds: 28, length: [0.42, 0.55], spread: [8, 85], droop: 0.014, turnover: 0.4 },
  },
} satisfies Record<string, Part>;

export const LEAF = {
  lobed: { leafKit: { ...KIT.blade, outline: "obovate", edge: "lobed", lobe: [0.36, 0.46], lobes: [4, 5], ears: [0.05, 0.08], width: [0.36, 0.42], stalk: 0.06 } },
  toothed: { leafKit: { ...KIT.blade, outline: "almond", edge: "serrate", tooth: [0.07, 0.1], teeth: [16, 22], width: [0.26, 0.32], stalk: 0.12 } },
  triangular: { leafKit: { ...KIT.blade, outline: "triangle", edge: "double", tooth: [0.14, 0.2], teeth: [8, 11], edgeFrom: 0.2, width: [0.42, 0.5], stalk: [0.18, 0.24] }, leafSize: 0.7, wide: [0.32, 0.42] },
  ovate: { leafKit: { ...KIT.blade, outline: "ovate", width: [0.34, 0.4] } },
  glossy: { leafKit: { ...KIT.blade, outline: "elliptic", width: [0.3, 0.36], stalk: 0.07, arc: [0.02, 0.06] }, leafSize: 1.25, wide: [0.3, 0.4] },
  lance: { leafKit: { ...KIT.blade, outline: "elliptic", width: [0.1, 0.14], arc: [0.1, 0.16], stalk: 0.04, veins: "mid" }, leafSize: 0.85, wide: [0.13, 0.19] },
  fern: { leafKit: { ...KIT.bipinnate }, shape: "fine", leafSize: 0.6, per: [1, 3, 4], sp: [9, 7, 6] },
  needles: { leafKit: { ...KIT.needles, splay: [0.3, 0.45], twist: [0.02, 0.08] }, shape: "needle", leafSize: 0.9, per: [1, 3, 3], sp: [8, 7, 6] },
  scale: { leafKit: { kind: "scale", sprigs: [7, 10], spread: [0.6, 0.85], thick: 0.1 }, shape: "fine", leafSize: 0.75, per: [1, 3, 3], sp: [7, 6, 5] },
  fan: { leafKit: { kind: "fan", spread: [0.7, 0.95], notch: [0.12, 0.3], stalk: 0.32 }, leafSize: 0.8 },
  palmate: { leafKit: { ...KIT.palmate, side: [0.38, 0.5], spread: [1.5, 1.75], tooth: [0.06, 0.1] }, shape: "maple", leafSize: 1.05, wide: [0.3, 0.4] },
  lacy: { leafKit: { ...KIT.palmate, lobes: 7, side: [0.55, 0.65], spread: [2.3, 2.5], lobeW: 0.38, sharp: 1.6, base: 0.14, tooth: 0.12, teeth: 20 }, shape: "maple", leafSize: 0.75 },
  digitate: { leafKit: { ...KIT.digitate, leaflets: [5, 7], fan: [1, 1.25], width: [0.2, 0.26] } },
  frond: { leafKit: { ...KIT.blade, outline: "elliptic", width: [0.06, 0.08], stalk: 0.02, arc: [0.05, 0.12], veins: "none" }, leafSize: 1.05, wide: [0.06, 0.1] },
  spiky: { leafKit: { ...KIT.needles, count: 9, splay: [2.4, 2.8], twist: [0.02, 0.06], thick: 0.05 }, shape: "needle", leafSize: 1.15 },
} satisfies Record<string, Part>;

export const BARK = {
  furrowed: { barkKit: { texture: "grooves" } },
  plated: { barkKit: { texture: "plates" } },
  papery: { barkKit: { texture: "dashes" }, bark: "#EEEAE0", barkMark: "#3A3633", marks: "h", markTop: 0.85 },
  banded: { barkKit: { texture: "lenticels" }, marks: "h", markTop: 0.7 },
  folded: { barkKit: { texture: "folds" }, markTop: 0.75 },
  ringed: { barkKit: { texture: "rings" }, marks: "h", markTop: 0.97 },
} satisfies Record<string, Part>;

export const SEASON = {
  crimson: { turn: { from: 0.8, to: 0.98, leaf: ["#A82A27", "#DE4E2C", "#F5973B"], mass: ["#80211F", "#BA3A26"] } },
  gold: { turn: { from: 0.8, to: 0.98, leaf: ["#C99A16", "#E8C232", "#F7E27A"], mass: ["#A88010", "#D2AA22"] } },
} satisfies Record<string, Part>;
