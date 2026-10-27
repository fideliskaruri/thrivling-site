import { SPECIES, type SpeciesId } from "./species";
import type { Pen } from "./pen";

export const LANDSCAPE_SIZE = 920;
const SIZE = LANDSCAPE_SIZE;
const WHEAT = "#D8C27A";
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export interface GroveItem {
  id: string; seed: number; avgHealth: number; treeAge: number; status: "grown" | "dead"; skips?: number; [extra: string]: unknown;
}
export interface CurrentTree { id: string; seed: number; days: number; health: number; skips?: number; startedAt?: number }
export interface Hotspot { key: string; x: number; top: number; width: number; height: number; radius: number }

interface PlacedTree {
  key: string; current: boolean; id: string; seed: number; days: number; health: number;
  base: number; x: number; ground: number; [extra: string]: unknown;
}

function random(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function mix(a: string, b: string, amount: number) {
  const x = a.match(/\w\w/g)!.map(v => parseInt(v, 16));
  const y = b.match(/\w\w/g)!.map(v => parseInt(v, 16));
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function healthRadius(base: number, health: number) {
  return base * (0.48 + 0.52 * clamp(health / 100));
}

function makeTrees(grove: GroveItem[], current: CurrentTree): PlacedTree[] {
  const seed = (current.seed || 0) ^ (grove.length * 7919);
  const rand = random(seed);
  const trees: PlacedTree[] = [{
    key: "current",
    current: true,
    id: current.id,
    seed: current.seed,
    days: current.days,
    health: current.health,
    skips: current.skips,
    startedAt: current.startedAt,
    avgHealth: current.health,
    base: current.days <= 2 ? 8 : 18 + 51 * Math.pow(clamp(current.days / 90), 0.62),
    x: SIZE / 2,
    ground: SIZE * (current.days <= 2 ? 0.54 : 0.625),
  }];
  for (let i = 0; i < grove.length; i++) {
    const item = grove[i]!;
    const base = 72 + rand() * 10;
    let placed: { x: number; ground: number; base: number } | null = null;
    for (let attempt = 0; attempt < 1600 && !placed; attempt++) {
      const angle = i * 2.399963 + attempt % 12 * 0.19 + rand() * 0.18;
      const distance = 150 + 24 * Math.sqrt(i) + Math.floor(attempt / 12) * 10;
      const x = SIZE / 2 + Math.cos(angle) * distance;
      const ground = SIZE * 0.615 + Math.sin(angle) * distance * 0.82;
      const radius = healthRadius(base, item.avgHealth);
      const overlaps = trees.some(tree => {
        const otherRadius = healthRadius(tree.base, tree.health);
        const otherY = tree.ground - otherRadius * 0.8;
        const thisY = ground - radius * 0.8;
        return Math.hypot(x - tree.x, thisY - otherY) < (radius + otherRadius) * 1.24 + 12;
      });
      if (!overlaps) placed = { x, ground, base };
    }
    if (!placed) {
      const angle = i * 2.399963;
      const distance = 150 + 24 * Math.sqrt(i) + 1350;
      placed = {
        x: SIZE / 2 + Math.cos(angle) * distance,
        ground: SIZE * 0.615 + Math.sin(angle) * distance * 0.82,
        base,
      };
    }
    trees.push({
      ...item, ...placed, key: `grove-${i}`, current: false, days: item.treeAge,
      health: item.status === "dead" ? 0 : item.avgHealth,
    });
  }
  return trees;
}

function drawGround(ctx: Pen, seed: number) {
  const rand = random(seed ^ 0x4f1bbcdc);
  const base = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  base.addColorStop(0, "#A8C18D");
  base.addColorStop(0.55, "#94B27D");
  base.addColorStop(1, "#86A873");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 38; i++) {
    const x = rand() * SIZE, y = rand() * SIZE;
    const radius = 28 + rand() * 105;
    const patch = ctx.createRadialGradient(x, y, 2, x, y, radius);
    patch.addColorStop(0, i % 3 === 0 ? "rgba(218, 219, 155, .20)" : "rgba(210, 226, 163, .16)");
    patch.addColorStop(1, "rgba(210, 226, 163, 0)");
    ctx.fillStyle = patch;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  ctx.save();
  ctx.strokeStyle = "rgba(101, 119, 74, .12)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 125; i++) {
    const x = rand() * SIZE, y = rand() * SIZE, h = 3 + rand() * 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + rand() * 5 - 2.5, y - h * 0.55, x + rand() * 8 - 4, y - h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPath(ctx: Pen, seed: number, endX: number, endY: number) {
  const rand = random(seed ^ 0x29a512);
  const startX = SIZE * 0.1, startY = SIZE * 0.91;
  const control1X = SIZE * 0.19, control1Y = SIZE * 0.77;
  const control2X = endX * 0.55, control2Y = endY + (startY - endY) * 0.34;
  ctx.save();
  ctx.fillStyle = "rgba(223, 211, 171, .58)";
  ctx.strokeStyle = "rgba(118, 119, 82, .16)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const t = (i + 1) / 9, u = 1 - t;
    const x = u ** 3 * startX + 3 * u ** 2 * t * control1X + 3 * u * t ** 2 * control2X + t ** 3 * endX;
    const y = u ** 3 * startY + 3 * u ** 2 * t * control1Y + 3 * u * t ** 2 * control2Y + t ** 3 * endY;
    ctx.beginPath();
    ctx.ellipse(x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 7, 8 + rand() * 4, 4 + rand() * 3, rand() * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function fitCamera(trees: PlacedTree[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const tree of trees) {
    const radius = healthRadius(tree.base, tree.health);
    const canopyX = tree.current ? Math.max(radius * 1.28, 28) : radius * 1.28;
    const canopyY = tree.current ? Math.max(radius * 1.3, 24) : radius * 1.28;
    const cy = tree.ground - radius * 0.82;
    minX = Math.min(minX, tree.x - canopyX);
    maxX = Math.max(maxX, tree.x + canopyX);
    minY = Math.min(minY, cy - canopyY);
    maxY = Math.max(maxY, tree.ground + radius * 0.62);
  }
  const width = maxX - minX, height = maxY - minY;
  const zoom = clamp(SIZE * 0.7 / Math.max(width, height), 0.66, 1.18);
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  return { zoom, x: SIZE / 2 - centerX * zoom, y: SIZE / 2 - centerY * zoom };
}

function drawTree(ctx: Pen, tree: PlacedTree, seed: number): Hotspot {
  const species = SPECIES[tree.id as SpeciesId] || SPECIES.oak;
  const rand = random(seed ^ (tree.seed || 0) ^ (tree.id.length * 101));
  const health = clamp(tree.health / 100);
  const r = healthRadius(tree.base, tree.health);
  const cx = tree.x, cy = tree.ground - r * 0.82;
  const thin = 1 - health;
  const clusterCount = Math.max(3, Math.min(6, Math.round(3 + health * 3)));

  ctx.save();
  if (tree.current) {
    const haloX = Math.max(r * 1.68, 31), haloY = Math.max(r * 0.92, 22);
    ctx.fillStyle = "rgba(247, 244, 192, .22)";
    ctx.beginPath();
    ctx.ellipse(cx, tree.ground + r * 0.1, haloX, haloY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 250, 206, .54)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, tree.ground + r * 0.1, haloX, haloY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(44, 68, 42, .19)";
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.28, tree.ground + r * 0.2, r * 0.94, r * 0.31, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = species.bark || "#7c6651";
  ctx.lineWidth = Math.max(3, r * 0.12);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, tree.ground + r * 0.12);
  ctx.quadraticCurveTo(cx + r * 0.04, tree.ground - r * 0.12, cx + r * 0.015, cy + r * 0.3);
  ctx.stroke();

  const massColors = species.mass || SPECIES.oak.mass;
  const leafColors = species.leaf || SPECIES.oak.leaf;
  const colorPool = [...massColors, ...leafColors];
  for (let i = 0; i < clusterCount; i++) {
    const angle = (Math.PI * 2 * i / clusterCount) + rand() * 0.8;
    const distance = i === 0 ? 0 : r * (0.31 + rand() * 0.26);
    const blobR = r * (i === 0 ? 0.57 : 0.47 + rand() * 0.16);
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance * 0.78;
    const source = colorPool[Math.floor(rand() * colorPool.length)]!;
    ctx.fillStyle = mix(source, WHEAT, thin * 0.82);
    ctx.beginPath();
    ctx.ellipse(x, y, blobR, blobR * (0.82 + rand() * 0.24), angle * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = mix(leafColors[1] || leafColors[0]!, "#EFF2C5", 0.52);
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.19, cy - r * 0.27, r * 0.29, r * 0.16, -0.45, Math.PI, Math.PI * 1.9);
  ctx.fill();

  if (species.blossom && health > 0.55 && r > 19) {
    const flower = species.blossom.colors || ["#F4A7B9"];
    for (let i = 0, n = Math.round(4 + 9 * health); i < n; i++) {
      const angle = rand() * Math.PI * 2, distance = rand() * r * 0.58;
      const x = cx + Math.cos(angle) * distance, y = cy + Math.sin(angle) * distance * 0.7;
      ctx.fillStyle = flower[Math.floor(rand() * flower.length)]!;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.5, r * 0.035), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  return { key: tree.key, x: cx, top: cy - r * 0.72, width: r * 2.5, height: r * 2.5, radius: r };
}

/** Paints the top-down grove on a 920x920 pen and returns tap targets in pen coordinates. */
export function paintLandscape(ctx: Pen, { grove, current }: { grove: GroveItem[]; current: CurrentTree }): Hotspot[] {
  const trees = makeTrees(grove, current);
  const camera = fitCamera(trees);
  const focus = trees.find(tree => tree.current)!;
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawGround(ctx, current.seed + grove.length * 37);
  const transformedX = camera.x + focus.x * camera.zoom;
  const transformedY = camera.y + focus.ground * camera.zoom + 12;
  drawPath(ctx, current.seed, transformedX, transformedY);
  const sorted = [...trees].sort((a, b) => a.ground - b.ground);
  const hotspots: Hotspot[] = [];
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  for (const tree of sorted) {
    const area = drawTree(ctx, tree, current.seed);
    hotspots.push({
      ...area,
      x: camera.x + area.x * camera.zoom,
      top: camera.y + area.top * camera.zoom,
      width: area.width * camera.zoom,
      height: area.height * camera.zoom,
    });
  }
  ctx.restore();
  return hotspots;
}
