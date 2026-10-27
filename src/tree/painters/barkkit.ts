import type { Pen } from "../pen";
import type { Species } from "../species";
import type { Skeleton } from "../generator";

type Point = (i: number, u: number) => [number, number];
type Run = (u: number, from: number, to: number, style: string, width: number) => void;
interface BarkInput {
  ctx: Pen; run: Run; pt: Point; top: number; tw: number; S: Species;
  fissures: Skeleton["fissures"]; age: number;
}
function grooves({ ctx, run, top, tw, S, fissures, age }: BarkInput) {
  ctx.globalAlpha = 0.5 * age;
  for (const fz of fissures) for (let i = 0; i < top; i += 9) {
    const len = 3 + ((i * 7 + fz.on * 13) % 5);
    if (((i / 9 + fz.on * 4) | 0) % 2) run(fz.u, i, i + len, S.barkMark, Math.max(1, tw * 0.035 * Math.min(1, 28 / S.trunkW + 0.4)));
  }
}
function dashes({ ctx, pt, top, tw, S, age }: BarkInput) {
  ctx.globalAlpha = 0.75 * age; ctx.strokeStyle = S.barkMark; ctx.lineWidth = Math.max(1, tw * 0.035); ctx.beginPath();
  for (let i = 2; i < top; i += 3) {
    const h = (i * 37 % 11) / 11;
    if (h > 0.5) continue;
    const u0 = -0.9 + h * 2.4, [x0, y0] = pt(i, u0), [x1, y1] = pt(i, Math.min(0.95, u0 + 0.25 + h * 0.4));
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  }
  ctx.stroke();
}
function lenticels({ ctx, pt, top, tw, age }: BarkInput) {
  ctx.globalAlpha = 0.55 * age; ctx.strokeStyle = "#D9B49E"; ctx.lineWidth = Math.max(0.8, tw * 0.03); ctx.beginPath();
  for (let i = 2; i < top; i += 2) { const h = (i * 53 % 13) / 13, [x0, y0] = pt(i, -0.75 + h * 0.3), [x1, y1] = pt(i, 0.35 + h * 0.4); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
  ctx.stroke();
  ctx.globalAlpha = 0.16 * age; ctx.strokeStyle = "#fff"; ctx.lineWidth = tw * 0.12; ctx.beginPath();
  for (let i = 0; i < top; i++) { const [x, y] = pt(i, -0.45); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
}
function plates({ ctx, run, top, tw, S, age }: BarkInput) {
  ctx.globalAlpha = 0.55 * age; const lw = Math.max(1, tw * 0.04);
  for (let i = 0, row = 0; i < top; i += 4, row++) for (let u = -0.7 + (row % 2) * 0.28; u < 0.8; u += 0.56) run(u, i, i + 3, S.barkMark, lw);
}
function folds({ ctx, run, top, tw, S, age }: BarkInput) {
  ctx.globalAlpha = 0.28 * age;
  for (const u of [-0.62, -0.2, 0.25, 0.66]) run(u, 0, top, S.barkMark, Math.max(1.2, tw * 0.05));
  ctx.globalAlpha = 0.12 * age;
  for (const u of [-0.42, 0.04, 0.46]) run(u, 0, top, "#ffffff", Math.max(1, tw * 0.04));
}
function rings({ ctx, pt, top, tw, S, age }: BarkInput) {
  ctx.globalAlpha = 0.45 * age; ctx.strokeStyle = S.barkMark; ctx.lineWidth = Math.max(0.8, tw * 0.05); ctx.beginPath();
  for (let i = 2; i < top; i += 4) { const [x0, y0] = pt(i, -0.95), [x1, y1] = pt(i, 0.95), [mx, my] = pt(i, 0); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my + tw * 0.12, x1, y1); }
  ctx.stroke();
}
export const BARK: Record<NonNullable<Species["barkKit"]>["texture"], (input: BarkInput) => void> = { grooves, dashes, lenticels, plates, folds, rings };
