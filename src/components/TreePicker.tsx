import { useEffect, useRef, useState } from "react";
import { PICKER_PX, PICKER_SPECIES, type PickerSpecies } from "../scene/stages";
import { preloadSpecies, StagePlayer } from "../scene/stagePlayer";

const LABELS: Record<PickerSpecies, string> = {
  cherry: "Cherry", oak: "Oak", jacaranda: "Jacaranda", wisteria: "Wisteria",
  sakura: "Sakura", japaneseMaple: "Japanese maple", baobab: "Baobab", flame: "Flame tree",
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
  const id = PICKER_SPECIES[index]!;

  // Scroll position inside the pinned section picks the species.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(0.999, Math.max(0, -r.top / travel));
      setIndex(Math.floor(p * PICKER_SPECIES.length));
      // While the picker is pinned, the hero tree steps back behind it; it comes forward again after.
      const vh = window.innerHeight;
      const enter = Math.min(1, Math.max(0, (vh - r.top) / vh));
      const leave = Math.min(1, Math.max(0, r.bottom / vh));
      document.documentElement.style.setProperty("--picker-focus", Math.min(enter, leave).toFixed(3));
      if (r.top < window.innerHeight * 1.2) preloadSpecies(PICKER_SPECIES[0]);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    const player = new StagePlayer(id, GROW_MS, () => schedule());
    function frame(now: number) {
      raf = 0;
      if (disposed || !el || !g) return;
      const w = el.clientWidth, h = el.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      if (el.width !== Math.round(w * d)) { el.width = Math.round(w * d); el.height = Math.round(h * d); }
      g.setTransform(d, 0, 0, d, 0, 0);
      g.clearRect(0, 0, w, h);
      const k = Math.min(w, h * 1.08) / PICKER_PX;
      g.translate(w / 2 - (PICKER_PX / 2) * k, h * 0.96 - GROUND * k);
      g.scale(k, k);
      // The picker's still ground: a soft shadow and a few tufts of grass.
      g.fillStyle = "rgba(31, 51, 64, 0.08)";
      g.beginPath(); g.ellipse(PICKER_PX / 2, GROUND, 300, 22, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "rgba(96, 150, 80, 0.75)"; g.lineWidth = 3; g.lineCap = "round";
      for (const x of [110, 150, 205, 240, 265, 520, 560]) {
        for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x + a * 10, GROUND - 16 + Math.abs(a) * 5); g.stroke(); }
      }
      const { i, blend, done } = player.at(now, reduced);
      player.draw(g, i, blend);
      if (!done) raf = requestAnimationFrame(frame);
    }
    function schedule() { if (!raf && !disposed) raf = requestAnimationFrame(frame); }
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    schedule();
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); };
  }, [id, reduced]);

  const go = (to: number) => {
    const el = section.current;
    if (!el) return;
    const travel = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((to + 0.5) / PICKER_SPECIES.length) * travel, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <section ref={section} className="picker-section" id="trees" aria-labelledby="picker-title"
      style={{ height: `${100 + PICKER_SPECIES.length * 45}svh` }}>
      <div className="picker-pin">
        <div className="picker-card glass-pane">
          <p className="picker-eyebrow">Pick a tree</p>
          <h2 id="picker-title">Every goal grows its own tree.</h2>
          <div className="picker-stage">
            <canvas ref={canvas} className="picker-canvas" role="img" aria-label={`${LABELS[id]}, growing from a sapling to a full tree`} />
            <button type="button" className="picker-arrow picker-arrow--prev" aria-label="Previous tree" disabled={index === 0} onClick={() => go(index - 1)}>‹</button>
            <button type="button" className="picker-arrow picker-arrow--next" aria-label="Next tree" disabled={index === PICKER_SPECIES.length - 1} onClick={() => go(index + 1)}>›</button>
          </div>
          <p className="picker-name" aria-live="polite">{LABELS[id]}</p>
          <div className="picker-dots" role="tablist" aria-label="Trees">
            {PICKER_SPECIES.map((s, i) => (
              <button key={s} type="button" role="tab" aria-selected={i === index} aria-label={LABELS[s]}
                className={i === index ? "is-active" : ""} onClick={() => go(i)} />
            ))}
          </div>
          <p className="picker-note">{PICKER_SPECIES.length} of the app's 33 trees. Keep scrolling to see the next.</p>
        </div>
      </div>
    </section>
  );
}
