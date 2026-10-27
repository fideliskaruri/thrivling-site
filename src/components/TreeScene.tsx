import { useEffect, useRef, useState } from "react";
import type { SceneController, SceneOptions } from "../scene/renderer";

export function TreeScene({ paused, reduced, replay, onDay }: SceneOptions & { onDay: (day: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<SceneController | undefined>(undefined);
  const latest = useRef({ paused, reduced, replay });
  latest.current = { paused, reduced, replay };
  const dayCallback = useRef(onDay);
  dayCallback.current = onDay;
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!canvas.current) return;
    const element = canvas.current;
    const abort = new AbortController();
    setStatus("loading");
    const fail = (error: unknown) => {
      if (abort.signal.aborted) return;
      console.error("Tree renderer failed", error);
      setMessage(error instanceof Error ? error.message : "The tree could not load.");
      setStatus("error");
    };
    void import("../scene/renderer").then(module =>
      module.createScene(element, latest.current, day => dayCallback.current(day),
        () => setStatus("ready"), fail, abort.signal),
    ).then(scene => {
      if (abort.signal.aborted) scene?.dispose();
      else { controller.current = scene; scene?.update(latest.current); }
    }).catch(fail);
    return () => { abort.abort(); controller.current?.dispose(); controller.current = undefined; };
  }, [attempt]);

  useEffect(() => { controller.current?.update({ paused, reduced, replay }); }, [paused, reduced, replay]);

  return (
    <>
      <canvas key={attempt} ref={canvas} className="scene-canvas" aria-label="A living Thrivling tree, drawn with the app's procedural Skia renderer" role="img" />
      {status !== "ready" && (
        <div className="renderer-notice glass-pane" role="status">
          {status === "loading" ? "Growing your first tree..." : (
            <><p>{message}</p><button type="button" className="small-button" onClick={() => setAttempt(n => n + 1)}>Reload tree</button></>
          )}
        </div>
      )}
    </>
  );
}
