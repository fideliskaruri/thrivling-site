import { clamp, mix } from "../util";
import type { Pen } from "../pen";
import type { Layout } from "../grow";
import type { Axis, Skeleton } from "../generator";
import type { Species } from "../species";
import type { Palette } from "../palette";
import { BARK } from "./barkkit";

const barkAt = (S: Species, pal: Palette, a: Axis, s: number) => !pal.BARK2 ? pal.BARK
  : pal.BARK.map((v, j) => v + (pal.BARK2![j]! - v) * (a.depth ? 1 : clamp((s / S.TH - 0.3) / 0.3))) as [number, number, number];

export function wood(ctx: Pen, skel: Skeleton, S: Species, pal: Palette, lay: Layout) {
  const { axes } = skel, { d, z, X, Y, geo, widthAt } = lay;
  const woodCol = (a: Axis, s: number) => mix(pal.STEM, barkAt(S, pal, a, s), clamp((d - a.when(s) - 5) / 18));
  for (const a of axes) {
    const ag = geo.get(a)!;
    if (!ag.P || ag.alpha <= 0) continue;
    ctx.globalAlpha = ag.alpha;
    for (let i = 1; i < ag.P.length; i++) {
      const s = (i - 0.5) * 6;
      ctx.strokeStyle = woodCol(a, s);
      ctx.lineWidth = widthAt(a, s) * z;
      ctx.lineCap = !a.parent && (i - 1) * 6 < widthAt(a, s) * 0.6 ? "butt" : "round";
      ctx.beginPath(); ctx.moveTo(X(ag.P[i - 1]![0]), Y(ag.P[i - 1]![1])); ctx.lineTo(X(ag.P[i]![0]), Y(ag.P[i]![1])); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

export function trunkDetail(ctx: Pen, skel: Skeleton, S: Species, pal: Palette, lay: Layout, flare = true) {
  const { trunk, fissures } = skel;
  const { d, z, X, Y, geo, trunkW } = lay;
  const woodCol = (a: Axis, s: number) => mix(pal.STEM, barkAt(S, pal, a, s), clamp((d - a.when(s) - 5) / 18));
  const tw = trunkW * z, P = geo.get(trunk)!.P;
  if (P && tw > 5) {
    const age = clamp((tw - 5) / 25);
    ctx.fillStyle = woodCol(trunk, 0);
    const fw = tw * (0.5 + 0.55 * age) * Math.min(1, 28 / S.trunkW + 0.3), fh = tw * (0.9 + 0.8 * age) * Math.min(1, 28 / S.trunkW + 0.2);
    const bx = X(P[0]![0]), bw0 = lay.widthAt(trunk, 0) * z;
    if (flare) {
      ctx.beginPath(); ctx.moveTo(bx - bw0 / 2, lay.GY - fh);
      ctx.quadraticCurveTo(bx - bw0 / 2, lay.GY - fh * 0.2, bx - bw0 / 2 - fw, lay.GY);
      ctx.lineTo(bx + bw0 / 2 + fw, lay.GY);
      ctx.quadraticCurveTo(bx + bw0 / 2, lay.GY - fh * 0.2, bx + bw0 / 2, lay.GY - fh); ctx.closePath(); ctx.fill();
    }
    const pt = (i: number, u: number) => {
      const [wx, wy, th] = P[i]!, hw = lay.widthAt(trunk, i * 6) * z * u * 0.5;
      return [X(wx) + Math.cos(th) * hw, Y(wy) + Math.sin(th) * hw] as [number, number];
    };
    const run = (u: number, from: number, to: number, style: string, lw: number) => {
      ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.beginPath();
      for (let i = from; i <= to && i < P.length; i++) { const [x, y] = pt(i, u); if (i === from) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
    };
    const top = P.length * S.markTop | 0;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.18 * age; run(0.62, 0, top, "#3E2C22", tw * 0.3);
    const texture = S.barkKit?.texture ?? (S.marks === "h" ? "dashes" : "grooves");
    BARK[texture]({ ctx, run, pt, top, tw, S, fissures, age });
    ctx.globalAlpha = 1;
  }
}
