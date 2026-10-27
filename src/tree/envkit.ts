import { rng } from "./util";

const f = (n: number) => Math.round(n * 10) / 10;
type Random = () => number;
export const GROUND: Record<string, (x: number, y: number, size: number, rand: Random) => string> = {
  tuft: (x, y, s, r) => {
    let d = "";
    for (let k = -2; k <= 2; k++) { const lean = k * 0.32 + (r() - 0.5) * 0.2, h = s * (k % 2 ? 7 : 10); d += `M${f(x + k * s)} ${f(y)} q${f(lean * h * 0.3)} ${f(-h * 0.6)} ${f(lean * h)} ${f(-h)}`; }
    return `<path d="${d}" stroke="#5E9A54" stroke-width="${f(s * 1.1)}" stroke-linecap="round" fill="none"/>`;
  },
  flower: (x, y, s, r) => { const col = ["#F4E27A", "#F7F3EA", "#E9A6C0", "#B9A4E8"][Math.floor(r() * 4)]!; return `<path d="M${f(x)} ${f(y)} v${f(-s * 6)}" stroke="#5E9A54" stroke-width="${f(s * 0.9)}"/><circle cx="${f(x)}" cy="${f(y - s * 6.5)}" r="${f(s * 2)}" fill="${col}"/><circle cx="${f(x)}" cy="${f(y - s * 6.5)}" r="${f(s * 0.8)}" fill="#E0A23A"/>`; },
  pebble: (x, y, s, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * (2.4 + r()))}" ry="${f(s * 1.4)}" fill="#B9B2A4"/><ellipse cx="${f(x - s * 0.5)}" cy="${f(y - s * 0.5)}" rx="${f(s)}" ry="${f(s * 0.5)}" fill="#D7D1C4"/>`,
  rock: (x, y, s) => `<path d="M${f(x - s * 7)} ${f(y)} q${f(s)} ${f(-s * 6)} ${f(s * 6)} ${f(-s * 7)} q${f(s * 6)} ${f(-s)} ${f(s * 8)} ${f(s * 7)} z" fill="#9E978B"/><path d="M${f(x - s * 4)} ${f(y - s * 4)} q${f(s * 3)} ${f(-s * 3)} ${f(s * 6)} ${f(-s * 2.6)}" stroke="#C4BDB0" stroke-width="${f(s * 1.2)}" fill="none" stroke-linecap="round"/><path d="M${f(x - s * 6)} ${f(y - s * 0.6)} q${f(s * 4)} ${f(-s * 2)} ${f(s * 7)} ${f(-s * 1)}" stroke="#7FA85E" stroke-width="${f(s * 1.6)}" fill="none" stroke-linecap="round" opacity=".7"/>`,
  mushroom: (x, y, s, r) => `<rect x="${f(x - s * 0.8)}" y="${f(y - s * 4)}" width="${f(s * 1.6)}" height="${f(s * 4)}" rx="${f(s * 0.6)}" fill="#F1E8D8"/><path d="M${f(x - s * 3.2)} ${f(y - s * 3.6)} q${f(s * 3.2)} ${f(-s * 4.4)} ${f(s * 6.4)} 0 z" fill="${r() < 0.6 ? "#C9573F" : "#B88A5A"}"/><circle cx="${f(x - s)}" cy="${f(y - s * 5)}" r="${f(s * 0.5)}" fill="#fff" opacity=".8"/>`,
  leaves: (x, y, s, r) => { let out = ""; for (let k = 0; k < 4; k++) { const dx = (r() - 0.5) * s * 10, dy = (r() - 0.5) * s * 3, a = Math.round(r() * 180); out += `<ellipse cx="${f(x + dx)}" cy="${f(y + dy)}" rx="${f(s * 1.8)}" ry="${f(s * 0.8)}" fill="${["#D9A441", "#C9673A", "#A8B45A"][k % 3]}" transform="rotate(${a} ${f(x + dx)} ${f(y + dy)})"/>`; } return out; },
  stump: (x, y, s) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 7)}" ry="${f(s * 2)}" fill="#000" opacity=".15"/><path d="M${f(x - s * 5)} ${f(y)} v${f(-s * 5)} h${f(s * 10)} v${f(s * 5)} z" fill="#7A5A40"/><ellipse cx="${f(x)}" cy="${f(y - s * 5)}" rx="${f(s * 5)}" ry="${f(s * 2)}" fill="#C9A47C"/><ellipse cx="${f(x)}" cy="${f(y - s * 5)}" rx="${f(s * 2.6)}" ry="${f(s)}" fill="none" stroke="#9C7652" stroke-width="${f(s * 0.5)}"/>`,
  log: (x, y, s) => `<g transform="translate(${f(x - s * 6)} ${f(y - s * 5)}) scale(${f(s / 10)})">
    <ellipse cx="60" cy="50" rx="52" ry="4" fill="#000" opacity=".18"/>
    <path d="M14 30 L18 27 L16 24 L21 25 L22 22 L26 26 L98 26 Q104 26 104 38 Q104 50 98 50 L20 50 Q12 49 13 41 Z" fill="#7A5A40"/>
    <path d="M30 32 H70 M40 40 H88 M26 45 H58" stroke="#5E4430" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="99" cy="38" rx="7" ry="12" fill="#C9A47C"/><ellipse cx="99" cy="38" rx="4.2" ry="7.5" fill="none" stroke="#9C7652" stroke-width="1.2"/><ellipse cx="99" cy="38" rx="1.6" ry="3" fill="#9C7652"/>
    <path d="M24 27 Q32 21 42 26 Q50 22 58 27 Q66 23 74 27 L74 29 L24 29 Z" fill="#6E9E5A"/><path d="M78 27 Q84 23 90 27 L90 29 L78 29 Z" fill="#6E9E5A"/>
    <path d="M50 26 Q50 16 54 10" stroke="#5E8C46" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M53 12 Q60 6 65 10 Q59 15 53 12 Z" fill="#8CC86B"/><path d="M52 15 Q45 11 42 15 Q47 19 52 15 Z" fill="#8CC86B"/></g>`,
};
export const SKY: Record<string, (x: number, y: number, size: number) => string> = {
  cloud: (x, y, s) => `<g fill="#fff" opacity=".85"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 16)}" ry="${f(s * 5)}"/><circle cx="${f(x - s * 5)}" cy="${f(y - s * 3)}" r="${f(s * 6)}"/><circle cx="${f(x + s * 4)}" cy="${f(y - s * 5)}" r="${f(s * 7.5)}"/></g>`,
  sun: (x, y, s) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 18)}" fill="#FCE9A6" opacity=".5"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 11)}" fill="#FAD86A"/>`,
  moon: (x, y, s) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 10)}" fill="#F3EED9"/><circle cx="${f(x + s * 5)}" cy="${f(y - s * 3)}" r="${f(s * 9)}" fill="#25304A"/>`,
  star: (x, y, s) => `<path d="M${f(x)} ${f(y - s * 3)} L${f(x + s * 0.8)} ${f(y)} L${f(x)} ${f(y + s * 3)} L${f(x - s * 0.8)} ${f(y)} Z M${f(x - s * 3)} ${f(y)} L${f(x)} ${f(y - s * 0.8)} L${f(x + s * 3)} ${f(y)} L${f(x)} ${f(y + s * 0.8)} Z" fill="#FFF6D8"/>`,
  bird: (x, y, s) => `<path d="M${f(x - s * 5)} ${f(y)} q${f(s * 2.5)} ${f(-s * 3)} ${f(s * 5)} 0 q${f(s * 2.5)} ${f(-s * 3)} ${f(s * 5)} 0" stroke="#3E4E58" stroke-width="${f(s * 0.9)}" fill="none" stroke-linecap="round"/>`,
  firefly: (x, y, s) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 4)}" fill="#F6E58A" opacity=".25"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 1.3)}" fill="#FBF0B0"/>`,
};
export function clearing(bounds: { x: number; y: number; rx: number; ry: number }, seed: number, options: { avoid?: { x: number; y: number; w: number }[]; growing?: boolean; fallen?: boolean; s?: number } = {}) {
  const { x, y, rx, ry } = bounds, { avoid = [], growing = false, fallen = false, s = 1 } = options;
  const rand = rng(seed * 2654435761 % 2147483647 || 1), parts: [number, string][] = [];
  const weights: [string, number][] = [["tuft", 5], ["flower", growing ? 5 : 1], ["pebble", 2], ["mushroom", 1], ["rock", 0.6], ["leaves", fallen ? 3 : 0.4]];
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0), count = Math.round(10 + rand() * 6);
  for (let k = 0, tries = 0; k < count && tries < 80; tries++) {
    const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * 0.92, px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d;
    if (avoid.some(p => Math.abs(p.x - px) < p.w * 0.32 && Math.abs(p.y - py) < p.w * 0.12)) continue;
    let pick = rand() * total, kind = weights[0]![0];
    for (const [name, weight] of weights) { if ((pick -= weight) < 0) { kind = name; break; } }
    parts.push([py, GROUND[kind]!(px, py, s * (0.75 + rand() * 0.4), rand)]); k++;
  }
  return parts.sort((a, b) => a[0] - b[0]).map(p => p[1]).join("");
}
export function sky(w: number, h: number, time: "night" | "dusk" | "day" | "dawn", seed: number) {
  const rand = rng(seed || 1), out: string[] = [];
  if (time === "night") { for (let k = 0; k < 14; k++) out.push(SKY.star!(rand() * w, rand() * h * 0.6, 0.6 + rand() * 0.6)); out.push(SKY.moon!(w * 0.78, h * 0.22, 1.2)); for (let k = 0; k < 4; k++) out.push(SKY.firefly!(w * (0.2 + rand() * 0.6), h * (0.6 + rand() * 0.3), 0.8)); }
  else { out.push(SKY.sun!(w * (time === "dusk" ? 0.2 : 0.8), h * (time === "dusk" ? 0.55 : 0.2), 1)); for (let k = 0; k < 3; k++) out.push(SKY.cloud!(w * (0.15 + rand() * 0.7), h * (0.15 + rand() * 0.3), 0.7 + rand() * 0.5)); if (time !== "dusk") out.push(SKY.bird!(w * 0.4, h * 0.3, 0.9), SKY.bird!(w * 0.46, h * 0.34, 0.7)); }
  return out.join("");
}
