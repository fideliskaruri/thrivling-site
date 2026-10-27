import { mix, WILT } from "../util";
import type { Pen } from "../pen";
import type { Layout } from "../grow";
import type { Species } from "../species";
import type { Palette } from "../palette";

export function massLayer(ctx: Pen, S: Species, pal: Palette, lay: Layout, i: number, rk: number, ox: number, oy: number) {
  const { L, mass, thin, k, d } = lay;
  if (mass * thin <= 0) return;
  const col = pal.MASS[i]!;
  ctx.fillStyle = mix(col, WILT[0]!, k);
  ctx.beginPath();
  for (const e of L) {
    if (e.l.round || e.l.a.depth === 0 || (e.l.a.die && d > e.l.a.die - 3)) continue;
    const rr = e.size * rk * mass * thin * S.massK, x = e.mx + ox * e.size, y = e.my + oy * e.size;
    ctx.moveTo(x + rr, y); ctx.ellipse(x, y, rr, rr * S.massFlat, 0, 0, 2 * Math.PI);
  }
  ctx.fill();
}
