import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PICKER_PX, PICKER_SPECIES, type PickerSpecies } from "../scene/stages";
import { keepDecoded, preloadSpecies, StagePlayer } from "../scene/stagePlayer";

const LABELS: Record<PickerSpecies, string> = {
  cherry: "Cherry", oak: "Oak", jacaranda: "Jacaranda", wisteria: "Wisteria",
  sakura: "Sakura", japaneseMaple: "Japanese maple", baobab: "Baobab", flame: "Flame tree",
};
/** One line on what makes each tree its own. */
const LINES: Record<PickerSpecies, string> = {
  cherry: "Pink blossom, then summer green.", oak: "Slow, broad and full of acorns.", jacaranda: "Purple in spring.",
  wisteria: "Long violet curtains.", sakura: "Clouds of pale pink.", japaneseMaple: "Fine leaves that turn to flame.",
  baobab: "A great trunk that stores the rain.", flame: "Red-orange crown in the dry season.",
};
/** The app picker's pace: the whole growth plays in this long each time a tree comes into view. */
const GROW_MS = 1700;
const GROUND = 690;
const LAST = PICKER_SPECIES.length - 1;

/**
 * The app's tree picker, previewed on the page: pick a tree with the arrows, the thumbnails, a swipe or the arrow
 * keys, and it grows like it does in the app. All its frames are downloaded behind the page loader.
 */
export function TreePicker({ reduced }: { reduced: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const arrived = useRef(false);
  const id = PICKER_SPECIES[index]!;

  // The current tree and its neighbours stay decoded so swiping never waits; the others are let go to save memory.
  useEffect(() => {
    const near = [PICKER_SPECIES[index - 1], id, PICKER_SPECIES[index + 1]].filter((s): s is PickerSpecies => !!s);
    near.forEach(preloadSpecies);
    keepDecoded(near);
  }, [id, index]);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext("2d");
    if (!el || !g) return;
    let raf = 0;
    let disposed = false;
    // The first tree shows grown when the visitor arrives; the others grow each time they are picked.
    const still = reduced || (index === 0 && !arrived.current);
    const player = new StagePlayer(id, GROW_MS, () => schedule());
    function frame(now: number) {
      raf = 0;
      if (disposed || !el || !g) return;
      const w = el.clientWidth, h = el.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(w * d), ch = Math.round(h * d);
      if (el.width !== cw || el.height !== ch) { el.width = cw; el.height = ch; }
      g.setTransform(d, 0, 0, d, 0, 0);
      g.clearRect(0, 0, w, h);
      // The grown crown fills about three quarters of the picker square, so scale up until it nearly fills the stage.
      const k = Math.min(w * (w < 500 ? 1.02 : 1.15), h * 1.25) / PICKER_PX;
      g.translate(w / 2 - (PICKER_PX / 2) * k, h * 0.96 - GROUND * k);
      g.scale(k, k);
      // A soft shadow for the tree to stand on.
      const shade = g.createRadialGradient(PICKER_PX / 2, GROUND, 0, PICKER_PX / 2, GROUND, 260);
      shade.addColorStop(0, "rgba(20, 40, 30, 0.22)");
      shade.addColorStop(1, "rgba(20, 40, 30, 0)");
      g.save();
      g.translate(PICKER_PX / 2, GROUND); g.scale(1, 0.12); g.translate(-PICKER_PX / 2, -GROUND);
      g.fillStyle = shade;
      g.beginPath(); g.arc(PICKER_PX / 2, GROUND, 260, 0, Math.PI * 2); g.fill();
      g.restore();
      const { i, blend, done } = player.at(now, still);
      player.draw(g, i, blend);
      if (!done) raf = requestAnimationFrame(frame);
    }
    function schedule() { if (!raf && !disposed) raf = requestAnimationFrame(frame); }
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); player.dispose(); };
  }, [id, reduced, index]);

  const go = (to: number, focus = false) => {
    const next = Math.min(LAST, Math.max(0, to));
    arrived.current = true;
    setIndex(next);
    if (focus) thumbs.current[next]?.focus();
  };
  // Thumbnails are one radio group: Tab reaches the chosen tree, the arrow keys (and Home/End) move between trees.
  const onThumbKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (step) { e.preventDefault(); go(index + step, true); }
    else if (e.key === "Home") { e.preventDefault(); go(0, true); }
    else if (e.key === "End") { e.preventDefault(); go(LAST, true); }
  };
  const swipe = useRef<{ x: number; y: number } | null>(null);

  return (
    <section className="picker-section" id="trees" aria-labelledby="picker-title">
      <div className="picker-card glass-pane">
        <div className="picker-copy">
          <h2 id="picker-title">You pick your style.</h2>
          <p className="picker-lead">Every goal gets its own tree. Pick the one you want to watch grow.</p>
          <p className="picker-name" aria-live="polite">{LABELS[id]}<span>{LINES[id]}</span></p>
          <div className="picker-thumbs" role="radiogroup" aria-labelledby="picker-title" onKeyDown={onThumbKey}>
            {PICKER_SPECIES.map((s, i) => (
              <button key={s} ref={el => { thumbs.current[i] = el; }} type="button" role="radio" aria-checked={i === index}
                aria-label={LABELS[s]} tabIndex={i === index ? 0 : -1}
                className={i === index ? "is-active" : ""} onClick={() => go(i)}>
                <img src={`${import.meta.env.BASE_URL}assets/picker/${s}-31.webp`} alt="" width="40" height="40" />
              </button>
            ))}
          </div>
        </div>
        <div className="picker-stage"
          onPointerDown={e => { swipe.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={e => {
            const s = swipe.current; swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x, dy = e.clientY - s.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(index + (dx < 0 ? 1 : -1));
          }}
          onPointerCancel={() => { swipe.current = null; }}>
          <canvas ref={canvas} className="picker-canvas" role="img" aria-label={`${LABELS[id]}, growing from a sapling to a full tree`} />
          <button type="button" className="picker-arrow picker-arrow--prev" aria-label="Previous tree" disabled={index === 0} onClick={() => go(index - 1)}>‹</button>
          <button type="button" className="picker-arrow picker-arrow--next" aria-label="Next tree" disabled={index === LAST} onClick={() => go(index + 1)}>›</button>
        </div>
      </div>
    </section>
  );
}