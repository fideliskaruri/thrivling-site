import { useEffect, useRef } from "react";
import type { LifeTime } from "../tree";
import { createScene, type SceneController } from "../scene/scene2d";

/** The fixed living backdrop: the hero tree growing like the app picker, then the grove and its life. */
export function TreeScene({ paused, reduced, replay, time, onDay }: {
  paused: boolean; reduced: boolean; replay: number; time: LifeTime; onDay: (day: number) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<SceneController | undefined>(undefined);
  const dayCallback = useRef(onDay);
  dayCallback.current = onDay;
  const latest = useRef({ paused, reduced, replay, time });
  latest.current = { paused, reduced, replay, time };

  useEffect(() => {
    if (!canvas.current) return;
    controller.current = createScene(canvas.current, latest.current, day => dayCallback.current(day), () => {
      // The page loader stays until the first stage of the tree is ready to draw.
      document.documentElement.classList.add("is-loaded");
    });
    return () => { controller.current?.dispose(); controller.current = undefined; };
  }, []);

  useEffect(() => { controller.current?.update({ paused, reduced, replay, time }); }, [paused, reduced, replay, time]);

  return <canvas ref={canvas} className="scene-canvas" role="img" aria-label="A Thrivling tree growing on a hill, with bees, birds and butterflies visiting" />;
}
