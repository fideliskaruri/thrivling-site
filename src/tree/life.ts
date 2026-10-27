import type { Pen } from "./pen";
import { WINGS, bee, bird, butterfly, crab, cone, beetle, dragonfly, drip, firefly, frog, gull, ladybird, mist, note, owl, shimmer, squirrel, star } from "./critters";
import type { Habitat } from "./species/types";

export type LifeTime = "dawn" | "day" | "dusk" | "night";
export type LifeWeather = "clear" | "rain";
export type LifePoint = [number, number] | { mx: number; my: number };
export type LifeGround = [number, number, number];

export interface LifeMax {
  butterfly?: number; bee?: number; dragonfly?: number; ladybird?: number; beetle?: number;
  bird?: number; frog?: number; squirrel?: number; crab?: number; firefly?: number;
}

export interface LifeScene {
  W: number; H: number; s: number;
  /** The visible span in scene units when the screen is wider than the scene; critters cross all of it. */
  view?: [number, number];
  perches?: LifePoint[]; flowers?: LifePoint[]; ground: LifeGround[]; air: [number, number, number, number];
  time?: LifeTime; lively?: number; max?: LifeMax; habitats?: Habitat[]; weather?: LifeWeather;
}

export interface Life {
  step(ctx: Pen, scene: LifeScene, t: number, dt: number): void;
  busy(): boolean;
  reset(): void;
}

type P2 = [number, number];
type Kind = "butterfly" | "bee" | "dragonfly" | "ladybird" | "beetle" | "weaver" | "songbird" | "moth"
  | "frog" | "squirrel" | "crab" | "gull" | "cone" | "drip";
type AmbientFall = { kind: "cone" | "drip"; x: number; y: number; to: number; born: number; life: number; size: number; rot: number };

interface Critter {
  kind: Kind; pts: P2[]; i: number; t0: number | null; legMs: number; rest: number[]; lift: number;
  cols: readonly [string, string]; ph: number; pos: P2; dir: number; resting?: boolean; ang?: number; fled?: boolean;
  x?: number; y?: number; x0?: number; x1?: number; born?: number; life?: number; pause?: number;
}
interface Fly { x: number; y: number; a: number; sp: number; ph: number; w: number; k: number; out?: boolean }

const ease = (u: number) => u * u * (3 - 2 * u);
const pt = (p: LifePoint): P2 => Array.isArray(p) ? p : [p.mx, p.my];
const pick = (a: LifePoint[]): P2 => pt(a[Math.random() * a.length | 0]!);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const insects: Kind[] = ["butterfly", "bee", "dragonfly", "ladybird", "beetle", "moth"];
const isGround = (k: Kind) => k === "ladybird" || k === "beetle" || k === "squirrel" || k === "crab" || k === "frog";

