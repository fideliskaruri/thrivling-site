import { createLife, createTree, type Layout, type LifeTime } from "../tree";
import type { Pen } from "../tree/pen";
import { ladybirdWalk } from "../tree/critters";
import { PICKER_PX, PICKER_SEED, PICKER_SPECIES, STAGES, TREE_IMAGE_PADDING, TREE_SIZE, type StagePlace } from "./stages";
import { drawPlace, fetchFile, loadFrame, stageImage, StagePlayer } from "./stagePlayer";
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
/**
 * `depth` puts a tree nearer the camera than the hero (negative = closer, in camera-distance units of the wide shot):
 * it then follows real perspective, so while the camera is close to the hero at the top it is beside the camera and out
 * of frame, and it walks into view as the camera pulls back. `drop` lowers its footing (nearer ground sits lower).
 */
interface Spot { id: GroveId; x: number; s: number; layer: GroundLayer; depth?: number; drop?: number }
// Wide screens: the hero stands right of centre so, in the close shot at the top, the left (where the headline is)
// shows only meadow; the left trees come into view as the camera pulls back.
const HERO_X_WIDE = 0.6;
const GROVE_WIDE: Spot[] = [
  { id: "flame", x: 0.02, s: 0.6, layer: 1 }, { id: "wisteria", x: 0.12, s: 0.64, layer: 1 },
  { id: "sakura", x: 0.79, s: 0.64, layer: 1 }, { id: "japaneseMaple", x: 0.93, s: 0.6, layer: 1 },
  { id: "oak", x: 0.455, s: 0.44, layer: 2, depth: -0.4, drop: 0.035 }, { id: "jacaranda", x: 0.86, s: 0.92, layer: 2 },
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

/** A ladybird on the ground: it eases into and out of walking, pauses to feel around, and turns round slowly. */
interface Walker { x: number; dir: number; face: number; v: number; top: number; rest: number; walk: number; phase: number; feel: number }

export function createScene(
  canvas: HTMLCanvasElement,
  options: SceneOptions,
  onDay: (day: number) => void,
  onProgress: (done: number, total: number) => void,
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
  let maxScroll = 1;
  // Bottom of the hero copy in page units, so the counter never sits over the headline, button or scroll hint.
  let copyBottom = 0;
  const counter = document.querySelector<HTMLElement>(".tree-counter");
  let counterX = "", counterY = "";

  // Phones keep every second frame and every device decodes frames at the size they are drawn, so all of them fit
  // in memory; the loader waits for the full set before the page shows.
  const narrow = window.innerWidth < 768;
  const dprCap = Math.min(window.devicePixelRatio || 1, 2);
  const squarePx = Math.min(window.innerWidth * (narrow ? 1.35 : 0.7), window.innerHeight * 1.3) * dprCap * 1.1;
  const frames = narrow ? HERO_STAGES.filter((_, n) => n % 2 === 0 || n === HERO_STAGES.length - 1) : HERO_STAGES;
  const groveIds = [...new Set([...GROVE_WIDE, ...GROVE_NARROW].map(s => s.id))];
  let groveSettled = 0, pickerSettled = 0;
  // Every tree picker frame is downloaded before the page shows too, so picking a tree never waits on the network.
  const pickerFiles = PICKER_SPECIES.flatMap(id => STAGES[id].map(place => `picker/${place.file}`));
  const report = () => {
    if (disposed) return;
    const done = player.settled + groveSettled + pickerSettled;
    const total = frames.length + groveIds.length + pickerFiles.length;
    if (!ready && done >= total) ready = true;
    onProgress(done, total);
  };
  const player = new StagePlayer(HERO, 0, () => { report(); schedule(); }, "hero", frames,
    place => loadFrame(`hero/${place.file}`, Math.min(place.pw, place.w / PICKER_PX * squarePx)));
  const grove = new Map<GroveId, { place: StagePlace; img: HTMLImageElement }>();
  for (const key of pickerFiles) void fetchFile(key).finally(() => { pickerSettled++; report(); });
  for (const id of groveIds) {
    const place = STAGES[id][STAGES[id].length - 1]!;
    void stageImage(place, "picker").then(img => { if (!disposed) { grove.set(id, { place, img }); schedule(); } }, () => {})
      .finally(() => { groveSettled++; report(); });
  }

  const model = createTree(PICKER_SEED, HERO);
  // The hero's falling leaves come from its layout at the current growth (in 5% steps), so they match its leaves.
  const heroLayouts = new Map<number, Layout>();
  const heroLayout = (progress: number) => {
    const q = Math.round(clamp01(progress) * 20);
    let lay = heroLayouts.get(q);
    if (!lay) { lay = model.layout(treeAge(q / 20), 100, TREE_SIZE); heroLayouts.set(q, lay); }
    return lay;
  };
  const ambient = model.createAmbient();
  const sky = createLife();
  // Bees and butterflies that visit the trees live in the world, so they stay on their branch as the camera moves.
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
    layerCache.length = 0;
  }
  // Page height changes rarely (resize, fonts); measuring it every frame forced a layout per frame.
  const measurePage = () => {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const copy = document.querySelector(".hero-copy")?.getBoundingClientRect();
    copyBottom = copy && window.innerWidth < 768 ? copy.bottom + window.scrollY : 0;
  };
  measurePage();
  const pageObserver = new ResizeObserver(() => { measurePage(); schedule(); });
  pageObserver.observe(document.body);

  // The hills and the grass are hundreds of paths; each layer is painted once into a bitmap around the view and reused
  // until the camera zooms more than a few percent or pans past its margin, so a frame costs a few image draws.
  interface LayerBitmap { world: object; layer: GroundLayer; z: number; x0: number; y0: number; x1: number; y1: number; c: HTMLCanvasElement }
  const layerCache: LayerBitmap[] = [];
  function drawLayer(world: ReturnType<typeof worldGround>, layer: GroundLayer, z: number, ox: number, oy: number) {
    const vx0 = -ox / z, vy0 = -oy / z, vx1 = (width - ox) / z, vy1 = (height - oy) / z;
    let hit = layerCache.find(b => b.layer === layer && b.world === world && Math.abs(Math.log(b.z / z)) < 0.045
      && b.x0 <= vx0 && b.y0 <= vy0 && b.x1 >= vx1 && b.y1 >= vy1);
    if (!hit) {
      const mx = (vx1 - vx0) * 0.2, my = (vy1 - vy0) * 0.2;
      const x0 = vx0 - mx, y0 = vy0 - my, x1 = vx1 + mx, y1 = vy1 + my;
      const scale = z * Math.min(dpr, 1.5);
      const c = document.createElement("canvas");
      c.width = Math.ceil((x1 - x0) * scale); c.height = Math.ceil((y1 - y0) * scale);
      const lg = c.getContext("2d")!;
      lg.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
      world.hill(lg, layer);
      if (layer === 2) world.details(lg);
      const old = layerCache.findIndex(b => b.layer === layer);
      hit = { world, layer, z, x0, y0, x1, y1, c };
      if (old >= 0) layerCache[old] = hit; else layerCache.push(hit);
    }
    g.drawImage(hit.c, hit.x0, hit.y0, hit.x1 - hit.x0, hit.y1 - hit.y0);
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
    // With reduced motion the tree is fully grown but the camera still follows the reader's own scrolling.
    const pullTarget = smooth(clamp01((y - growEnd * 0.45) / Math.max(1, maxScroll - growEnd * 0.45)));
    pull = dt && !settings.reduced ? pull + (pullTarget - pull) * Math.min(1, dt * 10) : pullTarget;
    // The last shot stays close too: the grove fills the screen with the hero just right of centre and the ground low.
    const zoomEnd = mobile ? 1.6 : 1.35;
    const zoom = Math.exp(Math.log(zoomTop) * (1 - pull) + Math.log(zoomEnd) * pull);
    const sx = lerp(topX, width * (mobile ? 0.5 : 0.56), pull), sy = lerp(topGround, height * (mobile ? 0.72 : 0.83), pull);
    const camera = (layer: GroundLayer) => {
      const z = 1 + (zoom - 1) * PARALLAX[layer];
      g.setTransform(dpr * z, 0, 0, dpr * z, dpr * (sx - hx * z), dpr * (sy - hy * z));
      return z;
    };
    // Focus on the tree picker: the hero steps back (fainter) and the world dims while its card is centred.
    const focus = pr ? smooth(clamp01(1 - Math.abs(pr.top + pr.height / 2 - height / 2) / (height * 0.7))) : 0;

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
    // Branch tips and blossoms for the visiting bees and butterflies (world units, near-ground trees only).
    const perches: [number, number][] = [], flowers: [number, number][] = [];
    const crown = (x: number, y: number, w: number, h: number) => {
      // Resting spots sit inside the leafy crown (never on its outline), so a visitor that settles is on the foliage.
      for (let n = 0; n < 7; n++) {
        const a = Math.PI * (0.15 + 0.7 * n / 6);
        perches.push([x + w / 2 - Math.cos(a) * w * 0.24, y + h * 0.36 - Math.sin(a) * h * 0.16]);
        flowers.push([x + w * (0.2 + 0.6 * ((n * 0.37) % 1)), y + h * (0.18 + 0.32 * ((n * 0.61) % 1))]);
      }
    };
    const drawTree = (spot: Spot) => {
      const t = grove.get(spot.id);
      if (!t) return;
      if (spot.depth !== undefined) {
        const zo = 1 / Math.max(0.02, 1 / zoom + spot.depth);
        g.setTransform(dpr * zo, 0, 0, dpr * zo, dpr * (sx - hx * zo), dpr * (sy - hy * zo));
      }
      const s = heroWide * spot.s, k = s / PICKER_PX, tx = width * spot.x;
      const ty = (spot.depth !== undefined ? hy + height * (spot.drop ?? 0) : world.top(spot.layer, tx)) + s * 0.012;
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
    for (const layer of [0, 1, 2] as const) {
      const z = camera(layer);
      drawLayer(world, layer, z, sx - hx * z, sy - hy * z);
      if (layer === 1) for (const spot of spots) if (spot.layer === 1) drawTree(spot);
    }
    for (const spot of spots) if (spot.layer === 2 && spot.depth === undefined) drawTree(spot);

    // The hero: a live shadow and soil mound that grow smoothly with it, then the tree frames.
    const k = heroWide / PICKER_PX;
    const ox = hx - (PICKER_PX / 2) * k, oy = hy + heroWide * 0.012 - GROUND * k;
    const heroAlpha = 1 - 0.7 * focus;
    g.globalAlpha = heroAlpha;
    shadow(hx, hy + heroWide * 0.012, Math.max(heroWide * 0.06, atStage(crownW, shown) * k * 0.55));
    g.globalAlpha = 1;
    const { i, blend } = player.atProgress(shown);
    g.save();
    g.translate(ox, oy);
    g.scale(k, k);
    player.draw(g, i, blend, heroAlpha);
    const rx = atStage(soilR, shown);
    if (rx > 0) {
      g.globalAlpha = heroAlpha;
      g.fillStyle = "#D6C4A6";
      g.beginPath(); g.ellipse(soilX, soilBase, rx, rx * 0.18 / 0.98, 0, Math.PI, 2 * Math.PI); g.fill();
      g.globalAlpha = 1;
    }
    g.restore();

    // Ladybirds walk the near ground's real curve, around the hero's feet; at night they are tucked away.
    if (!settings.reduced && settings.time !== "night") {
      const bug = heroWide * 0.024;
      if (!walkers.length) {
        walkers = [{ x: hx - width * 0.12, dir: 1, face: 1, v: 0, top: bug * 0.55, rest: 0.8, walk: 0, phase: 0, feel: 0 }];
      }
      const xMin = hx - width * 0.32, xMax = hx + width * 0.14;
      for (const w of walkers) {
        w.feel += step;
        if (w.rest > 0) {
          w.rest -= step;
          if (w.rest <= 0) {
            // Off again: mostly onward, sometimes back the way it came; a little faster or slower each time.
            if (Math.random() < 0.3 || w.x < xMin || w.x > xMax) w.dir = w.x < xMin ? 1 : w.x > xMax ? -1 : -w.dir;
            w.top = bug * (0.45 + Math.random() * 0.25);
            w.walk = 1.5 + Math.random() * 3.5;
          }
        } else {
          w.walk -= step;
          if (w.walk <= 0 || (w.dir < 0 && w.x < xMin) || (w.dir > 0 && w.x > xMax)) w.rest = 0.7 + Math.random() * 2.2;
        }
        // Turning round: the body pivots through side-on before it walks off the other way.
        w.face += Math.sign(w.dir - w.face) * Math.min(Math.abs(w.dir - w.face), step * 3);
        const turned = Math.abs(w.face - w.dir) < 0.05;
        const target = w.rest > 0 || !turned ? 0 : w.top;
        w.v += (target - w.v) * Math.min(1, step * 5);
        w.x += w.dir * w.v * step;
        // Legs cycle with distance covered, so feet never slide.
        w.phase += (w.v * step) / (bug * 0.5);
        const gy = world.top(2, w.x), slope = Math.atan2(world.top(2, w.x + 2) - world.top(2, w.x - 2), 4);
        g.save();
        g.translate(w.x, gy);
        g.rotate(slope);
        ladybirdWalk(g as unknown as Pen, 0, 0, bug, w.face, w.phase, Math.min(1, w.v / (bug * 0.3)), w.feel);
        g.restore();
      }
    }
    // The hero's own falling leaves and petals, and the visitors in the trees.
    fall({ layout: heroLayout(shown), ambient }, ox, oy, k);
    const hp = player.places[i]!;
    // The day counter rides just above the crown: world point to screen, kept clear of the nav.
    const tipY = sy + (oy + hp.y * k - hy) * zoom;
    const cx = `${Math.round(sx)}px`, cy = `${Math.round(Math.max(navBottom + 70, copyBottom - y + 70, tipY - 14))}px`;
    if (counter && (cx !== counterX || cy !== counterY)) {
      counterX = cx; counterY = cy;
      counter.style.setProperty("--tree-x", cx);
      counter.style.setProperty("--tree-y", cy);
    }
    if (shown > 0.45) crown(ox + hp.x * k, oy + hp.y * k, hp.w * k, hp.h * k);
    if (!settings.reduced && perches.length) {
      treeLife.step(g as unknown as Pen, {
        // Same on-screen size as the sky's visitors, whatever the camera zoom.
        W: width, H: height, s: Math.max(10, width * (mobile ? 0.032 : 0.015)) / zoom,
        air: [-width * 0.2, hy - heroWide * 0.9, width * 1.2, hy - heroWide * 0.15],
        perches, flowers, ground: [],
        time: settings.time, lively: 1,
        max: { butterfly: 2, bee: 3, bird: 0, dragonfly: 0, firefly: 0, ladybird: 0, beetle: 0, squirrel: 0 },
        habitats: ["garden"],
      }, clock * 1000, step);
    }
    // Trees nearer the camera than the hero, drawn last so they stand in front.
    for (const spot of spots) if (spot.depth !== undefined) drawTree(spot);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (focus > 0) { g.fillStyle = `rgba(12, 22, 36, ${(0.22 * focus).toFixed(3)})`; g.fillRect(0, 0, width, height); }

    // Flying visitors live in screen space on their own clock; scrolling never moves them.
    if (!settings.reduced) {
      sky.step(g as unknown as Pen, {
        W: width, H: height, s: Math.max(10, width * (mobile ? 0.032 : 0.015)),
        // On wide screens they keep to the right, clear of the headline and story cards.
        air: [mobile ? 0 : width * 0.45, height * 0.12, width, height * 0.75],
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
      pageObserver.disconnect();
      player.dispose();
      layerCache.length = 0;
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
