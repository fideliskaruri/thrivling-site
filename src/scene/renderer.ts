import CanvasKitInit, { type Canvas, type CanvasKit, type SkPicture as Picture, type Surface } from "canvaskit-wasm";
import wasmUrl from "canvaskit-wasm/bin/canvaskit.wasm?url";
import { bendAngle, createTree, type RigBoneData, type SpeciesId } from "../tree";
import type { RigLayer } from "../tree/render";
import { SkiaPen } from "./SkiaPen";

const SIZE = 920;
const STAGES = [0, 7, 21, 45, 65, 90];
let kitPromise: Promise<CanvasKit> | undefined;
function loadKit() {
  return kitPromise ??= CanvasKitInit({ locateFile: () => wasmUrl }).catch(error => {
    kitPromise = undefined;
    throw error;
  });
}

interface Rig {
  bones: RigBoneData[];
  chains: number[][];
  layers: { bone: number; picture: Picture }[][];
}
export interface SceneOptions {
  paused: boolean;
  reduced: boolean;
  replay: number;
}
export interface SceneController {
  update(options: SceneOptions): void;
  dispose(): void;
}

function release(rig: Rig | undefined) {
  rig?.layers.forEach(layer => layer.forEach(part => part.picture.delete()));
}

export async function createScene(
  element: HTMLCanvasElement,
  options: SceneOptions,
  onDay: (day: number) => void,
  onReady: () => void,
  onError: (error: unknown) => void,
  signal: AbortSignal,
): Promise<SceneController | undefined> {
  const kit = await loadKit();
  if (signal.aborted) return;
  let settings = options;
  let disposed = false;
  let surface: Surface | null = null;
  let primary: Rig | undefined;
  let companions: Rig[] = [];
  let width = 0, height = 0, dpr = 1;
  let frame = 0, lastTime = 0, elapsed = 0, lastGrowth = 0;
  let stage = -1, building = false, revision = 0;
  let ready = false;
  let companionStarted = false;
  let draws = 0;
  const tree = createTree(1007, "acacia");
  const metrics = { draws: 0, stageMs: [] as number[], backend: "Skia / CanvasKit", liveCanvases: 1 };
  const updateMetrics = () => {
    element.dataset.frames = String(metrics.draws);
    element.dataset.stageMs = metrics.stageMs.map(n => n.toFixed(1)).join(",");
  };
  const canceled = (version: number) => disposed || signal.aborted || revision !== version;
  const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

  async function build(species: SpeciesId, day: number, seed: number, version: number) {
    const started = performance.now();
    const model = species === "acacia" ? tree : createTree(seed, species);
    const source = model.rig(model.layout(day, 100, SIZE));
    const bones = source.bones.map(b => [b.id, b.parent, b.depth, b.px, b.py, b.flex, b.phase, b.maxL] as const);
    const result: Rig = {
      bones,
      chains: bones.map((_, i) => {
        const chain: number[] = [];
        for (let b = i; b >= 0; b = bones[b][1]) chain.unshift(b);
        return chain;
      }),
      layers: [],
    };
    const layers: [RigLayer, number | undefined][] = [
      ["backMass", undefined], ["wood", undefined], ["trunkDetail", undefined],
      ["frontMass", undefined], ["leaves", 0], ["leaves", 1], ["leaves", 2],
      ["details", undefined], ["blossoms", undefined],
    ];
    let slice = performance.now();
    try {
      for (const [layer, band] of layers) {
        const parts: Rig["layers"][number] = [];
        result.layers.push(parts);
        for (let bone = 0; bone < bones.length; bone++) {
          if (canceled(version)) { release(result); return; }
          if (!source.hasPart(layer, bone, band)) continue;
          const recorder = new kit.PictureRecorder();
          const canvas = recorder.beginRecording(kit.LTRBRect(-SIZE, -SIZE, SIZE * 2, SIZE * 2));
          const pen = new SkiaPen(kit, canvas);
          try {
            source.paintPart(pen, layer, bone, band);
            parts.push({ bone, picture: recorder.finishRecordingAsPicture() });
          } finally { pen.dispose(); recorder.delete(); }
          if (performance.now() - slice > 8) { await yieldToBrowser(); slice = performance.now(); }
        }
      }
      metrics.stageMs.push(performance.now() - started);
      return result;
    } catch (error) { release(result); throw error; }
  }

  function drawRig(canvas: Canvas, rig: Rig, x: number, base: number, size: number, time: number) {
    canvas.save();
    canvas.translate(x - size / 2, base - size * 0.935);
    canvas.scale(size / SIZE, size / SIZE);
    const angles = rig.bones.map(b => bendAngle(b, time, settings.paused || settings.reduced ? 0 : 0.65) * 180 / Math.PI);
    for (const layer of rig.layers) {
      for (const { bone, picture } of layer) {
        canvas.save();
        for (const index of rig.chains[bone]) canvas.rotate(angles[index], rig.bones[index][3], rig.bones[index][4]);
        canvas.drawPicture(picture);
        canvas.restore();
      }
    }
    canvas.restore();
  }

  function resize() {
    const nextWidth = element.clientWidth, nextHeight = element.clientHeight;
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    if (nextWidth === width && nextHeight === height && dpr === nextDpr && surface) return;
    surface?.delete();
    width = nextWidth; height = nextHeight; dpr = nextDpr;
    element.width = Math.round(width * dpr);
    element.height = Math.round(height * dpr);
    surface = kit.MakeWebGLCanvasSurface(element);
    if (!surface) throw new Error("This browser could not start the tree's graphics canvas.");
  }
  function draw() {
    if (disposed || document.hidden) return;
    resize();
    if (!surface) return;
    const canvas = surface.getCanvas();
    canvas.clear(kit.TRANSPARENT);
    canvas.save();
    canvas.scale(dpr, dpr);
    const progress = Math.min(1, window.scrollY / Math.max(1, height * 0.85));
    const mobile = width < 768;
    document.documentElement.style.setProperty("--scene-offset",
      `${mobile ? -Math.min(window.scrollY, Math.max(0, height - window.innerHeight)) : 0}px`);
    const size = mobile
      ? Math.min(width * 0.98, height * 0.56) * (1 - progress * 0.24)
      : Math.min(width * 0.62, height * 0.92) * (1 - progress * 0.18);
    const x = mobile ? width * (0.5 - progress * 0.17) : width * (0.73 - progress * 0.49);
    const base = height * (mobile ? 0.94 : 0.92);
    const time = elapsed / 1000;
    if (progress > 0.55) {
      companions.forEach((rig, i) => drawRig(canvas, rig,
        width * (mobile ? 0.72 + i * 0.2 : 0.55 + i * 0.28),
        base + 14, size * (i === 0 ? 0.62 : 0.5) * progress, time + i * 3));
    }
    if (primary) drawRig(canvas, primary, x, base, size, time);
    canvas.restore();
    surface.flush();
    metrics.draws = ++draws;
    updateMetrics();
  }
  function fail(error: unknown) {
    if (disposed) return;
    dispose();
    onError(error);
  }
  async function growTo(next: number) {
    if (building || disposed) return;
    building = true;
    const version = revision;
    try {
      const rig = await build("acacia", STAGES[next], 1007, version);
      if (!rig) return;
      if (canceled(version)) { release(rig); return; }
      release(primary); primary = rig; stage = next; lastGrowth = elapsed;
      onDay(STAGES[next]);
      draw();
      if (!ready) { ready = true; onReady(); }
    } catch (error) { if (!canceled(version)) fail(error); }
    finally {
      building = false;
      if (!disposed) schedule();
    }
  }
  async function buildCompanions() {
    companionStarted = true;
    const version = revision;
    try {
      for (const [species, seed] of [["cherry", 1081], ["cedar", 1042]] as const) {
        const rig = await build(species, 90, seed, version);
        if (!rig) return;
        if (canceled(version)) { release(rig); return; }
        companions.push(rig);
        draw();
      }
    } catch (error) { if (!canceled(version)) fail(error); }
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || document.hidden) return;
    const delta = lastTime ? Math.min(now - lastTime, 100) : 0;
    lastTime = now;
    if (!settings.paused && !settings.reduced) elapsed += delta;
    try {
      draw();
      if (!building && (stage < 0 || (settings.reduced && stage < STAGES.length - 1))) {
        void growTo(settings.reduced ? STAGES.length - 1 : 0);
      } else if (!building && !settings.paused && !settings.reduced && stage < STAGES.length - 1 && elapsed - lastGrowth > 1350) {
        void growTo(stage + 1);
      }
      if (stage === STAGES.length - 1 && !companionStarted && window.scrollY > height * 0.4) void buildCompanions();
    } catch (error) { fail(error); }
    if (!settings.paused && !settings.reduced) schedule();
  }
  function schedule() {
    if (!disposed && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function visibility() {
    lastTime = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else schedule();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    fail(new Error("The browser released the graphics canvas. Reload the tree to continue."));
  }
  const observer = new ResizeObserver(schedule);
  observer.observe(element);
  window.addEventListener("scroll", schedule, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  element.addEventListener("webglcontextlost", contextLost);
  signal.addEventListener("abort", dispose, { once: true });
  function dispose() {
    if (disposed) return;
    disposed = true; revision++;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener("scroll", schedule);
    document.removeEventListener("visibilitychange", visibility);
    element.removeEventListener("webglcontextlost", contextLost);
    signal.removeEventListener("abort", dispose);
    release(primary); primary = undefined;
    companions.forEach(release); companions = [];
    surface?.delete(); surface = null;
    element.dataset.live = "0";
  }
  element.dataset.live = "1";
  element.dataset.renderer = metrics.backend;
  schedule();
  return {
    dispose,
    update(next) {
      if (next.replay !== settings.replay) {
        revision++;
        stage = -1; elapsed = 0; lastGrowth = 0;
        companionStarted = false;
        companions.forEach(release); companions = [];
      }
      settings = next;
      lastTime = 0;
      schedule();
    },
  };
}
