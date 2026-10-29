import { useEffect, useRef, useState } from "react";
import type { LifeTime } from "../tree";
import { createScene, type SceneController } from "../scene/scene2d";

/** The living backdrop: one world (ground, grove, hero tree, visitors) behind the page, seen through a scroll camera. */
export function TreeScene({ paused, reduced, time, onDay }: {
  paused: boolean; reduced: boolean; time: LifeTime; onDay: (day: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<SceneController | undefined>(undefined);
  const dayCallback = useRef(onDay);
  dayCallback.current = onDay;
  const latest = useRef({ paused, reduced, time });
  latest.current = { paused, reduced, time };
  // Phones and wide screens load different frame sets at different sizes, so crossing the breakpoint (rotating a
  // tablet, resizing a window) rebuilds the scene; frames come back from browser storage, not the network.
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)");
    const on = () => setNarrow(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!canvas.current) return;
    // Reveal the hero and its neighbouring trees as one composed scene.
    // The HTML still becomes available on a slow connection without revealing partial trees.
    const boot = document.getElementById("boot");
    const reveal = () => {
      if (document.documentElement.classList.contains('is-loaded')) return;
      document.documentElement.classList.add('is-loaded');
      performance.mark('thrivling:usable');
      if (canvas.current) canvas.current.dataset.usableMs = String(Math.round(performance.now()));
    };
    const safety = window.setTimeout(reveal, 3_000);
    controller.current = createScene(canvas.current, latest.current, day => dayCallback.current(day), (done, total, sceneReady) => {
      const p = total ? done / total : 1;
      boot?.style.setProperty("--p", p.toFixed(3));
      boot?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
      if (sceneReady) {
        canvas.current?.setAttribute('data-scene-ready', 'true');
        window.clearTimeout(safety);
        reveal();
      }
      if (done >= total) { window.clearTimeout(safety); reveal(); }
    });
    return () => { window.clearTimeout(safety); controller.current?.dispose(); controller.current = undefined; };
  }, [narrow]);

  useEffect(() => { controller.current?.update({ paused, reduced, time }); }, [paused, reduced, time]);

  return <canvas ref={canvas} className="scene-canvas" data-scene-ready="false" role="img" aria-label="A grove of Thrivling trees on a grassy hill, with bees, butterflies and ladybirds" />;
}
