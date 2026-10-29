import { STAGES, type PickerSpecies, type StagePlace } from "./stages";

import { HERO_STAGES } from "./heroStages";

type Frame = CanvasImageSource;

// Saved copies live in the browser's Cache Storage under a name tied to this exact image set, so reloads and later
// visits skip the network, and a deploy with re-rendered trees starts a fresh cache (old ones are removed).
const ASSET_SET = (() => {
  const text = JSON.stringify([HERO_STAGES, STAGES]);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `thrivling-assets-${(h >>> 0).toString(36)}`;
})();
const storage: Promise<Cache | undefined> = (async () => {
  try {
    if (!("caches" in window)) return undefined;
    for (const name of await caches.keys()) if (name.startsWith("thrivling-assets-") && name !== ASSET_SET) void caches.delete(name);
    return await caches.open(ASSET_SET);
  } catch { return undefined; }
})();

// One download queue, so a phone fetches a few files at a time instead of hundreds at once.
const jobs: (() => Promise<void>)[] = [];
let active = 0;
const LIMIT = 10;
function pump() {
  while (active < LIMIT && jobs.length) {
    const job = jobs.shift()!;
    active++;
    void job().finally(() => { active--; pump(); });
  }
}
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Each asset file is fetched once (from Cache Storage when saved, else the network, retrying) and shared. */
const blobs = new Map<string, Promise<Blob | undefined>>();
export function fetchFile(key: string, signal?: AbortSignal): Promise<Blob | undefined> {
  let p = blobs.get(key);
  if (p) return p;
  p = new Promise<Blob | undefined>(resolve => {
    jobs.push(async () => {
      const url = `${import.meta.env.BASE_URL}assets/${key}`;
      const store = await storage;
      try {
        const saved = await store?.match(url);
        if (saved?.ok) { resolve(await saved.blob()); return; }
      } catch { /* fall through to the network */ }
      for (let attempt = 0; attempt < 3; attempt++) {
        if (signal?.aborted) break;
        try {
          const res = await fetch(url, { signal });
          if (!res.ok) throw new Error(`${res.status}`);
          void store?.put(url, res.clone()).catch(() => {});
          resolve(await res.blob());
          return;
        } catch {
          await wait(400 * (attempt + 1));
        }
      }
      blobs.delete(key);
      resolve(undefined);
    });
    pump();
  });
  blobs.set(key, p);
  return p;
}

/** A frame decoded at `width` device pixels (no bigger than it is drawn), from the one shared download. */
export async function loadFrame(key: string, width: number, signal?: AbortSignal): Promise<Frame | undefined> {
  const blob = await fetchFile(key, signal);
  if (!blob) return undefined;
  try {
    if (typeof createImageBitmap === "function") {
      return await createImageBitmap(blob, { resizeWidth: Math.max(1, Math.round(width)), resizeQuality: "medium" });
    }
    return await decodeImage(blob);
  } catch { return undefined; }
}

async function decodeImage(blob: Blob): Promise<HTMLImageElement> {
  const img = new Image();
  const url = URL.createObjectURL(blob);
  img.src = url;
  try { await img.decode(); } finally { URL.revokeObjectURL(url); }
  return img;
}

/** A picker or grove stage, decoded once from the shared download. */
const decoded = new Map<string, Promise<HTMLImageElement>>();
export function stageImage(place: StagePlace, dir = "picker"): Promise<HTMLImageElement> {
  const key = `${dir}/${place.file}`;
  let p = decoded.get(key);
  if (!p) {
    p = fetchFile(key).then(blob => {
      if (!blob) throw new Error(`Could not load ${key}`);
      return decodeImage(blob);
    });
    p.catch(() => decoded.delete(key));
    decoded.set(key, p);
  }
  return p;
}

/**
 * Keeps decoded growth frames only for the given picker species (the current one and its neighbours), so browsing
 * every tree does not hold all their frames in memory. The grown frame of each species stays for the grove, and the
 * files stay downloaded, so a released tree decodes again instantly.
 */
export function keepDecoded(ids: readonly PickerSpecies[]) {
  for (const id of Object.keys(STAGES) as PickerSpecies[]) {
    if (ids.includes(id)) continue;
    const stages = STAGES[id];
    stages.forEach((place, n) => { if (n < stages.length - 1) decoded.delete(`picker/${place.file}`); });
  }
}

