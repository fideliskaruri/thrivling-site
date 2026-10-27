import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!canvas.current) return;
    // The boot loader stays until every tree frame is in, showing real progress; a dead connection still gets the
    // page after 45 seconds, with frames filling in as they arrive.
    const boot = document.getElementById("boot");
    const reveal = () => document.documentElement.classList.add("is-loaded");
    const safety = window.setTimeout(reveal, 45_000);
    controller.current = createScene(canvas.current, latest.current, day => dayCallback.current(day), (done, total) => {
      const p = total ? done / total : 1;
      boot?.style.setProperty("--p", p.toFixed(3));
      boot?.querySelector(".pct")?.replaceChildren(`${Math.round(p * 100)}%`);
      if (done >= total) { window.clearTimeout(safety); reveal(); }
    });
    return () => { window.clearTimeout(safety); controller.current?.dispose(); controller.current = undefined; };
  }, []);

  useEffect(() => { controller.current?.update({ paused, reduced, time }); }, [paused, reduced, time]);

  return <canvas ref={canvas} className="scene-canvas" role="img" aria-label="A grove of Thrivling trees on a grassy hill, with bees, birds and butterflies visiting" />;
}