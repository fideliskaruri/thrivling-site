import { createLife, createTree, type Layout, type LifeTime } from "../tree";
import type { Pen } from "../tree/pen";
import { beetle, ladybird } from "../tree/critters";
import { PICKER_PX, PICKER_SEED, STAGES, TREE_IMAGE_PADDING, TREE_SIZE, type StagePlace } from "./stages";
import { drawPlace, stageImage, StagePlayer } from "./stagePlayer";
import { HERO_STAGES } from "./heroStages";
import { worldGround, type GroundLayer } from "./ground";

/**
 * One painted world behind the page: far, mid and near hills, a grove of the app's trees, the hero cherry and its
 * visitors. Scrolling grows the hero (up to the tree picker) and moves a camera through the world: close at the top so
 * the tree fills the screen, pulling back and panning as you go, ending on a wide shot of the whole grove. Far hills
 * move less than the near ground. Butterflies and birds fly in screen space on their own clock.
 */
export interface SceneOptions { paused: boolean; reduced: boolean; time: LifeTime }
export interface SceneController { update(options: SceneOptions): void; dispose(): void }

const HERO = "cherry";
/** Where the ground meets the trunk in the picker square. */
const GROUND = 690;
type GroveId = keyof typeof STAGES;
/** The grove in the wide shot: x as a fraction of the width, size relative to the hero, and which hill it stands on. */
interface Spot { id: GroveId; x: number; s: number; layer: GroundLayer }
// Wide screens: the hero stands right of centre so, in the close shot at the top, the left (where the headline is)
// shows only meadow; the left trees come into view as the camera pulls back.
const HERO_X_WIDE = 0.6;
const GROVE_WIDE: Spot[] = [
  { id: "flame", x: 0.02, s: 0.6, layer: 1 }, { id: "wisteria", x: 0.12, s: 0.64, layer: 1 },
  { id: "sakura", x: 0.79, s: 0.64, layer: 1 }, { id: "japaneseMaple", x: 0.93, s: 0.6, layer: 1 },
  { id: "oak", x: 0.1, s: 0.95, layer: 2 }, { id: "jacaranda", x: 0.86, s: 0.92, layer: 2 },
];
const GROVE_NARROW: Spot[] = [
  { id: "wisteria", x: 0.2, s: 0.62, layer: 1 }, { id: "sakura", x: 0.8, s: 0.62, layer: 1 },
  { id: "oak", x: 0.04, s: 0.85, layer: 2 }, { id: "jacaranda", x: 0.96, s: 0.85, layer: 2 },
];
/** How much each hill layer follows the camera's zoom: the far hills barely move, the near ground fully. */
const PARALLAX = [0.45, 0.72, 1] as const;

