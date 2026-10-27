import { mix, rx0, SEED, WILT, hex } from "../util";
import type { Pen } from "../pen";
import type { Layout } from "../grow";
import type { Skeleton } from "../generator";
import type { Species } from "../species";

export function seed(ctx: Pen, lay: Layout) {
  const { X, Y, z, seedA } = lay;
  if (seedA > 0) {
    ctx.globalAlpha = seedA; ctx.fillStyle = mix(SEED, SEED, 0);
    ctx.beginPath(); ctx.ellipse(X(3), Y(3.5), 6.5 * z, 4.2 * z, -0.3, 0, 2 * Math.PI); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function shadow(ctx: Pen, lay: Layout) {
  const { L, GY, z, minX, maxX, cx, d, mass } = lay;
  if (L.length) {
    const sw = Math.max(rx0(d) * z * 0.9, (maxX - minX) * 0.55 * mass + 6);
    ctx.fillStyle = "rgba(60,72,50,0.13)";
    ctx.beginPath(); ctx.ellipse(cx, GY + 2, sw, sw * 0.09, 0, 0, 2 * Math.PI); ctx.fill();
  }
}

export function soil(ctx: Pen, lay: Layout, _S?: Species) {
  const { CX, GY, z, trunkW, d } = lay;
  const tw = trunkW * z;
  const rx = Math.max(rx0(d) * z, tw * 0.9);
  ctx.fillStyle = "#D6C4A6";
  ctx.beginPath(); ctx.ellipse(CX, GY + rx * 0.08, rx, rx * 0.18, 0, Math.PI, 2 * Math.PI); ctx.fill();
}

export function grass(ctx: Pen, skel: Skeleton, _S: Species | undefined, lay: Layout) {
  const { W, CX, GY, z, k } = lay;
  ctx.lineCap = "round"; ctx.lineWidth = W * 0.0035;
  for (const g of skel.grass) {
    const gx = CX + g.x * W;
    const rx = Math.max(rx0(lay.d) * z, lay.trunkW * z * 0.9);
    if (Math.abs(gx - CX) < rx * 0.8) continue;
    for (let j = 0; j < g.n; j++) {
      const lean = (j - (g.n - 1) / 2) * 0.35, h = g.h * W * (j % 2 ? 0.75 : 1);
      ctx.strokeStyle = mix(j % 2 ? hex("#8DBB7E") : hex("#A9CC94"), WILT[1]!, k * 0.6);
      ctx.beginPath(); ctx.moveTo(gx + j * 2, GY + 1);
      ctx.quadraticCurveTo(gx + j * 2 + Math.sin(lean) * h * 0.3, GY - h * 0.6, gx + j * 2 + Math.sin(lean) * h, GY - h * Math.cos(lean));
      ctx.stroke();
    }
  }
}
