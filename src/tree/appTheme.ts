// Window look, copied from the concept's CSS (ux-concepts/window.html).

export type SkyPhase = "dawn" | "day" | "dusk" | "night";

export interface Theme {
  phase: SkyPhase;
  /** Sky gradient top to bottom; `skyAt` gives the stop positions. */
  sky: [string, string, string];
  skyAt: [number, number, number];
  ink: string;
  soft: string;
  /** Translucent fill for buttons and the action bar. */
  glass: string;
  /** Opaque fill for sheets and popovers that sit over the tree. */
  panel: string;
  hill: string;
  hill2: string;
  /** Text on an ink-filled button. */
  onInk: string;
  stars: boolean;
  /** Day marks: a clean day, a skipped day, a day still ahead. */
  leaf: string;
  skip: string;
  todo: string;
  /** Divider between rows inside a glass panel. */
  line: string;
}

export const themes: Record<SkyPhase, Theme> = {
  dawn: {
    phase: "dawn", sky: ["#9DB4D9", "#F4C7B0", "#F9E2C8"], skyAt: [0, 0.62, 1],
    ink: "#1F3340", soft: "rgba(31,51,64,0.9)", glass: "rgba(255,255,255,0.35)", panel: "#FBF3EE",
    hill: "#7E9F63", hill2: "#6A8B52", onInk: "#FFFFFF", stars: false,
    leaf: "#2F7D47", skip: "#7A4C0C", todo: "rgba(31,51,64,0.2)", line: "rgba(31,51,64,0.14)",
  },
  day: {
    phase: "day", sky: ["#8CC8EE", "#CBE7F5", "#EAF5F8"], skyAt: [0, 0.62, 1],
    ink: "#1F3340", soft: "rgba(31,51,64,0.82)", glass: "rgba(255,255,255,0.35)", panel: "#F3F9FC",
    hill: "#6E9E5A", hill2: "#5B8A4A", onInk: "#FFFFFF", stars: false,
    leaf: "#2F7D47", skip: "#7A4C0C", todo: "rgba(31,51,64,0.2)", line: "rgba(31,51,64,0.14)",
  },
  dusk: {
    phase: "dusk", sky: ["#22305C", "#3F5585", "#D29676"], skyAt: [0, 0.6, 1],
    ink: "#FBF5F2", soft: "rgba(251,245,242,0.9)", glass: "rgba(20,32,60,0.32)", panel: "#24345E",
    hill: "#4E7350", hill2: "#3B5E40", onInk: "#1C2B52", stars: false,
    leaf: "#B5E39B", skip: "#FFD79A", todo: "rgba(251,245,242,0.24)", line: "rgba(251,245,242,0.16)",
  },
  night: {
    phase: "night", sky: ["#08122A", "#0F2142", "#1A3157"], skyAt: [0, 0.6, 1],
    ink: "#F1F4FB", soft: "rgba(241,244,251,0.9)", glass: "rgba(10,20,45,0.38)", panel: "#1B2A50",
    hill: "#244236", hill2: "#1A3329", onInk: "#1C2B52", stars: true,
    leaf: "#A8DB8F", skip: "#F2B45A", todo: "rgba(241,244,251,0.22)", line: "rgba(241,244,251,0.14)",
  },
};

/** Same hour bands as the concept. */
export function phaseAt(hour: number): SkyPhase {
  return hour < 7 ? "night" : hour < 10 ? "dawn" : hour < 17 ? "day" : hour < 20 ? "dusk" : "night";
}

/** Font families. Never set fontWeight with these; the family already is the weight (Android ignores weight on custom fonts). */
export const font = {
  thin: "Urbanist_200ExtraLight",
  regular: "Urbanist_400Regular",
  semibold: "Urbanist_600SemiBold",
  bold: "Urbanist_700Bold",
} as const;

/** Text on the light input fields inside sheets, in every phase. */
export const fieldInk = "#1F3340";
export const fieldBg = "rgba(255,255,255,0.6)";
export const hairline = "rgba(127,140,160,0.3)";

/** One shape language: every card, sheet and popover uses `panel`, tiles and thumbnails inside them use `inner`,
 * and every button, chip and tab is a pill. Round icon buttons are circles (size / 2). */
export const shape = { panel: 24, inner: 16, pill: 999 } as const;

/** The concept's sheet easing: cubic-bezier(.2,.8,.2,1). */
export const EASE = [0.2, 0.8, 0.2, 1] as const;
