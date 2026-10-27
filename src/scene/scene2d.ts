import { createLife, createTree, type Layout, type LifeTime } from "../tree";
import type { Pen } from "../tree/pen";
import { PICKER_GROWTH, PICKER_PX, PICKER_SEED, STAGES, TREE_IMAGE_PADDING, TREE_SIZE, type StagePlace } from "./stages";
import { drawPlace, stageImage, StagePlayer } from "./stagePlayer";

/**
 * The hero plays the app's tree picker: the same pre-rendered growth stages, crossfading in order on one 2D canvas,
 * then the grown tree sways and the app's own ambient life (falling petals, bees at the blossoms, birds, butterflies,
 * fireflies at night) runs on top. More life arrives as the visitor scrolls into the grove.
 */
export interface SceneOptions { paused: boolean; reduced: boolean; replay: number; time: LifeTime }
export interface SceneController { update(options: SceneOptions): void; dispose(): void }

const HERO = "cherry";
const COMPANIONS = ["jacaranda", "oak", "wisteria"] as const;
/** Same pace as the app picker per stage, a little longer overall so the hero can be watched. */
const GROW_MS = 2400;
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
  });
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

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
    if (w === width && h === height && d === dpr) return;
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
    const S0 = mobile ? Math.min(width * 1.18, height * 0.66) : Math.min(width * 0.62, height * 1.02);
    const S = S0 * (1 - scroll * (mobile ? 0.38 : 0.42));
    const groundY = height * (mobile ? 0.9 : 0.93) + scroll * height * 0.02;
    const cx = mobile ? width * (0.5 - scroll * 0.14) : width * (0.72 - scroll * 0.42);
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
        g.translate(width * fx! - (PICKER_PX / 2) * kk, groundY - height * 0.03 * i - GROUND * kk);
        g.scale(kk, kk);
        drawStage(place, img, join);
        g.restore();
      });
    }

    const { i, blend, done: grown } = player.at(now, settings.reduced);
    const day = Math.round((PICKER_GROWTH[i]! / 100) * 90);
    if (day !== lastDay) { lastDay = day; onDay(day); }

    g.save();
    g.translate(ox, oy);
    g.scale(k, k);
    // The grown tree sways gently from its base, like the app's resting tree.
    if (grown && !settings.reduced) {
      const sway = Math.sin(clock * 0.9) * 0.012 + Math.sin(clock * 2.1) * 0.004;
      g.translate(PICKER_PX / 2, GROUND);
      g.transform(1, 0, sway, 1, 0, 0);
      g.translate(-PICKER_PX / 2, -GROUND);
    }
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
  const observer = new ResizeObserver(schedule);
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
