import { themes, type SkyPhase } from "../tree/appTheme";
import { GROUND, rng } from "../tree";

/**
 * The painted ground as a small world: three hill layers (far, mid, near) and the grass, tufts, flowers and stones on
 * the near slope. Everything is in world units (the wide shot's screen pixels), built once per size and sky, and drawn
 * as vectors under whatever camera transform the scene sets, so it stays crisp when the camera is close.
 */

export type GroundLayer = 0 | 1 | 2;

interface Mark { path: Path2D; fill?: string; stroke?: string; width?: number; alpha: number; round: boolean }

export interface WorldGround {
  /** Top of a layer's hill at world x. Layer 2 is the near ground the hero stands on. */
  top(layer: GroundLayer, x: number): number;
  /** Fill one hill layer. */
  hill(g: CanvasRenderingContext2D, layer: GroundLayer): void;
  /** Grass, tufts, flowers and stones on the near slope. */
  details(g: CanvasRenderingContext2D): void;
}

function mix(a: string, b: string, amount: number) {
  const parse = (color: string) => color.startsWith("#")
    ? [1, 3, 5].map(i => Number.parseInt(color.slice(i, i + 2), 16))
    : color.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
  const aa = parse(a), bb = parse(b);
  return `rgb(${aa.map((value, i) => Math.round(value + (bb[i]! - value) * amount)).join(" ")})`;
}

function parseMarks(markup: string, out: Mark[]) {
  for (const match of markup.matchAll(/<(path|circle|ellipse|rect)\b([^>]*)\/?>/g)) {
    const tag = match[1]!;
    const a: Record<string, string> = {};
    for (const attribute of match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)) a[attribute[1]!] = attribute[2]!;
    const path = new Path2D();
    if (tag === "path" && a.d) path.addPath(new Path2D(a.d));
    else if (tag === "circle") path.arc(+a.cx!, +a.cy!, +a.r!, 0, Math.PI * 2);
    else if (tag === "ellipse") path.ellipse(+a.cx!, +a.cy!, +a.rx!, +a.ry!, 0, 0, Math.PI * 2);
    else if (tag === "rect") path.rect(+a.x!, +a.y!, +a.width!, +a.height!);
    let shaped = path;
    const rotation = a.transform?.match(/rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/);
    if (rotation) {
      const [deg, cx, cy] = rotation.slice(1).map(Number);
      const m = new DOMMatrix().translate(cx!, cy!).rotate(deg!).translate(-cx!, -cy!);
      shaped = new Path2D();
      shaped.addPath(path, m);
    }
    out.push({
      path: shaped,
      fill: a.fill && a.fill !== "none" ? a.fill : undefined,
      stroke: a.stroke,
      width: a["stroke-width"] ? Number(a["stroke-width"]) : undefined,
      alpha: Number(a.opacity ?? 1),
      round: a["stroke-linecap"] === "round",
    });
  }
}

const cache = new Map<string, WorldGround>();

/** `horizon` is the near ground's base line in the wide shot. */
export function worldGround(width: number, height: number, horizon: number, phase: SkyPhase, seed = 7): WorldGround {
  const key = `${Math.round(width)}:${Math.round(height)}:${Math.round(horizon)}:${phase}:${seed}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const crest = (x: number) => {
    const t = x / Math.max(1, width);
    return horizon + height * (
      Math.sin(t * Math.PI * 2.15 + 0.3) * 0.018
      + Math.sin(t * Math.PI * 4.1 + 1.15) * 0.008
      + Math.sin(t * Math.PI * 0.95 - 0.5) * 0.01);
  };
  const layers = [
    { lift: height * 0.105, amplitude: 0.035, offset: 0.5 },
    { lift: height * 0.05, amplitude: 0.026, offset: 2.3 },
    { lift: 0, amplitude: 0, offset: 0 },
  ];
  const top = (layer: GroundLayer, x: number) => {
    const l = layers[layer]!;
    return crest(x) - l.lift + height * l.amplitude * Math.sin(x / width * Math.PI * 2 + l.offset);
  };

  const theme = themes[phase];
  const farTint = phase === "night" ? "#4E6A74" : phase === "dusk" ? "#7F9A8A" : "#D7E3C0";
  const far = mix(theme.hill, farTint, 0.48);
  const near = mix(theme.hill2, phase === "night" ? "#0B1A22" : "#1F3340", phase === "night" ? 0.38 : 0.2);
  const colors = [far, theme.hill, near];

  // Wide enough that panning and parallax never show an edge; deep enough that a close camera never sees the bottom.
  const x0 = -width, x1 = width * 2, bottom = height * 4;
  const hills = layers.map((_, i) => {
    const p = new Path2D();
    const step = Math.max(6, width / 96);
    p.moveTo(x0, top(i as GroundLayer, x0));
    for (let x = x0 + step; x <= x1; x += step) p.lineTo(x, top(i as GroundLayer, x));
    p.lineTo(x1, bottom); p.lineTo(x0, bottom); p.closePath();
    return p;
  });

  const rand = rng(seed);
  // Fine grass along the near crest, in two tones, batched into two paths.
  const grass = [new Path2D(), new Path2D()];
  for (let i = 0, count = Math.ceil((x1 - x0) / 3.8); i < count; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = crest(x) + rand() * height * 0.024;
    const len = height * (0.008 + rand() * 0.015);
    const p = grass[i % 4 === 0 ? 0 : 1]!;
    p.moveTo(x, y);
    p.quadraticCurveTo(x + (rand() - 0.5) * len, y - len * 0.55, x + (rand() - 0.5) * len * 0.7, y - len);
  }
  const grassColors = [mix(theme.hill, "#DDE6B5", 0.45), mix(theme.hill2, "#5E9A54", 0.36)];
  const marks: Mark[] = [];
  for (let i = 0, count = Math.max(100, Math.round((x1 - x0) / 12)); i < count; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = crest(x) + height * (0.025 + rand() * 0.2);
    const size = Math.max(1.05, Math.min(width, height) * (0.003 + rand() * 0.0025));
    const kind = i % 13 === 4 ? "flower" : i % 7 === 2 ? "pebble" : "tuft";
    parseMarks(GROUND[kind](x, y, size, rand), marks);
  }

  const world: WorldGround = {
    top,
    hill(g, layer) {
      const gradient = g.createLinearGradient(0, horizon - height * 0.16, 0, height * 1.2);
      gradient.addColorStop(0, layer === 2 ? theme.hill : colors[layer]!);
      gradient.addColorStop(1, layer === 2 ? near : mix(colors[layer]!, near, 0.25));
      g.fillStyle = gradient;
      g.fill(hills[layer]!);
    },
    details(g) {
      g.save();
      g.lineCap = "round";
      g.lineWidth = Math.max(0.7, width * 0.0015);
      for (let i = 0; i < 2; i++) { g.strokeStyle = grassColors[i]!; g.stroke(grass[i]!); }
      for (const m of marks) {
        g.globalAlpha = m.alpha;
        if (m.fill) { g.fillStyle = m.fill; g.fill(m.path); }
        if (m.stroke) {
          g.strokeStyle = m.stroke;
          if (m.width) g.lineWidth = m.width;
          g.lineCap = m.round ? "round" : "butt";
          g.stroke(m.path);
        }
      }
      g.restore();
    },
  };
  cache.set(key, world);
  if (cache.size > 8) cache.delete(cache.keys().next().value!);
  return world;
}