export function createLife(): Life {
  const crit: Critter[] = [], flies: Fly[] = [], falls: AmbientFall[] = [];
  let alwaysOnScenery = false;
  const next: Partial<Record<Kind, number>> = {};
  const count = (k: Kind) => crit.reduce((n, c) => n + Number(c.kind === k), 0);
  const due = (k: Kind, t: number, every: number) => {
    if (next[k] == null) next[k] = t + every * rnd(0.05, 0.3);
    if (t < next[k]!) return false;
    next[k] = t + every * rnd(0.6, 1.4);
    return true;
  };

  function route(kind: Kind, sc: LifeScene, stops: P2[], legMs: number, restMs: [number, number], lift: number): Critter {
    const { W, H } = sc, fromLeft = Math.random() < 0.5, y = () => rnd(0.1, 0.5) * H;
    // Enter and leave well past the screen edges, so nothing pops in or turns back in view.
    const [x0, x1] = sc.view ?? [0, W], margin = W * 0.08;
    const start: P2 = [fromLeft ? x0 - margin : x1 + margin, y()], end: P2 = [fromLeft ? x1 + margin : x0 - margin, y()];
    return {
      kind, pts: [start, ...stops, end], i: 0, t0: null, legMs,
      rest: stops.map(() => rnd(...restMs)).concat(0), lift, cols: WINGS[Math.random() * WINGS.length | 0]!,
      ph: rnd(0, 6), pos: start, dir: 1,
    };
  }

  function travel(c: Critter, t: number, sc: LifeScene) {
    c.t0 ??= t;
    for (;;) {
      if (c.i >= c.pts.length - 1) return false;
      const a = c.pts[c.i]!, b = c.pts[c.i + 1]!, el = t - c.t0;
      if (el < c.legMs) {
        const u = ease(el / c.legMs), cx = (a[0] + b[0]) / 2;
        const cy = Math.min(a[1], b[1]) - c.lift * sc.W;
        c.pos = [(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * cx + u * u * b[0],
          (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * cy + u * u * b[1]];
        c.dir = b[0] >= a[0] ? 1 : -1; c.resting = false; c.ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        return true;
      }
      if (el < c.legMs + c.rest[c.i]!) { c.pos = b; c.resting = true; return true; }
      c.t0 += c.legMs + c.rest[c.i]!; c.i++;
    }
  }

  function flee(c: Critter, t: number) {
    if (c.fled || c.i >= c.pts.length - 2) return;
    c.fled = true; c.pts = [c.pos, c.pts[c.pts.length - 1]!]; c.rest = [0]; c.i = 0; c.t0 = t;
  }

  function groundCritter(kind: Kind, sc: LifeScene, t: number) {
    const strips = sc.ground;
    const [x0, x1, y] = strips[Math.random() * strips.length | 0]!, dir = Math.random() < 0.5 ? 1 : -1;
    crit.push({ kind, pts: [], i: 0, t0: null, legMs: 0, rest: [], lift: 0, cols: WINGS[0]!, ph: rnd(0, 6),
      pos: [0, 0], dir, x: rnd(x0, x1), y, x0, x1, born: t, life: rnd(15000, 26000), pause: 0 });
  }

  function spawn(sc: LifeScene, t: number) {
    const { perches = [], flowers = [], ground = [], air, time = "day", lively = 1, max = {}, habitats = ["garden"], weather = "clear" } = sc;
    const healthy = Math.max(0, Math.min(1, lively));
    if (lively < 0.3) return;
    const dry = habitats.includes("dry"), wet = habitats.includes("wet"), forest = habitats.includes("forest");
    const garden = habitats.includes("garden"), coast = habitats.includes("coast");
    const rain = weather === "rain", night = time === "night", dusk = time === "dusk";
    const moving = () => crit.length < 6;
    const cap = (value: number) => Math.floor(value * healthy);

    if (!rain && !night && moving() && (flowers.length > 0 || garden)
      && count("butterfly") < cap(max.butterfly ?? 2)
      && due("butterfly", t, (dusk ? 16000 : 7000) / healthy)) {
      const n = perches.length ? (Math.random() < 0.5 ? 2 : 1) : 0;
      const stops = n ? Array.from({ length: n }, () => pick(perches))
        : [[rnd(air[0], air[2]), rnd(air[1], (air[1] + air[3]) / 2)] as P2];
      crit.push(route("butterfly", sc, stops, 2000, n ? [2500, 5000] : [0, 0], 0.1));
    }
    if (!rain && !night && !dusk && flowers.length && moving()
      && count("bee") < cap(max.bee ?? 1) && due("bee", t, 9000 / healthy))
      crit.push(route("bee", sc, Array.from({ length: 3 + (Math.random() * 3 | 0) }, () => pick(flowers)), 700, [700, 1500], 0.02));

    const dragonflyCap = wet ? Math.min(2, cap(max.dragonfly ?? 2)) : cap(max.dragonfly ?? 1);
    const dragonflyInterval = wet ? 15000 : 26000;
    if (!rain && !night && moving() && count("dragonfly") < dragonflyCap
      && due("dragonfly", t, dragonflyInterval / healthy))
      crit.push(route("dragonfly", sc, Array.from({ length: 3 }, () => [rnd(air[0], air[2]), rnd(air[1], air[3])]), 450, [500, 1300], 0.01));

    if (!rain && !night && garden && ground.length && moving() && count("ladybird") < cap(max.ladybird ?? 1)
      && due("ladybird", t, 5000 / healthy)) groundCritter("ladybird", sc, t);
    if (!rain && !night && dry && ground.length && moving() && count("beetle") < cap(max.beetle ?? 1)
      && due("beetle", t, 12000 / healthy)) groundCritter("beetle", sc, t);

    if (rain && (dry || forest) && perches.length && !count("weaver") && !count("songbird") && moving() && due("songbird", t, 1800))
      crit.push(route(forest ? "songbird" : "weaver", sc, [pick(perches)], 1000, [90000, 90000], 0.08));
    if (!rain && !night && perches.length && moving()) {
      const kind = dry ? "weaver" : forest ? "songbird" : null;
      const maxBird = cap(max.bird ?? 1);
      if (kind && count(kind) < maxBird && due(kind, t, 18000 / healthy))
        crit.push(route(kind, sc, Array.from({ length: 1 + (Math.random() < 0.35 ? 1 : 0) }, () => pick(perches)), 1300, [4500, 10000], 0.08));
    }
    if (!rain && !night && coast && moving() && count("gull") < cap(max.bird ?? 1) && due("gull", t, 23000 / healthy))
      crit.push(route("gull", sc, [], 9000, [0, 0], 0.015));

    if (!rain && !night && wet && ground.length && moving() && count("frog") < cap(max.frog ?? 1)
      && due("frog", t, 26000 / healthy)) groundCritter("frog", sc, t);
    if (!rain && !night && forest && ground.length && moving() && count("squirrel") < cap(max.squirrel ?? 1)
      && due("squirrel", t, 21000 / healthy)) groundCritter("squirrel", sc, t);
    if (!rain && !night && coast && ground.length && moving() && count("crab") < cap(max.crab ?? 1)
      && due("crab", t, 24000 / healthy)) groundCritter("crab", sc, t);

    if (!rain && night && perches.length && !count("moth") && moving() && due("moth", t, 2000))
      crit.push(route("moth", sc, [pick(perches), pick(perches)], 3600, [3500, 7000], 0.025));

    const wantCones = forest && !rain && !night && perches.length && due("cone", t, 42000 / healthy);
    if (wantCones) {
      const from = pt(pick(perches)), strip = ground[Math.random() * ground.length | 0];
      if (strip) falls.push({ kind: "cone", x: from[0], y: from[1], to: strip[2], born: t, life: 3000, size: sc.s * 0.75, rot: rnd(-0.3, 0.3) });
    }
    if (rain && perches.length && ground.length && due("drip", t, 3400)) {
      const from = pt(pick(perches)), strip = ground[Math.random() * ground.length | 0]!;
      falls.push({ kind: "drip", x: from[0] + rnd(-sc.s, sc.s), y: from[1], to: strip[2], born: t, life: 2300, size: sc.s * 0.32, rot: 0 });
    }
  }

  function step(ctx: Pen, sc: LifeScene, t: number, dt: number) {
    const { s, air, time = "day", lively = 1, max = {}, habitats = ["garden"], weather = "clear", ground } = sc;
    const rain = weather === "rain", night = time === "night", dry = habitats.includes("dry"), wet = habitats.includes("wet");
    alwaysOnScenery = night || (dry && time === "day" && !rain) || (wet && ground.length > 0);
    spawn(sc, t);

    const fireflyBase = night ? max.firefly ?? 7 : time === "dusk" && dry ? Math.ceil((max.firefly ?? 7) / 2) : 0;
    const want = rain ? 0 : Math.floor(fireflyBase * Math.max(0, Math.min(1, lively)));
    let activeFlies = 0;
    for (const f of flies) if (!f.out) activeFlies++;
    while (activeFlies++ < want)
      flies.push({ x: rnd(air[0], air[2]), y: rnd(air[1], air[3]), a: rnd(0, 6), sp: rnd(0.4, 0.8), ph: rnd(0, 6), w: rnd(0.6, 1.2), k: 0 });
    let keep = want;
    for (let i = flies.length - 1; i >= 0; i--) {
      const f = flies[i]!;
      if (!f.out && keep-- <= 0) f.out = true;
      f.k = Math.max(0, Math.min(1, f.k + (f.out ? -dt : dt) * 0.8));
      if (f.out && !f.k) { flies.splice(i, 1); continue; }
      f.a += Math.sin(t * 0.0007 + f.ph) * dt * 1.6;
      f.x += Math.cos(f.a) * f.sp * s * 2 * dt; f.y += Math.sin(f.a) * f.sp * s * 1.2 * dt;
      if (f.x < air[0] || f.x > air[2] || f.y < air[1] || f.y > air[3]) f.a += Math.PI * dt * 2;
      const g = Math.max(0, Math.sin(t * 0.0021 * f.w + f.ph)) ** 2;
      ctx.globalAlpha = f.k; firefly(ctx, f.x, f.y, s * 0.6, 0.25 + 0.75 * g);
    }
    ctx.globalAlpha = 1;

    for (let i = crit.length - 1; i >= 0; i--) {
      const c = crit[i]!;
      if (isGround(c.kind)) {
        const age = t - c.born!;
        if (age > c.life! || lively < 0.3 || (night && insects.includes(c.kind)) || (rain && insects.includes(c.kind))) { crit.splice(i, 1); continue; }
        c.pause = Math.max(0, c.pause! - dt);
        if (c.kind === "frog") {
          const phase = (age % 5200) / 5200, hopping = phase < 0.22;
          const hop = hopping ? Math.sin(phase / 0.22 * Math.PI) * s * 1.5 : 0;
          if (phase > 0.2) c.x = c.x! + c.dir * s * 0.04 * dt;
          frog(ctx, c.x!, c.y!, s * 1.1, hop);
        } else {
          if (c.pause! <= 0) {
            const speed = c.kind === "squirrel" ? 0.72 : c.kind === "crab" ? 0.56 : 0.5;
            c.x = c.x! + c.dir * s * speed * dt;
            if (c.x! < c.x0! || c.x! > c.x1!) c.dir *= -1;
            if (Math.random() < dt * (c.kind === "squirrel" ? 0.18 : 0.25)) c.pause = rnd(0.8, 2.2);
          }
          if (c.kind === "ladybird") ladybird(ctx, c.x!, c.y!, s * 0.6, c.dir);
          if (c.kind === "beetle") beetle(ctx, c.x!, c.y!, s * 0.8, c.dir);
          if (c.kind === "squirrel") squirrel(ctx, c.x!, c.y!, s * 1.25, c.dir);
          if (c.kind === "crab") crab(ctx, c.x!, c.y!, s * 1.1, c.dir);
        }
        continue;
      }
      if (c.kind === "moth" && !night) { crit.splice(i, 1); continue; }
      const birdKind = c.kind === "weaver" || c.kind === "songbird" || c.kind === "gull";
      const sheltered = rain && (c.kind === "weaver" || c.kind === "songbird");
      const shouldFlee = birdKind
        ? night || lively < 0.3 || (rain && c.kind === "gull")
        : insects.includes(c.kind)
          ? lively < 0.3 || (night && c.kind !== "moth") || rain
          : (lively < 0.3 || night) && c.kind !== "dragonfly" && c.kind !== "moth"
            && c.kind !== "weaver" && c.kind !== "songbird";
      if (shouldFlee) flee(c, t);
      if (!travel(c, t, sc)) { crit.splice(i, 1); continue; }
      const [x, y] = c.pos;
      if (c.kind === "butterfly" || c.kind === "moth") {
        const f = 0.25 + 0.75 * Math.abs(Math.sin(t * (c.resting ? 0.004 : 0.03) + c.ph));
        const bob = c.resting ? 0 : Math.sin(t * 0.006 + c.ph) * s * 0.9;
        const cols = c.kind === "moth" ? ["#E4E1D7", "#BEBCC5"] as const : c.cols;
        butterfly(ctx, x + Math.sin(t * 0.005 + c.ph) * s * (c.resting ? 0 : 0.9), y + bob - (c.resting ? s * 0.6 : 0), s * (c.kind === "moth" ? 0.72 : 1), f, cols, 0.2 * Math.sin(t * 0.004 + c.ph), c.kind === "moth");
      } else if (c.kind === "bee") {
        bee(ctx, x + Math.sin(t * 0.013 + c.ph) * s * 0.5, y - s * 0.8 + Math.sin(t * 0.017) * s * 0.4, s * 0.75, t, c.dir);
      } else if (c.kind === "dragonfly") {
        const hov = c.resting ? Math.sin(t * 0.01 + c.ph) * s * 0.3 : 0;
        dragonfly(ctx, x, y + hov, s * 1.3, c.resting ? (c.dir > 0 ? 0 : Math.PI) : c.ang!, t);
      } else if (c.kind === "gull") {
        gull(ctx, x, y, s * 1.9, 0.35 + 0.3 * Math.sin(t * 0.002 + c.ph), c.dir);
      } else {
        const color = c.kind === "weaver" ? "#E9BC45" : "#8A6347";
        bird(ctx, x, y, s * 1.15, color, sheltered ? "puffed" : c.resting ? "perched" : "flying", c.dir, Math.sin(t * 0.02 + c.ph));
        if (c.kind === "songbird" && c.resting && !rain) note(ctx, x + s * 0.85, y - s * 0.75, s * 0.65);
      }
    }

    for (let i = falls.length - 1; i >= 0; i--) {
      const f = falls[i]!, age = t - f.born, p = Math.min(1, age / f.life);
      if (p >= 1) { falls.splice(i, 1); continue; }
      const a = ctx.globalAlpha; ctx.globalAlpha = 1 - p;
      const y = f.y + (f.to - f.y) * ease(p);
      if (f.kind === "cone") cone(ctx, f.x + Math.sin(p * 7) * s * 0.18, y, f.size, f.rot + p * 0.5);
      else drip(ctx, f.x, y, f.size);
      ctx.globalAlpha = a;
    }

    if (dry && time === "day" && weather !== "rain") {
      for (const [x0, x1, y] of ground) shimmer(ctx, x0 + Math.sin(t * 0.00012) * s, y - s * 0.7, x1 - x0, s, t * 0.001);
    }
    if (wet && ground.length) {
      const alpha = time === "day" ? 0.12 : 0.19;
      for (let i = 0; i < 3; i++) {
        const [, , y] = ground[Math.floor(i * ground.length / 3)]!;
        mist(ctx, (t * 0.006 + i * sc.W / 3) % Math.max(1, sc.W), y - s * (0.7 + i * 0.5), s * (7 + i * 1.25), s * 0.8, alpha);
      }
    }
    if (night) {
      for (let i = 0; i < 6; i++) {
        const x = air[0] + (air[2] - air[0]) * ((i * 0.173 + 0.07) % 1);
        const y = air[1] + (air[3] - air[1]) * (0.06 + (i % 3) * 0.13);
        star(ctx, x, y, s * (0.12 + (i % 2) * 0.06), 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.002 + i)));
      }
      const perches = sc.perches ?? [];
      if (perches.length) {
        const [x, y] = pt(perches[0]!);
        owl(ctx, x, y - s * 0.3, s * 1.25, Math.sin(t * 0.001 + x) > 0.97);
      }
    }
  }

  return {
    step,
    busy: () => crit.length > 0 || flies.length > 0 || falls.length > 0 || alwaysOnScenery,
    reset() { crit.length = 0; flies.length = 0; falls.length = 0; alwaysOnScenery = false; for (const k of Object.keys(next) as Kind[]) delete next[k]; },
  };
}
