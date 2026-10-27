import { STAGES, type PickerSpecies, type StagePlace } from "./stages";

const base = `${import.meta.env.BASE_URL}assets/picker/`;
const cache = new Map<string, Promise<HTMLImageElement>>();

/** Fetches and decodes one stage image once; later calls share the same promise. */
export function stageImage(place: StagePlace): Promise<HTMLImageElement> {
  let p = cache.get(place.file);
  if (!p) {
    const img = new Image();
    img.decoding = "async";
    img.src = base + place.file;
    p = img.decode().then(() => img);
    p.catch(() => cache.delete(place.file));
    cache.set(place.file, p);
  }
  return p;
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
  private images: (HTMLImageElement | undefined)[];
  private start = -1;
  private held = 0;

  constructor(readonly id: PickerSpecies, private growMs: number, onImage: () => void) {
    this.places = STAGES[id];
    this.images = new Array(this.places.length);
    this.places.forEach((place, i) => {
      void stageImage(place).then(img => { this.images[i] = img; onImage(); }).catch(() => {});
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

  draw(g: CanvasRenderingContext2D, i: number, blend: number) {
    const below = this.images[i];
    if (below) { g.globalAlpha = 1; drawPlace(g, this.places[i]!, below); }
    const above = this.images[i + 1];
    if (above && blend > 0) { g.globalAlpha = blend; drawPlace(g, this.places[i + 1]!, above); }
    g.globalAlpha = 1;
  }
}

export function drawPlace(g: CanvasRenderingContext2D, place: StagePlace, img: HTMLImageElement) {
  g.drawImage(img, place.x, place.y, place.w, place.h);
}