const treeAge = (progress: number) => 3 + 87 * Math.min(1, Math.max(0, progress)) ** 0.75;
const toSquare = (c: number) => PICKER_PX * TREE_IMAGE_PADDING + c * (PICKER_PX * (1 - 2 * TREE_IMAGE_PADDING)) / TREE_SIZE;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (u: number) => u * u * (3 - 2 * u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// Crown width and soil mound per growth stage, made monotonic so the live shadow and soil only ever grow.
const crownW: number[] = [];
const soilR: number[] = [];
for (const p of HERO_STAGES) {
  crownW.push(Math.max(p.w, crownW.at(-1) ?? 0));
  soilR.push(Math.max(p.soil?.[2] ?? 0, soilR.at(-1) ?? 0));
}
const soilBase = HERO_STAGES.at(-1)?.soil?.[1] ?? GROUND;
const soilX = HERO_STAGES.at(-1)?.soil?.[0] ?? PICKER_PX / 2;
const atStage = (list: number[], progress: number) => {
  const f = clamp01(progress) * (list.length - 1), i = Math.floor(f);
  return lerp(list[i]!, list[Math.min(i + 1, list.length - 1)]!, f - i);
};

type WalkerKind = "ladybird" | "beetle";
interface Walker { kind: WalkerKind; x: number; dir: number; speed: number; rest: number }

export function createScene(
  canvas: HTMLCanvasElement,
  options: SceneOptions,
  onDay: (day: number) => void,
  onReady: () => void,
): SceneController {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not start the tree's canvas.");
  const g: CanvasRenderingContext2D = context;
  let settings = options;
  let disposed = false;
  let raf = 0;
  let width = 0, height = 0, dpr = 1;
  let last = 0, clock = 0, lastDay = -1;
  let ready = false;
  let shown = 0;
  let pull = 0;
  let navBottom = 0;

  const player = new StagePlayer(HERO, 0, () => {
    if (!ready && player.loadedFirst) { ready = true; onReady(); }
    schedule();
  }, "hero", HERO_STAGES);
  const grove = new Map<GroveId, { place: StagePlace; img: HTMLImageElement }>();
  for (const id of new Set([...GROVE_WIDE, ...GROVE_NARROW].map(s => s.id))) {
    const place = STAGES[id][STAGES[id].length - 1]!;
    void stageImage(place, "picker").then(img => { if (!disposed) { grove.set(id, { place, img }); schedule(); } }).catch(() => {});
  }

  const model = createTree(PICKER_SEED, HERO);
  const layout: Layout = model.layout(treeAge(1), 100, TREE_SIZE);
  const ambient = model.createAmbient();
  const sky = createLife();
  // Birds, bees and butterflies that visit the trees live in the world, so they stay on their branch as the camera moves.
  const treeLife = createLife();
  const groveAmbient = new Map<GroveId, { layout: Layout; ambient: ReturnType<ReturnType<typeof createTree>["createAmbient"]> }>();
  for (const id of new Set([...GROVE_WIDE, ...GROVE_NARROW].map(s => s.id))) {
    const m = createTree(PICKER_SEED, id as Parameters<typeof createTree>[1]);
    groveAmbient.set(id, { layout: m.layout(treeAge(1), 100, TREE_SIZE), ambient: m.createAmbient() });
  }
  let walkers: Walker[] = [];

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
    if (w === width && h === height && d === dpr) return;
    width = w; height = h; dpr = d;
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
    navBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
    walkers = [];
  }

  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    resize();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const step = settings.paused ? 0 : dt;
    clock += step;
    const mobile = width < 768;
    const y = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - height);

    // Growth: the tree grows from the top of the page until the tree picker comes up.
    const pick = document.querySelector<HTMLElement>(".picker-card");
    const pr = pick?.getBoundingClientRect();
    const arrive = pr ? y + (pr.top + pr.height / 2 - height / 2) : maxScroll * 0.7;
    const growEnd = Math.max(height * 0.5, arrive - height * 0.75);
    const target = settings.reduced ? 1 : clamp01(y / growEnd);
    shown = dt ? shown + (target - shown) * Math.min(1, dt * 10) : target;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    const day = Math.round(shown * 90);
    if (day !== lastDay) { lastDay = day; onDay(day); }

    // The world in its wide shot (zoom 1): the grove stands on the near ground above the footer.
    const horizonWide = height * (mobile ? 0.63 : 0.68);
    const world = worldGround(width, height, horizonWide, settings.time);
    const hx = width * (mobile ? 0.5 : HERO_X_WIDE), hy = world.top(2, hx);
    const heroWide = Math.min(width * (mobile ? 0.82 : 0.36), (hy - navBottom - 40) / 0.72);

    // The close shot at the top: the hero as big as the screen allows, standing at the bottom.
    const topGround = height * (mobile ? 0.9 : 0.93);
    const heroTop = Math.max(width * 0.25, Math.min(width * (mobile ? 1.35 : 0.7), (topGround - navBottom - 10) / 0.71));
    const zoomTop = Math.max(1, heroTop / heroWide);
    const topX = mobile ? width * 0.5 : width * 0.72;

    // Camera: close while the tree grows, pulling back and panning over the rest of the page.
    const pullTarget = settings.reduced ? 1 : smooth(clamp01((y - growEnd * 0.45) / Math.max(1, maxScroll - growEnd * 0.45)));
    pull = dt ? pull + (pullTarget - pull) * Math.min(1, dt * 10) : pullTarget;
    const zoom = Math.exp(Math.log(zoomTop) * (1 - pull));
    const sx = lerp(topX, hx, pull), sy = lerp(topGround, hy, pull);
    const camera = (layer: GroundLayer) => {
      const z = 1 + (zoom - 1) * PARALLAX[layer];
      g.setTransform(dpr * z, 0, 0, dpr * z, dpr * (sx - hx * z), dpr * (sy - hy * z));
    };

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);

    const spots = mobile ? GROVE_NARROW : GROVE_WIDE;
    // A tree's own falling leaves and petals, drawn in its tree units at (ox, oy) with scale k.
    const fall = (amb: { layout: Layout; ambient: { step: typeof ambient.step } }, ox: number, oy: number, k: number) => {
      if (settings.reduced) return;
      const u = toSquare(1) - toSquare(0);
      g.save();
      g.translate(ox + toSquare(0) * k, oy + toSquare(0) * k);
      g.scale(u * k, u * k);
      amb.ambient.step(g as unknown as Pen, amb.layout, clock * 1000, step, { time: settings.time, view: [-TREE_SIZE, TREE_SIZE * 2] });
      g.restore();
    };
    // Branch tips and blossoms for the visiting birds, bees and butterflies (world units, near-ground trees only).
    const perches: [number, number][] = [], flowers: [number, number][] = [];
    const crown = (x: number, y: number, w: number, h: number) => {
      for (let n = 0; n < 7; n++) {
        const a = Math.PI * (0.12 + 0.76 * n / 6);
        perches.push([x + w / 2 - Math.cos(a) * w * 0.42, y + h * 0.3 - Math.sin(a) * h * 0.26]);
        flowers.push([x + w * (0.2 + 0.6 * ((n * 0.37) % 1)), y + h * (0.18 + 0.32 * ((n * 0.61) % 1))]);
      }
    };
    const drawTree = (spot: Spot) => {
      const t = grove.get(spot.id);
      if (!t) return;
      const s = heroWide * spot.s, k = s / PICKER_PX, tx = width * spot.x, ty = world.top(spot.layer, tx) + s * 0.012;
      const ox = tx - (PICKER_PX / 2) * k, oy = ty - GROUND * k;
      shadow(tx, ty, s * 0.3);
      g.save();
      g.translate(ox, oy);
      g.scale(k, k);
      drawPlace(g, t.place, t.img);
      g.restore();
      const amb = groveAmbient.get(spot.id);
      if (amb) fall(amb, ox, oy, k);
      if (spot.layer === 2) crown(ox + t.place.x * k, oy + t.place.y * k, t.place.w * k, t.place.h * k);
    };
    const shadow = (x: number, yy: number, r: number) => {
      const shade = g.createRadialGradient(x, yy, 0, x, yy, r);
      shade.addColorStop(0, settings.time === "night" ? "rgba(0, 8, 18, 0.35)" : "rgba(20, 40, 30, 0.26)");
      shade.addColorStop(1, "rgba(20, 40, 30, 0)");
      g.save();
      g.translate(x, yy); g.scale(1, 0.16); g.translate(-x, -yy);
      g.fillStyle = shade;
      g.beginPath(); g.arc(x, yy, r, 0, Math.PI * 2); g.fill();
      g.restore();
    };

    // Far and mid hills, the back row of the grove on the mid hill, then the near ground and its grass.
    camera(0); world.hill(g, 0);
    camera(1); world.hill(g, 1);
    for (const spot of spots) if (spot.layer === 1) drawTree(spot);
    camera(2); world.hill(g, 2); world.details(g);
    for (const spot of spots) if (spot.layer === 2) drawTree(spot);

    // The hero: a live shadow and soil mound that grow smoothly with it, then the tree frames.
    const k = heroWide / PICKER_PX;
    const ox = hx - (PICKER_PX / 2) * k, oy = hy + heroWide * 0.012 - GROUND * k;
    shadow(hx, hy + heroWide * 0.012, Math.max(heroWide * 0.06, atStage(crownW, shown) * k * 0.55));
    const { i, blend } = player.atProgress(shown);
    g.save();
    g.translate(ox, oy);
    g.scale(k, k);
    player.draw(g, i, blend);
    const rx = atStage(soilR, shown);
    if (rx > 0) {
      g.fillStyle = "#D6C4A6";
      g.beginPath(); g.ellipse(soilX, soilBase, rx, rx * 0.18 / 0.98, 0, Math.PI, 2 * Math.PI); g.fill();
    }
    g.restore();

    // Ladybirds walk the near ground's real curve, around the hero's feet.
    if (!settings.reduced) {
      const bug = heroWide * 0.024;
      if (!walkers.length) {
        const kinds: WalkerKind[] = ["ladybird", "ladybird", "ladybird", "beetle"];
        walkers = kinds.map((kind, n) => ({
          kind, x: hx + width * (n - 2) * 0.09, dir: n % 2 ? 1 : -1,
          speed: bug * (0.5 + Math.random() * 0.4), rest: Math.random() * 2,
        }));
      }
      const xMin = hx - width * 0.32, xMax = hx + width * 0.14;
      for (const w of walkers) {
        if (w.rest > 0) w.rest -= step;
        else {
          w.x += w.dir * w.speed * step;
          if (w.x < xMin || w.x > xMax) w.dir = w.x < xMin ? 1 : -1;
          if (Math.random() < step * 0.25) { w.rest = 0.8 + Math.random() * 2.5; if (Math.random() < 0.4) w.dir *= -1; }
        }
        const gy = world.top(2, w.x), slope = Math.atan2(world.top(2, w.x + 2) - world.top(2, w.x - 2), 4);
        g.save();
        g.translate(w.x, gy);
        g.rotate(slope);
        if (w.kind === "ladybird") ladybird(g as unknown as Pen, 0, -bug * 0.45, bug, w.dir);
        else beetle(g as unknown as Pen, 0, -bug * 1.2 * 0.48, bug * 1.2, w.dir);
        g.restore();
      }
    }

    // The hero's own falling leaves and petals, and the visitors in the trees.
    fall({ layout, ambient }, ox, oy, k);
    const hp = player.places[i]!;
    if (shown > 0.45) crown(ox + hp.x * k, oy + hp.y * k, hp.w * k, hp.h * k);
    if (!settings.reduced && perches.length) {
      treeLife.step(g as unknown as Pen, {
        W: width, H: height, s: heroWide * (mobile ? 0.07 : 0.05),
        air: [-width * 0.2, hy - heroWide * 0.9, width * 1.2, hy - heroWide * 0.15],
        perches, flowers, ground: [],
        time: settings.time, lively: 1,
        max: { butterfly: 2, bee: 3, bird: 0, dragonfly: 0, firefly: 0, ladybird: 0, beetle: 0, squirrel: 0 },
        habitats: ["garden"],
      }, clock * 1000, step);
    }
    // Focus on the tree picker: the world dims a little while its card is centred.
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (pr) {
      const focus = smooth(clamp01(1 - Math.abs(pr.top + pr.height / 2 - height / 2) / (height * 0.7)));
      if (focus > 0) { g.fillStyle = `rgba(12, 22, 36, ${(0.22 * focus).toFixed(3)})`; g.fillRect(0, 0, width, height); }
    }

    // Flying visitors live in screen space on their own clock; scrolling never moves them.
    if (!settings.reduced) {
      sky.step(g as unknown as Pen, {
        W: width, H: height, s: Math.max(10, width * (mobile ? 0.032 : 0.015)),
        air: [0, height * 0.12, width, height * 0.75],
        ground: [],
        time: settings.time, lively: 1,
        max: { butterfly: 4, bee: 4, bird: 0, firefly: 14, dragonfly: 1, ladybird: 0 },
        habitats: ["garden"],
      }, clock * 1000, step);
    }

    const moving = shown !== target || pull !== pullTarget || (!settings.paused && !settings.reduced);
    if (moving) schedule();
  }

  function schedule() {
    if (!disposed && !raf && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const visibility = () => { last = 0; schedule(); };
  const remeasure = () => { width = 0; schedule(); };
  const observer = new ResizeObserver(remeasure);
  observer.observe(canvas);
  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  schedule();

  return {
    update(next) { settings = next; last = 0; schedule(); },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
