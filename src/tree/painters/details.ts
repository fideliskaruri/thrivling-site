import { clamp, hex, mix } from "../util";
import type { Pen } from "../pen";
import type { Layout } from "../grow";
import { LIFETIME } from "../generator";
import type { Species, DetailAtom } from "../species";
type DetailPainter = (ctx: Pen, size: number, ripe: number, options?: { waist?: boolean }) => void;
const lerpCol = (a: string, b: string, t: number) => mix(hex(a), hex(b), clamp(t));
const stalk = (ctx: Pen, x: number, y: number, width: number, col = "rgba(80,70,50,0.8)") => {
  ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x, y); ctx.stroke();
};
function acorn(ctx: Pen, size: number, ripe: number) {
  stalk(ctx, 0, size * 0.35, Math.max(0.6, size * 0.06));
  for (const dx of [-0.28, 0.28]) {
    const x = dx * size, y = size * 0.55; ctx.fillStyle = lerpCol("#9DB35A", "#8B5A2B", ripe * 1.4 - 0.3);
    ctx.beginPath(); ctx.ellipse(x, y + size * 0.22, size * 0.2, size * 0.3, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = "#7A6A4F"; ctx.beginPath(); ctx.ellipse(x, y, size * 0.24, size * 0.14, 0, Math.PI, 2 * Math.PI); ctx.lineTo(x + size * 0.22, y + size * 0.04); ctx.lineTo(x - size * 0.22, y + size * 0.04); ctx.fill();
  }
}
function cone(ctx: Pen, size: number, ripe: number) {
  if (ripe < 0.45) { ctx.fillStyle = "#B5434F"; ctx.beginPath(); ctx.ellipse(0, -size * 0.25, size * 0.14, size * 0.24, 0, 0, 2 * Math.PI); ctx.fill(); return; }
  stalk(ctx, 0, size * 0.15, Math.max(0.6, size * 0.05)); const h = size * 0.85, w = size * 0.3;
  ctx.fillStyle = "#8A6A45"; ctx.beginPath(); ctx.ellipse(0, size * 0.15 + h / 2, w, h / 2, 0, 0, 2 * Math.PI); ctx.fill();
  if (size > 6) { ctx.strokeStyle = "rgba(60,40,25,0.5)"; ctx.lineWidth = Math.max(0.5, size * 0.03); ctx.beginPath(); for (let k = 1; k < 5; k++) { const y = size * 0.15 + h * k / 5, hw = w * Math.sin(Math.PI * k / 5); ctx.moveTo(-hw, y - size * 0.05); ctx.lineTo(0, y + size * 0.03); ctx.lineTo(hw, y - size * 0.05); } ctx.stroke(); }
}
function catkin(ctx: Pen, size: number) {
  ctx.fillStyle = "#A68A4E"; ctx.beginPath();
  for (let k = 0; k < 8; k++) { const y = size * (0.1 + k * 0.11), x = Math.sin(k * 0.5) * size * 0.06; ctx.moveTo(x + size * 0.09, y); ctx.arc(x, y, size * 0.09 * (1 - k * 0.05), 0, 2 * Math.PI); }
  ctx.fill();
}
function samara(ctx: Pen, size: number, ripe: number) {
  ctx.fillStyle = lerpCol("#C8473F", "#9C6B3E", ripe * 1.3 - 0.5);
  for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, size * 0.1); ctx.quadraticCurveTo(sg * size * 0.55, size * 0.15, sg * size * 0.45, size * 0.65); ctx.quadraticCurveTo(sg * size * 0.2, size * 0.45, 0, size * 0.18); ctx.fill(); ctx.beginPath(); ctx.arc(sg * size * 0.06, size * 0.14, size * 0.08, 0, 2 * Math.PI); ctx.fill(); }
}
function podStrap(ctx: Pen, size: number, ripe: number, options?: { waist?: boolean }) {
  ctx.strokeStyle = lerpCol("#7FA046", "#4A2F1E", ripe * 1.5 - 0.2); ctx.lineCap = "round"; ctx.lineWidth = size * 0.12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(size * 0.18, size * 0.5, size * 0.05, size); ctx.stroke();
  if (options?.waist && size > 8) { ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); for (let k = 1; k < 6; k++) { const u = k / 6, x = size * 0.18 * 2 * u * (1 - u) + size * 0.05 * u * u, y = size * u; ctx.moveTo(x + size * 0.09, y); ctx.arc(x, y, size * 0.09, 0, 2 * Math.PI); } ctx.fill(); }
}
function podRound(ctx: Pen, size: number) {
  stalk(ctx, 0, size * 0.3, Math.max(0.6, size * 0.05)); ctx.fillStyle = "#7A5C3E"; ctx.beginPath(); ctx.ellipse(0, size * 0.62, size * 0.34, size * 0.32, 0.3, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = "rgba(255,240,220,0.3)"; ctx.lineWidth = Math.max(0.5, size * 0.04); ctx.beginPath(); ctx.moveTo(-size * 0.2, size * 0.45); ctx.lineTo(size * 0.2, size * 0.8); ctx.stroke();
}
function coil(ctx: Pen, size: number) {
  ctx.strokeStyle = "#B88A4A"; ctx.lineWidth = Math.max(0.8, size * 0.1); ctx.lineCap = "round"; ctx.beginPath();
  for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 4, r = size * 0.28 * (1 - k / 70); ctx.lineTo(Math.cos(a) * r, size * 0.4 + Math.sin(a) * r + k * size * 0.008); }
  ctx.stroke();
}
function fruit(ctx: Pen, size: number) {
  stalk(ctx, size * 0.05, size * 0.55, Math.max(0.6, size * 0.04)); ctx.fillStyle = "#9C9A6A"; ctx.beginPath(); ctx.ellipse(size * 0.05, size * 0.85, size * 0.2, size * 0.3, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "rgba(255,255,230,0.25)"; ctx.beginPath(); ctx.ellipse(-size * 0.02, size * 0.78, size * 0.07, size * 0.14, 0, 0, 2 * Math.PI); ctx.fill();
}
function thorn(ctx: Pen, size: number) {
  ctx.lineCap = "round"; ctx.strokeStyle = "#E8E0D0"; ctx.lineWidth = Math.max(0.6, size * 0.06); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size * 0.5, -size * 0.15); ctx.stroke();
  ctx.strokeStyle = "#3A2E28"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(size * 0.15, size * 0.05, size * 0.2, -size * 0.12); ctx.stroke();
}
const orb = (ctx: Pen, x: number, y: number, rx: number, ry: number, col: string) => {
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "rgba(255,255,240,0.35)"; ctx.beginPath(); ctx.ellipse(x - rx * 0.35, y - ry * 0.35, rx * 0.28, ry * 0.22, 0, 0, 2 * Math.PI); ctx.fill();
};
function apple(ctx: Pen, size: number, ripe: number) {
  stalk(ctx, 0, size * 0.35, Math.max(0.6, size * 0.05)); orb(ctx, 0, size * 0.62, size * 0.32, size * 0.29, lerpCol("#9BBF4A", "#C8352E", ripe * 1.6 - 0.2));
}
function lemon(ctx: Pen, size: number, ripe: number) {
  stalk(ctx, 0, size * 0.3, Math.max(0.6, size * 0.05)); orb(ctx, 0, size * 0.62, size * 0.25, size * 0.34, lerpCol("#8DB04A", "#F2D23C", ripe * 1.8 - 0.2));
}
function olive(ctx: Pen, size: number, ripe: number) {
  stalk(ctx, 0, size * 0.3, Math.max(0.5, size * 0.04));
  for (const dx of [-0.18, 0.2]) orb(ctx, dx * size, size * (0.55 + dx), size * 0.13, size * 0.18, lerpCol("#8E9A4A", "#3E2E3E", ripe * 1.4 - 0.3));
}
function coconut(ctx: Pen, size: number, ripe: number) {
  const col = lerpCol("#6E9A3A", "#8A6234", ripe * 1.3 - 0.2);
  for (const [dx, dy] of [[-0.24, 0.3], [0.24, 0.3], [0, 0.5]] as const) orb(ctx, dx * size, dy * size, size * 0.22, size * 0.24, col);
}
function berry(ctx: Pen, size: number) {
  stalk(ctx, 0, size * 0.3, Math.max(0.5, size * 0.04));
  for (const [dx, dy] of [[-0.12, 0.45], [0.12, 0.45], [0, 0.62]] as const) orb(ctx, dx * size, dy * size, size * 0.11, size * 0.11, "#C6283A");
}
export const DETAILS: Record<DetailAtom, DetailPainter> = { acorn, cone, catkin, samara, podStrap, podRound, coil, fruit, thorn, apple, lemon, olive, coconut, berry };
export function paintDetails(ctx: Pen, S: Species, lay: Layout) {
  if (!S.details) return;
  for (const det of S.details) {
    if (lay.day < det.from) continue;
    const growth = clamp((lay.day - det.from) / 4), ripe = clamp((lay.day - det.from) / Math.max(1, LIFETIME - det.from));
    for (const e of lay.L) {
      if (e.l.round || !e.l.a.depth || (e.l.shade * 977.3) % 1 >= det.share || (det.reach && e.l.s > det.reach)) continue;
      const size = e.size * det.size * 2.2 * growth;
      if (size < 1.5) continue;
      ctx.save(); ctx.translate(e.sx, e.sy); DETAILS[det.atom](ctx, size, ripe, det); ctx.restore();
    }
  }
}
