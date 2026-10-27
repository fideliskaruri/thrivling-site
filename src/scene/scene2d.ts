import { createLife, createTree, type Layout, type LifeTime } from "../tree";
import type { Pen } from "../tree/pen";
import { PICKER_GROWTH, PICKER_PX, PICKER_SEED, STAGES, TREE_IMAGE_PADDING, TREE_SIZE, type StagePlace } from "./stages";
import { drawPlace, stageImage, StagePlayer } from "./stagePlayer";
import { HERO_STAGES } from "./heroStages";
import { groundTop, paintGround } from "./ground";

/**
 * The hero plays the app's tree picker: the same pre-rendered growth stages, crossfading in order on one 2D canvas,
 * then the grown tree sways and the app's own ambient life (falling petals, bees at the blossoms, birds, butterflies,
 * fireflies at night) runs on top. More life arrives as the visitor scrolls into the grove.
 */
export interface SceneOptions { paused: boolean; reduced: boolean; replay: number; time: LifeTime }
export interface SceneController { update(options: SceneOptions): void; dispose(): void }

const HERO = "cherry";
const COMPANIONS = ["jacaranda", "oak", "wisteria"] as const;
/** 120 rendered stages over six seconds: slow enough to watch, with no visible stepping. */
const GROW_MS = 6000;
/** Where the ground meets the trunk in the picker square. */
const GROUND = 690;

const treeAge = (progress: number) => 3 + 87 * Math.min(1, Math.max(0, progress)) ** 0.75;
const toSquare = (c: number) => PICKER_PX * TREE_IMAGE_PADDING + c * (PICKER_PX * (1 - 2 * TREE_IMAGE_PADDING)) / TREE_SIZE;

