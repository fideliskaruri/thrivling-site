import { STAGES, type PickerSpecies, type StagePlace } from "./stages";

const cache = new Map<string, Promise<HTMLImageElement>>();
/** Downloaded files kept compressed in memory (object URLs), so later decodes never touch the network. */
const files = new Map<string, string>();

/** Fetches and decodes one stage image once; later calls share the same promise. */
export function stageImage(place: StagePlace, dir = "picker"): Promise<HTMLImageElement> {
  const key = `${dir}/${place.file}`;
  let p = cache.get(key);
  if (!p) {
    const img = new Image();
    img.decoding = "async";
    img.src = files.get(key) ?? `${import.meta.env.BASE_URL}assets/${key}`;
    p = img.decode().then(() => img);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

type Frame = CanvasImageSource;

// A small queue so a phone fetches and decodes a few frames at a time instead of hundreds at once.
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

/**
 * Fetches one frame through the queue and decodes it at `width` device pixels (no bigger than it will be drawn),
 * retrying up to three times. Resolves undefined only if every attempt failed.
 */
export function loadFrame(url: string, width: number, signal?: AbortSignal): Promise<Frame | undefined> {
  return new Promise(resolve => {
    // The download holds a queue slot; decoding happens after the slot is freed, so the network never sits idle.
    const decode = async (blob: Blob): Promise<Frame | undefined> => {
      try {
        if (typeof createImageBitmap === "function") {
          return await createImageBitmap(blob, { resizeWidth: Math.max(1, Math.round(width)), resizeQuality: "medium" });
        }
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await img.decode();
        return img;
      } catch { return undefined; }
    };
    jobs.push(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (signal?.aborted) { resolve(undefined); return; }
        try {
          const res = await fetch(url, { signal });
          if (!res.ok) throw new Error(`${res.status}`);
          const blob = await res.blob();
          void decode(blob).then(resolve);
          return;
        } catch {
          await wait(400 * (attempt + 1));
        }
      }
      resolve(undefined);
    });
    pump();
  });
}

/** Downloads one asset file through the queue (with retries) and keeps it in memory; resolves true when it is in. */
export function fetchFile(key: string, signal?: AbortSignal): Promise<boolean> {
  if (files.has(key)) return Promise.resolve(true);
  return new Promise(resolve => {
    jobs.push(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (signal?.aborted) { resolve(false); return; }
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}assets/${key}`, { signal });
          if (!res.ok) throw new Error(`${res.status}`);
          files.set(key, URL.createObjectURL(await res.blob()));
          resolve(true);
          return;
        } catch {
          await wait(400 * (attempt + 1));
        }
      }
      resolve(false);
    });
    pump();
  });
}

/** Starts loading a species' stages in growth order, so playback can begin on the first while the rest arrive. */
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

  constructor(
    readonly id: PickerSpecies,
    private growMs: number,
    onImage: () => void,
    private dir = "picker",
    places: StagePlace[] = STAGES[id],
    load?: (place: StagePlace) => Promise<Frame | undefined>,
  ) {
    this.places = places;
    this.images = new Array(this.places.length);
    this.places.forEach((place, i) => {
      const p = load ? load(place) : stageImage(place, this.dir);
      void p.then(img => { if (img) this.images[i] = img; }, () => {})
        .finally(() => { this.settled++; onImage(); });
    });
  }

  restart() { this.start = -1; this.held = 0; }
  get loadedFirst() { return !!this.images[0]; }

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
