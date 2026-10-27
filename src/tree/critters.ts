import type { Pen } from "./pen";

export const WINGS = [
  ["#F2B544", "#D98E2B"],
  ["#9DC1EC", "#6890C8"],
  ["#F4EFA8", "#E2D56E"],
  ["#FFFFFF", "#E2DEEA"],
  ["#F3B6C8", "#D9829E"],
] as const;

function oval(ctx: Pen, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 2 * Math.PI);
  ctx.fill();
}

export function butterfly(ctx: Pen, x: number, y: number, s: number, f: number, cols: readonly [string, string], tilt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  for (const sd of [-1, 1]) {
    ctx.fillStyle = cols[0]; oval(ctx, sd * s * 0.55 * f, -s * 0.3, s * 0.6 * f, s * 0.55, sd * 0.5);
    ctx.fillStyle = cols[1]; oval(ctx, sd * s * 0.4 * f, s * 0.3, s * 0.42 * f, s * 0.38, -sd * 0.4);
  }
  ctx.fillStyle = "#3A3330"; oval(ctx, 0, 0, s * 0.1, s * 0.5);
  ctx.restore();
}

export function bee(ctx: Pen, x: number, y: number, s: number, t: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const h = s * (0.35 + 0.25 * Math.abs(Math.sin(t * 0.09)));
  ctx.globalAlpha *= 0.7; ctx.fillStyle = "#FFFFFF";
  oval(ctx, -s * 0.1, -s * 0.45, s * 0.28, h, -0.4); oval(ctx, s * 0.15, -s * 0.42, s * 0.22, h * 0.85, 0.3);
  ctx.globalAlpha /= 0.7;
  ctx.fillStyle = "#F2C230"; oval(ctx, 0, 0, s * 0.55, s * 0.38);
  ctx.fillStyle = "#3A3330";
  oval(ctx, -s * 0.12, 0, s * 0.08, s * 0.36); oval(ctx, s * 0.14, 0, s * 0.07, s * 0.33);
  oval(ctx, s * 0.55, -s * 0.02, s * 0.2, s * 0.2);
  ctx.restore();
}

export function ladybird(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = "#2E2724"; oval(ctx, s * 0.5, -s * 0.18, s * 0.22, s * 0.2);
  ctx.fillStyle = "#D8432F"; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.48, 0, Math.PI, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "#2E2724";
  oval(ctx, -s * 0.22, -s * 0.2, s * 0.09, s * 0.09); oval(ctx, s * 0.18, -s * 0.28, s * 0.08, s * 0.08); oval(ctx, 0, -s * 0.12, s * 0.07, s * 0.07);
  ctx.restore();
}

export function firefly(ctx: Pen, x: number, y: number, s: number, glow: number) {
  const a = ctx.globalAlpha;
  ctx.fillStyle = "#F4F7A8";
  for (const [r, k] of [[2.6, 0.08], [1.5, 0.18], [0.7, 0.55]] as const) {
    ctx.globalAlpha = a * k * glow; oval(ctx, x, y, s * r, s * r);
  }
  ctx.globalAlpha = a * (0.35 + 0.65 * glow); ctx.fillStyle = "#FFFFE6"; oval(ctx, x, y, s * 0.3, s * 0.3);
  ctx.globalAlpha = a;
}

export function dragonfly(ctx: Pen, x: number, y: number, s: number, ang: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const fl = 0.75 + 0.25 * Math.sin(t * 0.11);
  ctx.globalAlpha *= 0.55; ctx.fillStyle = "#E8F4F6";
  for (const sd of [-1, 1]) {
    oval(ctx, s * 0.25, sd * s * 0.55 * fl, s * 0.16, s * 0.55 * fl, sd * 0.25);
    oval(ctx, -s * 0.05, sd * s * 0.5 * fl, s * 0.14, s * 0.5 * fl, -sd * 0.2);
  }
  ctx.globalAlpha /= 0.55;
  ctx.fillStyle = "#2F8C8E"; oval(ctx, -s * 0.45, 0, s * 0.75, s * 0.07); oval(ctx, s * 0.22, 0, s * 0.2, s * 0.11);
  ctx.fillStyle = "#1E5E66"; oval(ctx, s * 0.46, 0, s * 0.12, s * 0.13);
  ctx.restore();
}

