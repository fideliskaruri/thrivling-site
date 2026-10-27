import { wood, trunkDetail } from "./painters/wood";
import { grass } from "./painters/ground";
import { leafPainters } from "./painters/leaves";
import { mix, WILT, hex } from "./util";
import type { Pen } from "./pen";
import type { Skeleton, Axis } from "./generator";
import type { Species } from "./species";
import type { Palette } from "./palette";
import type { Layout, AxisGeo } from "./grow";
import type { TreeLeafPainter } from "./palette";

export function renderFallen(ctx: Pen, skel: Skeleton, S: Species, pal: Palette, lay: Layout, leafFn: TreeLeafPainter | null = null) {
  const { W, GY, z, geo, widthAt } = lay;
  const trunkGeo = geo.get(skel.trunk)!;
  ctx.reset?.(); ctx.clearRect(0, 0, W, W); grass(ctx, skel, S, lay);
  if (!trunkGeo.P) return;
  const stub = new Map<Axis, number>();
  for (const a of skel.axes) {
    const g = geo.get(a)!;
    if (!g.P || !a.depth) continue;
    const down = a.depth === 1 ? a.side > 0 : true;
    const keep = a.depth === 1 && !down && !a.die ? Math.min(g.L, 10 + g.L * 0.22) : 0;
    stub.set(a, keep);
  }
  const fallenGeo = new Map<Axis, AxisGeo>();
  for (const [a, g] of geo) {
    const keep = stub.has(a) ? stub.get(a)! : Infinity;
    fallenGeo.set(a, keep <= 0 ? { ...g, alpha: 0, gone: true } : keep === Infinity ? g : { ...g, P: g.P!.slice(0, Math.max(2, Math.round(keep / 6) + 1)) });
  }
  const fl = { ...lay, geo: fallenGeo };
  const zF = W / 920 * 740 / (S.TH + 30 * S.leafSize * 0.5 + 12);
  const q = Math.sqrt(zF / z), len = trunkGeo.L * z * q, r0 = widthAt(skel.trunk, 0) * z * q / 2;
  const scale = Math.max(0.45 * W / Math.max(1, len + r0), Math.min(1, 0.86 * W / Math.max(1, len + r0)));
  const bx = W / 2 - (len - r0) * scale / 2, by = GY - r0 * scale;
  ctx.fillStyle = "rgba(60,72,50,0.16)"; ctx.beginPath(); ctx.ellipse(W / 2, GY + 1, Math.max(4, (len + r0) * scale * 0.55), Math.max(1.5, r0 * scale * 0.5 + 2), 0, 0, 2 * Math.PI); ctx.fill();
  ctx.save(); ctx.translate(bx, by); ctx.scale(q * scale, q * scale); ctx.rotate(Math.PI / 2); ctx.translate(-lay.X(0), -GY);
  wood(ctx, skel, S, pal, fl); trunkDetail(ctx, skel, S, pal, fl, false);
  const lf = leafFn ?? leafPainters[S.shape] ?? leafPainters.blade;
  for (const e of lay.L) {
    const a = e.l.a, g = fallenGeo.get(a)!;
    if (g.gone || e.l.round || e.l.shade > 0.45 || e.l.s > (stub.get(a) ?? Infinity)) continue;
    ctx.save(); ctx.translate(e.sx, e.sy); ctx.rotate(e.dir); lf(ctx, e, mix(WILT[e.lit < 0.5 ? 0 : 1]!, WILT[2]!, e.l.shade)); ctx.restore();
  }
  ctx.restore();
  const endRadius = r0 * scale;
  if (endRadius > 2.5) {
    ctx.fillStyle = mix(pal.BARK, hex("#F1DDBE"), 0.6); ctx.beginPath(); ctx.ellipse(bx, by, endRadius * 0.42, endRadius, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = mix(pal.BARK, hex("#F1DDBE"), 0.15); ctx.lineWidth = Math.max(0.6, endRadius * 0.08);
    for (const k of endRadius > 7 ? [0.62, 0.3] : [0.45]) { ctx.beginPath(); ctx.ellipse(bx, by, endRadius * 0.42 * k, endRadius * k, 0, 0, 2 * Math.PI); ctx.stroke(); }
  }
  const P = trunkGeo.P, top = Math.floor(P.length * 0.75);
  if (r0 * scale > 3.5 && lay.d > 45) {
    ctx.fillStyle = "#6E9E5A";
    for (let i = 1; i < top; i += 2) {
      const u = i * 6, hw = widthAt(skel.trunk, u) * z * q * scale / 2;
      const x = bx + P[i]![1] * z * q * scale, y = by - hw;
      const k = 0.5 + 0.5 * Math.sin(i * 1.7 + skel.trunk.wob[i % 120]! * 2);
      ctx.beginPath(); ctx.ellipse(x, y + hw * 0.12, hw * (0.5 + 0.4 * k), hw * (0.22 + 0.12 * k), 0, Math.PI, 2 * Math.PI); ctx.fill();
    }
  }
  const sx = bx - r0 * scale - Math.max(6, W * 0.035), sh = W * 0.06;
  ctx.strokeStyle = "#5E8C46"; ctx.lineWidth = Math.max(1, W * 0.006); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(sx, GY); ctx.quadraticCurveTo(sx - sh * 0.1, GY - sh * 0.6, sx + sh * 0.15, GY - sh); ctx.stroke();
  ctx.fillStyle = "#8CC86B";
  for (const d of [-1, 1]) { ctx.save(); ctx.translate(sx + sh * 0.1, GY - sh * 0.85); ctx.rotate(d * 1.1); ctx.beginPath(); ctx.ellipse(0, -sh * 0.22, sh * 0.13, sh * 0.24, 0, 0, 2 * Math.PI); ctx.fill(); ctx.restore(); }
}
