import { themes, type SkyPhase } from "../tree/appTheme";
import { GROUND, clearing, rng } from "../tree";

export interface GroundClearing { x: number; r: number }

const cache = new Map<string, HTMLCanvasElement>();
const phases: SkyPhase[] = ["dawn", "day", "dusk", "night"];

function mix(a: string, b: string, amount: number) {
  const parse = (color: string) => color.startsWith("#")
    ? [1, 3, 5].map(i => Number.parseInt(color.slice(i, i + 2), 16))
    : color.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
  const aa = parse(a), bb = parse(b);
  return `rgb(${aa.map((value, i) => Math.round(value + (bb[i]! - value) * amount)).join(" ")})`;
}

function crest(width: number, height: number, groundY: number, x: number) {
  const t = x / Math.max(1, width);
  return groundY + height * (
    Math.sin(t * Math.PI * 2.15 + 0.3) * 0.018
    + Math.sin(t * Math.PI * 4.1 + 1.15) * 0.008
    + Math.sin(t * Math.PI * 0.95 - 0.5) * 0.01
  );
}

export function groundTop(width: number, height: number, groundY: number, x: number) {
  return crest(width, height, groundY, Math.max(0, Math.min(width, x)));
}

function hillPath(
  g: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  lift: number,
  amplitude: number,
  phase: number,
) {
  const yAt = (x: number) => crest(width, height, groundY, x) - lift
    + height * amplitude * Math.sin(x / width * Math.PI * 2 + phase);
  g.beginPath();
  g.moveTo(0, yAt(0));
  for (let x = 0; x <= width; x += Math.max(8, width / 48)) {
    const next = Math.min(width, x);
    g.lineTo(next, yAt(next));
  }
  g.lineTo(width, yAt(width));
  g.lineTo(width, height);
  g.lineTo(0, height);
  g.closePath();
}

function drawEnvkitMark(
  g: CanvasRenderingContext2D,
  kind: "tuft" | "flower" | "pebble",
  x: number,
  y: number,
  size: number,
  rand: () => number,
) {
  const markup = GROUND[kind](x, y, size, rand);
  paintEnvkit(g, markup);
}