export function createScene(
  canvas: HTMLCanvasElement,
  options: SceneOptions,
  onDay: (day: number) => void,
  onReady: () => void,
): SceneController {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("This browser could not start the tree's canvas.");
  const g = ctx;
  let settings = options;
  let disposed = false;
  let raf = 0;
  let width = 0, height = 0, dpr = 1;
  let last = 0;
  let clock = 0;
  let lastDay = -1;
  let ready = false;

  const player = new StagePlayer(HERO, GROW_MS, () => {
    if (!ready && player.loadedFirst) { ready = true; onReady(); }
    schedule();
  }, "hero", HERO_STAGES);
  const companions: { place: StagePlace; img: HTMLImageElement }[] = [];
  let companionsLoading = false;

  // The grown hero's layout gives the ambient life its real perches and blossoms.
  const model = createTree(PICKER_SEED, HERO);
  const layout: Layout = model.layout(treeAge(PICKER_GROWTH[PICKER_GROWTH.length - 1]! / 100), 100, TREE_SIZE);
  const ambient = model.createAmbient();
  const sky = createLife();

  function loadCompanions() {
    companionsLoading = true;
    for (const id of COMPANIONS) {
      const place = STAGES[id][STAGES[id].length - 1]!;
      void stageImage(place).then(img => { if (!disposed) { companions.push({ place, img }); schedule(); } }).catch(() => {});
    }
  }

  // Room the hero tree may grow into: below the nav, and below the copy when the copy sits above the tree.
  let navBottom = 0, copyBottom = 0, copyRight = 0;
  function measure() {
    navBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
    const copy = document.querySelector(".hero-copy");
    if (copy) {
      const r = copy.getBoundingClientRect();
      copyBottom = r.bottom + window.scrollY;
      copyRight = r.right;
    }
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
    if (w === width && h === height && d === dpr) return;
    measure();
    width = w; height = h; dpr = d;
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
  }

  function drawStage(place: StagePlace, img: HTMLImageElement, alpha: number) {
    g.globalAlpha = alpha;
    drawPlace(g, place, img);
    g.globalAlpha = 1;
  }

  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    resize();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!settings.paused) clock += dt;
    const mobile = width < 768;
    const scroll = Math.min(1, window.scrollY / Math.max(1, height * 0.9));

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);

    // Hero placement: big and grounded on the hill, then smaller and to the side as the grove opens up.
    // Big, but the crown (about 0.71 of the square above the ground) never covers the nav or the copy.
    const crown = 0.71;
    const stacked = mobile || copyRight > width * 0.62;
    const roof = stacked ? Math.max(navBottom, copyBottom) + 14 : navBottom + 10;
    const groundGuess = height * (mobile ? 0.9 : 0.93);
    const S0 = Math.max(width * 0.5 * (mobile ? 1 : 0.5),
      Math.min(mobile ? width * 1.35 : width * 0.7, (groundGuess - roof) / crown));
    const S = S0 * (1 - scroll * (mobile ? 0.38 : 0.42));
    const horizon = height * (mobile ? 0.9 : 0.93);
    const cx = mobile ? width * (0.5 - scroll * 0.14) : width * (0.72 - scroll * 0.42);
    // The app grove's painted ground, cached; the trunk sits on its crest.
    paintGround(g, width, height, horizon, settings.time, 7, [{ x: cx, r: S * 0.22 }]);
    const groundY = groundTop(width, height, horizon, cx) + S * 0.01;
    const k = S / PICKER_PX;
    const ox = cx - (PICKER_PX / 2) * k;
    const oy = groundY - GROUND * k;

    // Companions join on the hills as the visitor scrolls into the grove.
    if (scroll > 0.25 && !companionsLoading) loadCompanions();
    const join = Math.min(1, Math.max(0, (scroll - 0.3) / 0.4));
    if (join > 0) {
      const spots = mobile ? [[0.86, 0.5], [0.2, 0.42], [0.62, 0.36]] : [[0.62, 0.62], [0.9, 0.5], [0.4, 0.4]];
      companions.forEach(({ place, img }, i) => {
        const [fx, fs] = spots[i]!;
        const s = S0 * fs! * (0.85 + 0.15 * join);
        const kk = s / PICKER_PX;
        g.save();
        const tx = width * fx!;
        g.translate(tx - (PICKER_PX / 2) * kk, groundTop(width, height, horizon, tx) + s * 0.01 - GROUND * kk);
        g.scale(kk, kk);
        drawStage(place, img, join);
        g.restore();
      });
    }

    const { i, blend, done: grown } = player.at(now, settings.reduced);
    const day = Math.round((i / Math.max(1, player.places.length - 1)) * 90);
    if (day !== lastDay) { lastDay = day; onDay(day); }

    g.save();
    g.translate(ox, oy);
    g.scale(k, k);
    player.draw(g, i, blend);
    g.restore();

    if (grown && !settings.reduced) {
      // The app's ambient life for this tree, in the tree's own layout units.
      const u = toSquare(1) - toSquare(0);
      g.save();
      g.translate(ox + toSquare(0) * k, oy + toSquare(0) * k);
      g.scale(u * k, u * k);
      const left = -(ox + toSquare(0) * k) / (u * k), right = (width - ox - toSquare(0) * k) / (u * k);
      ambient.step(g as unknown as Pen, layout, clock * 1000, settings.paused ? 0 : dt, { time: settings.time, view: [left, right] });
      g.restore();

      // The sky fills with more visitors the further into the grove the visitor goes.
      const lively = Math.min(1, scroll * 1.4);
      if (lively > 0.05) {
        const hill = height * (mobile ? 0.86 : 0.88);
        sky.step(g as unknown as Pen, {
          W: width, H: height, s: Math.max(9, width * (mobile ? 0.03 : 0.014)),
          air: [0, height * 0.12, width, hill - height * 0.05],
          ground: [[width * 0.05, width * 0.95, hill]],
          perches: layout.loose.slice(0, 80).map(p => ({ mx: ox + toSquare(p.mx) * k, my: oy + toSquare(p.my) * k })),
          flowers: layout.flowers.slice(0, 60).map(p => ({ mx: ox + toSquare(p.mx) * k, my: oy + toSquare(p.my) * k })),
          time: settings.time, lively,
          max: { butterfly: Math.round(1 + lively * 3), bee: Math.round(1 + lively * 4), bird: Math.round(lively * 3), firefly: Math.round(lively * 10), dragonfly: 1 },
          habitats: ["garden"],
        }, clock * 1000, settings.paused ? 0 : dt);
      }
    }

    if (!settings.paused || !grown) schedule();
  }

  function schedule() {
    if (!disposed && !raf && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const visibility = () => { last = 0; schedule(); };
  const observer = new ResizeObserver(() => { width = 0; schedule(); });
  observer.observe(canvas);
  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  schedule();

  return {
    update(next) {
      if (next.replay !== settings.replay) { player.restart(); lastDay = -1; ambient.reset(); }
      settings = next;
      last = 0;
      schedule();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
