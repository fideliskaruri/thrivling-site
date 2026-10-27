import type { Pen } from "../pen";
import type { LeafEntry } from "../grow";
import type { LeafShape } from "../species";

export function edge(ctx: Pen, size: number) {
  if (size > 5) { ctx.strokeStyle = "rgba(28,36,26,0.34)"; ctx.lineWidth = Math.max(0.7, size * 0.05); ctx.lineJoin = "round"; ctx.stroke(); }
}

export function centreVein(ctx: Pen, size: number, curl: number) {
  if (size > 9) {
    ctx.strokeStyle = "rgba(30,60,40,0.28)"; ctx.lineWidth = Math.max(0.6, size * 0.035);
    ctx.beginPath(); ctx.moveTo(0, -size * 0.08); ctx.quadraticCurveTo(curl * 0.5, -size * 0.5, 0, -size * 0.88); ctx.stroke();
  }
}

type LeafPainter = (ctx: Pen, e: LeafEntry, col: string) => void;

const needle: LeafPainter = (ctx, e, col) => {
  const { size, l } = e;
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, size * 0.07); ctx.lineCap = "round";
  ctx.beginPath();
  for (let n = -2; n <= 2; n++) { const an = n * 0.22 + l.curl! * 0.3; ctx.moveTo(0, 0); ctx.lineTo(Math.sin(an) * size, -Math.cos(an) * size); }
  ctx.stroke();
};

const fine: LeafPainter = (ctx, e, col) => {
  const { size, l } = e;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0, -size * 0.5, size * 0.3, size * 0.5, l.curl!, 0, 2 * Math.PI); ctx.fill(); edge(ctx, size);
};

const maple: LeafPainter = (ctx, e, col) => {
  const { size, l } = e, w = size * l.wide!, cu = (l.curl || 0) * size;
  ctx.fillStyle = col;
  ctx.beginPath();
  for (const [an, f] of [[-0.75, 0.68], [0, 1], [0.75, 0.68]] as const) {
    const tx = Math.sin(an) * size * f, ty = -Math.cos(an) * size * f;
    ctx.moveTo(0, -size * 0.12);
    ctx.quadraticCurveTo(tx * 0.5 - w * Math.cos(an) * 1.3 + cu * 0.3, ty * 0.5 - w * Math.sin(an) * 1.3, tx, ty);
    ctx.quadraticCurveTo(tx * 0.5 + w * Math.cos(an) * 1.3 + cu * 0.3, ty * 0.5 + w * Math.sin(an) * 1.3, 0, -size * 0.12);
  }
  ctx.moveTo(0, 0); ctx.lineTo(0, -size * 0.15);
  ctx.fill(); edge(ctx, size);
};

const blade: LeafPainter = (ctx, e, col) => {
  const { size, l } = e, w = size * (l.round ? 0.42 : l.wide!), cu = (l.curl || 0) * size;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-w * 1.6 + cu, -size * 0.5, 0, -size);
  ctx.quadraticCurveTo(w * 1.6 + cu, -size * 0.5, 0, 0);
  ctx.fill(); edge(ctx, size);
  if (size > 9 && !l.round) centreVein(ctx, size, cu);
};

export const leafPainters: Record<LeafShape, LeafPainter> = { blade, needle, fine, maple };