/** Decodes a species' stages from the downloaded files, ready to play. */
export function preloadSpecies(id: PickerSpecies) {
  STAGES[id].forEach(place => void stageImage(place).catch(() => {}));
}

/**
 * Plays a species' growth like the app picker: stages crossfade in order over `growMs`, holding on the newest
 * decoded stage instead of skipping ahead, then rests on the grown tree.
 */
export class StagePlayer {
  readonly places: StagePlace[];
  private images: (Frame | undefined)[];
  /** Frames that have finished loading, whether or not they succeeded. */
  settled = 0;
  private start = -1;
  private held = 0;
  private disposed = false;
  private ownsFrames: boolean;

  constructor(
    readonly id: PickerSpecies,
    private growMs: number,
    onImage: () => void,
    private dir = "picker",
    places: StagePlace[] = STAGES[id],
    load?: (place: StagePlace) => Promise<Frame | undefined>,
  ) {
    this.places = places;
    this.ownsFrames = !!load;
    this.images = new Array(this.places.length);
    this.places.forEach((place, i) => {
      const p = load ? load(place) : stageImage(place, this.dir);
      void p.then(img => {
        if (!img) return;
        if (this.disposed) {
          if (this.ownsFrames && 'close' in img && typeof img.close === 'function') img.close();
          return;
        }
        this.images[i] = img;
      }, () => {})
        .finally(() => { if (!this.disposed) { this.settled++; onImage(); } });
    });
  }

  /** Frees decoded frames (ImageBitmaps hold memory until closed). */
  dispose() {
    this.disposed = true;
    for (const f of this.images) if (this.ownsFrames && f && "close" in f && typeof f.close === "function") f.close();
    this.images = [];
  }

  restart() { this.start = -1; this.held = 0; }
  get loadedFirst() { return !!this.images[0]; }
  isLoaded(index: number) { return !!this.images[index]; }
  /** The continuous decoded prefix can play without jumping across missing frames. */
  get loadedProgress() {
    let count = 0;
    while (count < this.images.length && this.images[count]) count++;
    return Math.max(0, count - 1) / Math.max(1, this.places.length - 1);
  }

  /** Stage index, how far the next has faded in, and whether growth has finished. */
  at(now: number, still: boolean): { i: number; blend: number; done: boolean } {
    const last = this.places.length - 1;
    if (still) {
      let i = last;
      while (i > 0 && !this.images[i]) i--;
      return { i: Math.max(0, i), blend: 0, done: true };
    }
    if (!this.images[0]) return { i: 0, blend: 0, done: false };
    if (this.start < 0) this.start = now;
    const p = Math.min(last, Math.max(0, (now - this.start - this.held) / this.growMs) * last);
    const i = Math.floor(p);
    if (i < last && !this.images[i + 1]) {
      // Wait for the next stage rather than jumping past it.
      this.held = now - this.start - (i / last) * this.growMs;
      return { i, blend: 0, done: false };
    }
    return { i, blend: p - i, done: i === last };
  }

  /** Stage for a growth fraction 0..1 (scroll-driven), falling back to the nearest decoded stage below it. */
  atProgress(progress: number): { i: number; blend: number; done: boolean } {
    const last = this.places.length - 1;
    const p = Math.min(1, Math.max(0, progress)) * last;
    let i = Math.floor(p);
    while (i > 0 && !this.images[i]) i--;
    const blend = this.images[i + 1] && i === Math.floor(p) ? p - i : 0;
    return { i, blend, done: i === last };
  }

  draw(g: CanvasRenderingContext2D, i: number, blend: number, alpha = 1) {
    const below = this.images[i];
    if (below) { g.globalAlpha = alpha; drawPlace(g, this.places[i]!, below); }
    const above = this.images[i + 1];
    if (above && blend > 0) { g.globalAlpha = blend * alpha; drawPlace(g, this.places[i + 1]!, above); }
    g.globalAlpha = 1;
  }
}

export function drawPlace(g: CanvasRenderingContext2D, place: StagePlace, img: CanvasImageSource) {
  g.drawImage(img, place.x, place.y, place.w, place.h);
}
