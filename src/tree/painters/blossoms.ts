import { clamp, mix, WILT } from "../util";
import type { Pen } from "../pen";
import type { Layout, LeafEntry } from "../grow";
import type { Species } from "../species";
import type { Palette } from "../palette";

type BlossomPainter = (ctx: Pen, e: LeafEntry, pr: number, pal: Palette, lay: Layout) => void;
const tone = (pal: Palette, lit: number) => pal.B![lit < 0.45 ? 0 : lit < 0.75 ? 1 : 2]!;

const petal: BlossomPainter = (ctx, e, pr, pal, lay) => {
  const { l, mx, my, lit } = e, { k } = lay;
  ctx.fillStyle = mix(tone(pal, lit), WILT[2]!, k);
  ctx.beginPath();
  for (let p = 0; p < 5; p++) {
    const an = p * 1.2566 + l.curl! * 4, px = mx + Math.cos(an) * pr * 0.9, py = my + Math.sin(an) * pr * 0.9;
    ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, 2 * Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = mix(pal.C!, WILT[0]!, k);
  ctx.beginPath(); ctx.arc(mx, my, pr * 0.45, 0, 2 * Math.PI); ctx.fill();
};

/**
 * A spray of trumpet flowers, like a jacaranda panicle: each bell is a shaded tube that flares into a paler lip
 * around a dark throat, tilted a little differently, so a crown of them reads as flowers rather than flat blobs.
 */
const bell: BlossomPainter = (ctx, e, pr, pal, lay) => {
  const { l, mx, my, lit } = e, { k } = lay;
  const curl = l.curl!;
  const body = mix(tone(pal, lit), WILT[2]!, k);
  const shade = mix(pal.B![0]!, WILT[2]!, k);
  const lip = mix(pal.B![Math.min(2, lit < 0.45 ? 1 : 2)]!, WILT[2]!, k);
  const throat = mix(pal.C!, WILT[0]!, k);
  for (let p = 0; p < 4; p++) {
    const x = mx + (p - 1.5) * pr * 0.75 + curl * pr, y = my + (p % 2) * pr * 0.6;
    const tilt = (p - 1.5) * 0.28 + curl * 0.5;
    const ca = Math.cos(tilt), sa = Math.sin(tilt);
    // Tube, pointing up towards the stem, with its shaded side away from the light.
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.ellipse(x + sa * pr * 0.2 + pr * 0.08, y - ca * pr * 0.2, pr * 0.42, pr * 0.78, tilt, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(x + sa * pr * 0.2, y - ca * pr * 0.2, pr * 0.36, pr * 0.74, tilt, 0, 2 * Math.PI); ctx.fill();
    // Flared lip at the open end, then the throat.
    const lx = x - sa * pr * 0.45, ly = y + ca * pr * 0.45;
    ctx.fillStyle = lip;
    ctx.beginPath(); ctx.ellipse(lx, ly, pr * 0.5, pr * 0.3, tilt, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = throat;
    ctx.beginPath(); ctx.ellipse(lx, ly - ca * pr * 0.04, pr * 0.17, pr * 0.11, tilt, 0, 2 * Math.PI); ctx.fill();
  }
};

const puff: BlossomPainter = (ctx, e, pr, pal, lay) => {
  const { mx, my, lit } = e;
  ctx.fillStyle = mix(tone(pal, lit), WILT[2]!, lay.k);
  ctx.beginPath(); ctx.arc(mx, my, pr * 1.15, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = mix(pal.B![2]!, WILT[2]!, lay.k);
  ctx.beginPath(); ctx.arc(mx - pr * 0.35, my - pr * 0.35, pr * 0.5, 0, 2 * Math.PI); ctx.fill();
};

const raceme: BlossomPainter = (ctx, e, pr, pal, lay) => {
  const { l, mx, my } = e;
  for (let i = 0; i < 7; i++) {
    const r = pr * 0.62 * (1 - i * 0.09), sway = Math.sin(i * 0.7 + l.curl! * 3) * pr * 0.25;
    ctx.fillStyle = mix(tone(pal, i < 2 ? 0.3 : i < 5 ? 0.6 : 0.9), WILT[2]!, lay.k);
    ctx.beginPath(); ctx.arc(mx + sway, my + i * pr * 0.75, r, 0, 2 * Math.PI); ctx.fill();
  }
};

const cup: BlossomPainter = (ctx, e, pr, pal, lay) => {
  const { l, mx, my, lit } = e, tilt = l.curl! * 0.6;
  ctx.fillStyle = mix(pal.C!, WILT[0]!, lay.k);
  ctx.beginPath(); ctx.ellipse(mx, my + pr * 0.2, pr * 0.9, pr * 1.05, tilt, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = mix(tone(pal, lit), WILT[2]!, lay.k);
  ctx.beginPath();
  for (const dx of [-0.45, 0.45]) { const px = mx + dx * pr; ctx.moveTo(px + pr * 0.5, my); ctx.ellipse(px, my, pr * 0.5, pr, tilt + dx * 0.5, 0, 2 * Math.PI); }
  ctx.fill();
  ctx.fillStyle = mix(pal.B![2]!, WILT[2]!, lay.k);
  ctx.beginPath(); ctx.ellipse(mx, my - pr * 0.1, pr * 0.42, pr * 1.05, tilt, 0, 2 * Math.PI); ctx.fill();
};

const bract: BlossomPainter = (ctx, e, pr, pal, lay) => {
  const { l, mx, my, lit } = e, r = pr * 1.1;
  ctx.fillStyle = mix(tone(pal, lit), WILT[2]!, lay.k);
  ctx.beginPath();
  for (let p = 0; p < 4; p++) {
    const a = p * Math.PI / 2 + l.curl! * 2, ca = Math.cos(a), sa = Math.sin(a), at = (u: number, v: number): [number, number] => [mx + u * ca - v * sa, my + u * sa + v * ca];
    const [x0, y0] = at(0, 0), [x1, y1] = at(r * 0.75, -r * 0.55), [x2, y2] = at(r, -r * 0.08), [x3, y3] = at(r * 0.82, 0), [x4, y4] = at(r, r * 0.08), [x5, y5] = at(r * 0.75, r * 0.55);
    ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.quadraticCurveTo(x5, y5, x0, y0);
  }
  ctx.fill();
  ctx.fillStyle = mix(pal.C!, WILT[0]!, lay.k);
  ctx.beginPath(); ctx.arc(mx, my, pr * 0.3, 0, 2 * Math.PI); ctx.fill();
};

const blossomPainters = { petal, bell, puff, raceme, cup, bract };

export function paintBlossoms(ctx: Pen, S: Species, pal: Palette, lay: Layout) {
  if (!S.blossom) return;
  for (const e of lay.flowers) {
    const pr = e.size * 0.2 * (S.blossom.scale || 1) * clamp((lay.day - e.l.flower!) / 2);
    if (pr < 0.5) continue;
    ctx.globalAlpha = 1 - 0.6 * lay.k;
    blossomPainters[S.blossom.style ?? "petal"](ctx, e, pr, pal, lay);
  }
  ctx.globalAlpha = 1;
}