export function beetle(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = "#292D27"; oval(ctx, s * 0.5, -s * 0.15, s * 0.19, s * 0.17);
  ctx.fillStyle = "#41493A"; oval(ctx, 0, 0, s * 0.58, s * 0.42);
  ctx.strokeStyle = "#737B61"; ctx.lineWidth = Math.max(0.7, s * 0.06);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.37); ctx.lineTo(0, s * 0.38); ctx.stroke();
  ctx.restore();
}

export function bird(ctx: Pen, x: number, y: number, s: number, color: string, pose: "flying" | "perched" | "puffed", dir = 1, flap = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = color;
  if (pose === "flying") {
    ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.05); ctx.quadraticCurveTo(-s * 0.2, -s * (0.65 + flap * 0.18), 0, -s * 0.12);
    ctx.quadraticCurveTo(s * 0.18, -s * (0.55 + flap * 0.18), s * 0.52, s * 0.02);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.2, -s * 0.55, s * 0.05); ctx.fill();
  } else {
    oval(ctx, 0, 0, s * (pose === "puffed" ? 0.52 : 0.43), s * (pose === "puffed" ? 0.42 : 0.34));
    ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.1); ctx.lineTo(-s * 0.7, s * 0.36); ctx.lineTo(-s * 0.2, s * 0.26); ctx.fill();
    ctx.fillStyle = "#D99D49"; ctx.beginPath(); ctx.moveTo(s * 0.34, -s * 0.08); ctx.lineTo(s * 0.72, 0); ctx.lineTo(s * 0.34, s * 0.08); ctx.fill();
    ctx.fillStyle = "#292A24"; oval(ctx, s * 0.2, -s * 0.12, s * 0.045, s * 0.045);
    ctx.strokeStyle = "#6F5941"; ctx.lineWidth = Math.max(0.7, s * 0.05);
    ctx.beginPath(); ctx.moveTo(-s * 0.08, s * 0.29); ctx.lineTo(-s * 0.08, s * 0.48); ctx.moveTo(s * 0.12, s * 0.28); ctx.lineTo(s * 0.12, s * 0.46); ctx.stroke();
  }
  ctx.restore();
}

export function owl(ctx: Pen, x: number, y: number, s: number, blink = false) {
  ctx.fillStyle = "#75634D"; oval(ctx, x, y, s * 0.52, s * 0.62);
  ctx.beginPath(); ctx.moveTo(x - s * 0.42, y - s * 0.28); ctx.lineTo(x - s * 0.42, y - s * 0.78); ctx.lineTo(x - s * 0.05, y - s * 0.45);
  ctx.moveTo(x + s * 0.42, y - s * 0.28); ctx.lineTo(x + s * 0.42, y - s * 0.78); ctx.lineTo(x + s * 0.05, y - s * 0.45); ctx.fill();
  ctx.fillStyle = "#E8D7B4";
  for (const dx of [-0.2, 0.2]) { oval(ctx, x + s * dx, y - s * 0.12, s * 0.15, s * 0.16); ctx.fillStyle = blink ? "#4A4035" : "#D9A84D"; oval(ctx, x + s * dx, y - s * 0.12, s * 0.055, s * (blink ? 0.02 : 0.07)); ctx.fillStyle = "#E8D7B4"; }
  ctx.fillStyle = "#DDA64E"; ctx.beginPath(); ctx.moveTo(x, y + s * 0.02); ctx.lineTo(x - s * 0.07, y + s * 0.15); ctx.lineTo(x + s * 0.07, y + s * 0.15); ctx.fill();
}

export function gull(ctx: Pen, x: number, y: number, s: number, flap: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.strokeStyle = "#F6F4EC"; ctx.lineWidth = Math.max(1, s * 0.14); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-s, s * 0.18); ctx.quadraticCurveTo(-s * 0.38, -s * (0.18 + flap * 0.35), 0, 0);
  ctx.quadraticCurveTo(s * 0.44, -s * (0.18 + flap * 0.35), s, s * 0.18); ctx.stroke(); ctx.restore();
}