function paintEnvkit(g: CanvasRenderingContext2D, markup: string) {
  const tags = /<(path|circle|ellipse|rect)\b([^>]*)\/?>/g;
  for (const match of markup.matchAll(tags)) {
    const tag = match[1]!;
    const attributes: Record<string, string> = {};
    for (const attribute of match[2]!.matchAll(/([\w-]+)="([^"]*)"/g)) {
      attributes[attribute[1]!] = attribute[2]!;
    }
    g.save();
    g.globalAlpha *= Number(attributes.opacity ?? 1);
    if (attributes.transform) {
      const rotation = attributes.transform.match(/rotate\(([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\)/);
      if (rotation) {
        const [degrees, cx, cy] = rotation.slice(1).map(Number);
        g.translate(cx!, cy!);
        g.rotate(degrees! * Math.PI / 180);
        g.translate(-cx!, -cy!);
      }
    }
    if (attributes.fill && attributes.fill !== "none") g.fillStyle = attributes.fill;
    if (attributes.stroke) g.strokeStyle = attributes.stroke;
    if (attributes["stroke-width"]) g.lineWidth = Number(attributes["stroke-width"]);
    if (attributes["stroke-linecap"] === "round") g.lineCap = "round";
    if (tag === "path" && attributes.d) {
      const path = new Path2D(attributes.d);
      if (attributes.fill && attributes.fill !== "none") g.fill(path);
      if (attributes.stroke) g.stroke(path);
    } else if (tag === "circle") {
      g.beginPath();
      g.arc(Number(attributes.cx), Number(attributes.cy), Number(attributes.r), 0, Math.PI * 2);
      if (attributes.fill && attributes.fill !== "none") g.fill();
      if (attributes.stroke) g.stroke();
    } else if (tag === "ellipse") {
      g.beginPath();
      g.ellipse(Number(attributes.cx), Number(attributes.cy), Number(attributes.rx), Number(attributes.ry), 0, 0, Math.PI * 2);
      if (attributes.fill && attributes.fill !== "none") g.fill();
      if (attributes.stroke) g.stroke();
    } else if (tag === "rect") {
      g.fillRect(Number(attributes.x), Number(attributes.y), Number(attributes.width), Number(attributes.height));
    }
    g.restore();
  }
}

function cacheKey(
  width: number,
  height: number,
  groundY: number,
  phase: SkyPhase,
  seed: number,
  clearings: GroundClearing[],
) {
  return `${width}:${height}:${groundY}:${phase}:${seed}:${clearings.map(c => `${c.x},${c.r}`).join(";")}`;
}

function renderGround(
  width: number,
  height: number,
  groundY: number,
  phase: SkyPhase,
  seed: number,
  clearings: GroundClearing[],
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) return canvas;
  const theme = themes[phase];
  const farTint = phase === "night" ? "#63798C" : phase === "dusk" ? "#96809B" : "#D7E3C0";
  const far = mix(theme.hill, farTint, 0.48);
  const near = mix(theme.hill2, phase === "night" ? "#101D33" : "#1F3340", phase === "night" ? 0.38 : 0.2);

  const layers = [
    { lift: height * 0.105, amplitude: 0.035, offset: 0.5, color: far },
    { lift: height * 0.05, amplitude: 0.026, offset: 2.3, color: theme.hill },
    { lift: 0, amplitude: 0, offset: 0, color: near },
  ];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]!;
    hillPath(g, width, height, groundY, layer.lift, layer.amplitude, layer.offset);
    const gradient = g.createLinearGradient(0, groundY - height * 0.16, 0, height);
    gradient.addColorStop(0, i === 2 ? theme.hill : layer.color);
    gradient.addColorStop(1, i === 2 ? near : mix(layer.color, near, 0.25));
    g.fillStyle = gradient;
    g.fill();
  }

  const rand = rng(seed);
  const baseTop = (x: number) => groundTop(width, height, groundY, x);
  // Fine, phase-tinted grass along the foreground crest.
  g.save();
  g.lineCap = "round";
  for (let i = 0, count = Math.ceil(width / 3.8); i < count; i++) {
    const x = rand() * width;
    const y = baseTop(x) + rand() * height * 0.024;
    const len = height * (0.008 + rand() * 0.015);
    g.strokeStyle = i % 4 === 0 ? mix(theme.hill, "#DDE6B5", 0.45) : mix(theme.hill2, "#5E9A54", 0.36);
    g.lineWidth = Math.max(0.7, width * 0.0015);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (rand() - 0.5) * len, y - len * 0.55, x + (rand() - 0.5) * len * 0.7, y - len);
    g.stroke();
  }
  g.restore();

  // App-shaped tufts, flowers and stones scattered along the near slope.
  const itemCount = Math.max(34, Math.round(width / 12));
  for (let i = 0; i < itemCount; i++) {
    const x = rand() * width;
    const y = baseTop(x) + height * (0.025 + rand() * 0.115);
    const size = Math.max(1.05, Math.min(width, height) * (0.003 + rand() * 0.0025));
    const kind = i % 13 === 4 ? "flower" : i % 7 === 2 ? "pebble" : "tuft";
    drawEnvkitMark(g, kind, x, y, size, rand);
  }

  for (const clearingAt of clearings) {
    const x = Math.max(0, Math.min(width, clearingAt.x));
    const y = baseTop(x) + height * 0.035;
    const radius = Math.max(1, clearingAt.r);
    const marks = clearing(
      { x, y: y + height * 0.03, rx: radius * 0.82, ry: height * 0.045 },
      seed,
      { growing: true, s: Math.max(0.45, sizeScale(width, height)) },
    );
    paintEnvkit(g, marks);
    const glow = g.createRadialGradient(x, y, radius * 0.12, x, y, radius);
    glow.addColorStop(0, phase === "night" ? "rgba(201, 218, 180, .2)" : "rgba(232, 220, 173, .3)");
    glow.addColorStop(1, "rgba(232, 220, 173, 0)");
    g.fillStyle = glow;
    g.beginPath();
    g.ellipse(x, y + height * 0.022, radius, radius * 0.34, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = phase === "night" ? "rgba(5, 13, 27, .3)" : "rgba(47, 51, 35, .19)";
    g.beginPath();
    g.ellipse(x, y + height * 0.018, radius * 0.32, height * 0.008, 0, 0, Math.PI * 2);
    g.fill();
  }
  return canvas;
}

function sizeScale(width: number, height: number) {
  return Math.min(width, height) / 920;
}

export function paintGround(
  g: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  phase: "dawn" | "day" | "dusk" | "night",
  seed = 7,
  clearings: GroundClearing[] = [],
) {
  if (!phases.includes(phase)) return;
  const w = Math.max(1, Math.ceil(width));
  const h = Math.max(1, Math.ceil(height));
  const y = Math.round(groundY);
  const key = cacheKey(w, h, y, phase, seed, clearings);
  let canvas = cache.get(key);
  if (!canvas) {
    canvas = renderGround(w, h, y, phase, seed, clearings);
    cache.set(key, canvas);
    if (cache.size > 12) cache.delete(cache.keys().next().value!);
  }
  g.drawImage(canvas, 0, 0, width, height);
}
