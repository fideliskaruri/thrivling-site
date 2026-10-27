import { useEffect, useRef, useState } from "react";
import { PICKER_PX, PICKER_SPECIES, type PickerSpecies } from "../scene/stages";
import { preloadSpecies, StagePlayer } from "../scene/stagePlayer";

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

/**
 * The app's tree picker, previewed on the page. The section pins while the visitor scrolls through it; each step of
 * scroll brings the next species, which grows like it does in the app. Arrows and dots do the same by scrolling.
 */
export function TreePicker({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const arrived = useRef(false);
  const id = PICKER_SPECIES[index]!;

  // Start loading the first trees when the picker comes near.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) preloadSpecies(PICKER_SPECIES[0]); }, { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Neighbours load ahead, like the app, so swiping never waits.
  useEffect(() => {
    preloadSpecies(id);
    const next = PICKER_SPECIES[index + 1];
    if (next) preloadSpecies(next);
  }, [id, index]);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext("2d");
    if (!el || !g) return;
    let raf = 0;
    let disposed = false;
    // The hero hands over already grown: show the first tree still; other trees grow when picked.
    const still = reduced || (index === 0 && !arrived.current);
    const player = new StagePlayer(id, GROW_MS, () => schedule());
    function frame(now: number) {
      raf = 0;
      if (disposed || !el || !g) return;
      const w = el.clientWidth, h = el.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      if (el.width !== Math.round(w * d)) { el.width = Math.round(w * d); el.height = Math.round(h * d); }
      g.setTransform(d, 0, 0, d, 0, 0);
      g.clearRect(0, 0, w, h);
      // The grown crown fills about three quarters of the picker square, so scale up until it nearly fills the stage.
      const k = Math.min(w * (w < 500 ? 1.02 : 1.15), h * 1.25) / PICKER_PX;
      g.translate(w / 2 - (PICKER_PX / 2) * k, h * 0.96 - GROUND * k);
      g.scale(k, k);
      // The picker's still ground: a soft shadow and a few tufts of grass.
      g.fillStyle = "rgba(31, 51, 64, 0.08)";
      g.beginPath(); g.ellipse(PICKER_PX / 2, GROUND, 300, 22, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(96, 150, 80, 0.75)"; g.lineWidth = 3; g.lineCap = "round";
      for (const x of [110, 150, 205, 240, 265, 520, 560]) {
        for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x + a * 10, GROUND - 16 + Math.abs(a) * 5); g.stroke(); }
      }
      const { i, blend, done } = player.at(now, still);
      player.draw(g, i, blend);
      if (!done) raf = requestAnimationFrame(frame);
    }
    function schedule() { if (!raf && !disposed) raf = requestAnimationFrame(frame); }
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); };
  }, [id, reduced, index]);

  const go = (to: number) => { arrived.current = true; setIndex(Math.min(PICKER_SPECIES.length - 1, Math.max(0, to))); };
  const swipe = useRef<{ x: number; y: number } | null>(null);


  return (
    <section ref={section} className="picker-section" id="trees" aria-labelledby="picker-title">
      <div className="picker-card glass-pane"
        onKeyDown={e => { if (e.key === "ArrowRight") go(index + 1); else if (e.key === "ArrowLeft") go(index - 1); }}>
        <div className="picker-copy">
          <h2 id="picker-title">You pick your style.</h2>
          <p className="picker-lead">Every goal gets its own tree. Pick the one you want to watch grow.</p>
          <p className="picker-name" aria-live="polite">{LABELS[id]}<span>{LINES[id]}</span></p>
          <div className="picker-thumbs" role="tablist" aria-label="Trees">
            {PICKER_SPECIES.map((s, i) => (
              <button key={s} type="button" role="tab" aria-selected={i === index} aria-label={LABELS[s]}
                className={i === index ? "is-active" : ""} onClick={() => go(i)}>
                <img src={`${import.meta.env.BASE_URL}assets/picker/${s}-31.webp`} alt="" width="40" height="40" loading="lazy" />
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
            <button type="button" className="picker-arrow picker-arrow--next" aria-label="Next tree" disabled={index === PICKER_SPECIES.length - 1} onClick={() => go(index + 1)}>›</button>
          </div>
      </div>
    </section>
  );
}