export function frog(ctx: Pen, x: number, y: number, s: number, hop = 0) {
  ctx.fillStyle = "#628B50"; oval(ctx, x, y - hop, s * 0.48, s * 0.3);
  for (const dx of [-0.25, 0.25]) { oval(ctx, x + s * dx, y - hop - s * 0.22, s * 0.12, s * 0.12); ctx.fillStyle = "#F1E7C0"; oval(ctx, x + s * dx, y - hop - s * 0.22, s * 0.055, s * 0.055); ctx.fillStyle = "#628B50"; }
  ctx.beginPath(); ctx.moveTo(x - s * 0.2, y - hop + s * 0.2); ctx.lineTo(x - s * 0.45, y - hop + s * 0.33); ctx.moveTo(x + s * 0.2, y - hop + s * 0.2); ctx.lineTo(x + s * 0.45, y - hop + s * 0.33); ctx.strokeStyle = "#628B50"; ctx.lineWidth = Math.max(1, s * 0.12); ctx.stroke();
}

export function squirrel(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = "#A66A3F"; oval(ctx, -s * 0.35, -s * 0.28, s * 0.24, s * 0.38, -0.7);
  oval(ctx, 0, -s * 0.05, s * 0.37, s * 0.24); oval(ctx, s * 0.27, -s * 0.35, s * 0.2, s * 0.19);
  ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.48); ctx.lineTo(s * 0.14, -s * 0.7); ctx.lineTo(s * 0.34, -s * 0.55); ctx.fill();
  ctx.fillStyle = "#2B2924"; oval(ctx, s * 0.34, -s * 0.39, s * 0.035, s * 0.035);
  ctx.restore();
}

export function crab(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = "#D87548"; oval(ctx, 0, 0, s * 0.43, s * 0.25);
  ctx.strokeStyle = "#D87548"; ctx.lineWidth = Math.max(1, s * 0.07);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const yy = (i - 1) * s * 0.15, xx = side * s * 0.28;
    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(side * s * 0.55, yy + s * 0.12); ctx.stroke();
  }
  for (const side of [-1, 1]) { oval(ctx, side * s * 0.21, -s * 0.3, s * 0.11, s * 0.12); ctx.fillStyle = "#F2E8D4"; oval(ctx, side * s * 0.21, -s * 0.31, s * 0.04, s * 0.05); ctx.fillStyle = "#D87548"; }
  ctx.restore();
}

export function cone(ctx: Pen, x: number, y: number, s: number, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = "#8B5738";
  ctx.beginPath(); ctx.moveTo(0, -s * 0.55); ctx.quadraticCurveTo(s * 0.48, 0, 0, s * 0.55); ctx.quadraticCurveTo(-s * 0.48, 0, 0, -s * 0.55); ctx.fill();
  ctx.strokeStyle = "#C08A5C"; ctx.lineWidth = Math.max(0.7, s * 0.07);
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.22, i * s * 0.2); ctx.lineTo(s * 0.22, i * s * 0.2); ctx.stroke(); }
  ctx.restore();
}

export function drip(ctx: Pen, x: number, y: number, s: number) {
  ctx.fillStyle = "#A9D8E4"; ctx.beginPath(); ctx.moveTo(x, y - s * 0.55);
  ctx.quadraticCurveTo(x + s * 0.45, y, x, y + s * 0.42); ctx.quadraticCurveTo(x - s * 0.45, y, x, y - s * 0.55); ctx.fill();
}

export function note(ctx: Pen, x: number, y: number, s: number) {
  ctx.strokeStyle = "#544B43"; ctx.lineWidth = Math.max(0.8, s * 0.08);
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.2); ctx.lineTo(x, y - s * 0.38); ctx.lineTo(x + s * 0.28, y - s * 0.32); ctx.lineTo(x + s * 0.28, y + s * 0.08); ctx.stroke();
  oval(ctx, x - s * 0.04, y + s * 0.2, s * 0.12, s * 0.08);
}

export function star(ctx: Pen, x: number, y: number, s: number, alpha: number) {
  const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.fillStyle = "#FFF4C6"; oval(ctx, x, y, s, s); ctx.globalAlpha = a;
}

export function mist(ctx: Pen, x: number, y: number, rx: number, ry: number, alpha: number) {
  const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha; ctx.fillStyle = "#E7F0E9"; oval(ctx, x, y, rx, ry); ctx.globalAlpha = a;
}

export function shimmer(ctx: Pen, x: number, y: number, w: number, s: number, phase: number) {
  ctx.globalAlpha *= 0.24; ctx.strokeStyle = "#F8D99A"; ctx.lineWidth = Math.max(0.8, s * 0.08);
  for (let row = 0; row < 3; row++) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const px = x + w * i / 12, py = y + row * s * 0.55 + Math.sin(i * 0.9 + phase + row) * s * 0.18;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha /= 0.24;
}
