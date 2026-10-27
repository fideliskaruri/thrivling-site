import type { Pen } from "./pen";

export const WINGS = [
  ["#F2B544", "#D98E2B"],
  ["#9DC1EC", "#6890C8"],
  ["#F4EFA8", "#E2D56E"],
  ["#FFFFFF", "#E2DEEA"],
  ["#F3B6C8", "#D9829E"],
] as const;

/**
 * A ladybird seen from the side, walking on the ground line at y (feet on it). `phase` advances with distance walked
 * and drives a tripod gait (front and back legs on one side swing with the middle leg on the other); `face` runs from
 * -1 to 1 and passes through 0 while it turns round, so a turn reads as the body pivoting, not a mirror flip;
 * `feel` twitches the antennae while it rests.
 */
export function ladybirdWalk(ctx: Pen, x: number, y: number, s: number, face: number, phase: number, stride: number, feel: number) {
  ctx.save();
  ctx.translate(x, y);
  // While turning it narrows a little (seen more end-on), then shows the other side.
  ctx.scale(Math.sign(face || 1) * (0.62 + 0.38 * Math.abs(face)), 1);
  const bob = -Math.abs(Math.sin(phase * Math.PI * 2)) * s * 0.012 * stride;
  // One leg: hip on the body, foot on the ground. In stance the foot slides back under the body; in swing it lifts.
  const leg = (hipX: number, footX: number, offset: number, color: string, width: number) => {
    const t = ((phase + offset) % 1 + 1) % 1;
    const swing = t > 0.5;
    const u = swing ? (t - 0.5) * 2 : t * 2;
    const reach = s * 0.08 * stride;
    const fx = footX + (swing ? -reach + 2 * reach * u : reach - 2 * reach * u);
    const fy = swing ? -Math.sin(u * Math.PI) * s * 0.045 * stride : 0;
    // Hips tuck under the dome; knees bend outward and stay below the shell rim, so only shin and foot show.
    const hx = hipX, hy = -s * 0.07 + bob;
    const kx = (hx + fx) / 2 + (fx >= hx ? s * 0.035 : -s * 0.035), ky = Math.min(hy, fy) - s * 0.012;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
  };
  const thin = Math.max(0.8, s * 0.03);
  // Far legs first (behind the body), lighter.
  leg(s * 0.18, s * 0.3, 0.5, "#6B5A55", thin * 0.9);
  leg(-s * 0.02, s * 0.0, 0, "#6B5A55", thin * 0.9);
  leg(-s * 0.2, -s * 0.3, 0.5, "#6B5A55", thin * 0.9);
  ctx.save();
  ctx.translate(0, bob);
  // Head and pronotum, low at the front.
  ctx.fillStyle = "#1E1C1F"; oval(ctx, s * 0.42, -s * 0.13, s * 0.12, s * 0.1);
  ctx.fillStyle = "#F3EBDD"; oval(ctx, s * 0.47, -s * 0.16, s * 0.035, s * 0.03);
  ctx.fillStyle = "#26242A"; oval(ctx, s * 0.3, -s * 0.2, s * 0.13, s * 0.12);
  ctx.fillStyle = "#EFE6D6"; oval(ctx, s * 0.33, -s * 0.24, s * 0.045, s * 0.035);
  // Antennae: short, clubbed, feeling the air.
  ctx.strokeStyle = "#1E1C1F"; ctx.lineWidth = Math.max(0.6, s * 0.016);
  const tw = Math.sin(feel * 9) * 0.05 + Math.sin(feel * 23) * 0.02;
  ctx.beginPath();
  ctx.moveTo(s * 0.5, -s * 0.18); ctx.quadraticCurveTo(s * 0.6, -s * (0.3 + tw), s * 0.66, -s * (0.25 + tw * 1.5));
  ctx.moveTo(s * 0.47, -s * 0.2); ctx.quadraticCurveTo(s * 0.55, -s * (0.34 - tw), s * 0.6, -s * (0.31 - tw * 1.5));
  ctx.stroke();
  // The domed shell (elytra): flat underside, glossy red, black spots following the curve.
  const shell = ctx.createRadialGradient(-s * 0.08, -s * 0.42, s * 0.02, 0, -s * 0.2, s * 0.6);
  shell.addColorStop(0, "#FF8A6E"); shell.addColorStop(0.5, "#E5443A"); shell.addColorStop(1, "#9A2628");
  ctx.fillStyle = shell;
  ctx.beginPath(); ctx.ellipse(-s * 0.03, -s * 0.1, s * 0.4, s * 0.36, 0, Math.PI, 2 * Math.PI); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#3A1716"; ctx.fillRect(-s * 0.43, -s * 0.11, s * 0.8, s * 0.035);
  ctx.fillStyle = "#231F22";
  oval(ctx, -s * 0.2, -s * 0.24, s * 0.07, s * 0.06);
  oval(ctx, s * 0.08, -s * 0.33, s * 0.07, s * 0.06);
  oval(ctx, s * 0.2, -s * 0.18, s * 0.06, s * 0.055);
  oval(ctx, -s * 0.05, -s * 0.15, s * 0.055, s * 0.05);
  ctx.fillStyle = "rgba(255,255,255,0.55)"; oval(ctx, -s * 0.1, -s * 0.38, s * 0.09, s * 0.035, -0.25);
  ctx.restore();
  // Near legs last, in front of the body, darker.
  leg(s * 0.2, s * 0.34, 0, "#231F22", thin);
  leg(0, s * 0.04, 0.5, "#231F22", thin);
  leg(-s * 0.18, -s * 0.26, 0, "#231F22", thin);
  ctx.restore();
}
function oval(ctx: Pen, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 2 * Math.PI);
  ctx.fill();
}

function butterflyWing(ctx: Pen, s: number, cols: readonly [string, string], side: number, flap: number, moth: boolean) {
  ctx.save(); ctx.scale(side * flap, 1);
  const fore = ctx.createLinearGradient(-s * 0.05, -s * 0.55, s * 0.75, -s * 0.15);
  fore.addColorStop(0, cols[0]); fore.addColorStop(1, cols[1]);
  ctx.fillStyle = fore; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.05);
  ctx.quadraticCurveTo(s * 0.05, -s * 0.55, s * 0.52, -s * 0.68);
  ctx.quadraticCurveTo(s * 0.83, -s * 0.68, s * 0.79, -s * 0.35);
  ctx.quadraticCurveTo(s * 0.73, -s * 0.06, s * 0.15, s * 0.12); ctx.fill();
  const hind = ctx.createLinearGradient(0, s * 0.02, s * 0.48, s * 0.48);
  hind.addColorStop(0, cols[0]); hind.addColorStop(1, cols[1]);
  ctx.fillStyle = hind; ctx.beginPath(); ctx.moveTo(s * 0.03, s * 0.03);
  ctx.quadraticCurveTo(s * 0.45, -s * 0.08, s * 0.59, s * 0.24);
  ctx.quadraticCurveTo(s * 0.56, s * 0.53, s * 0.31, s * 0.5);
  ctx.quadraticCurveTo(s * 0.09, s * 0.38, s * 0.03, s * 0.03); ctx.fill();

  ctx.strokeStyle = moth ? "#665E5A" : "#55424A"; ctx.lineWidth = Math.max(0.65, s * 0.018); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(s * 0.03, s * 0.04); ctx.lineTo(s * 0.7, -s * 0.44);
  ctx.moveTo(s * 0.1, s * 0.02); ctx.quadraticCurveTo(s * 0.29, -s * 0.14, s * 0.43, -s * 0.6);
  ctx.moveTo(s * 0.17, 0); ctx.quadraticCurveTo(s * 0.43, -s * 0.08, s * 0.75, -s * 0.27);
  ctx.moveTo(s * 0.15, s * 0.12); ctx.quadraticCurveTo(s * 0.31, s * 0.24, s * 0.48, s * 0.44);
  ctx.moveTo(s * 0.16, s * 0.14); ctx.quadraticCurveTo(s * 0.28, s * 0.32, s * 0.31, s * 0.47);
  ctx.moveTo(s * 0.19, s * 0.12); ctx.quadraticCurveTo(s * 0.4, s * 0.22, s * 0.55, s * 0.25); ctx.stroke();
  ctx.strokeStyle = moth ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.58)";
  ctx.lineWidth = Math.max(0.5, s * 0.012);
  ctx.beginPath(); ctx.moveTo(s * 0.16, -s * 0.06); ctx.quadraticCurveTo(s * 0.4, -s * 0.29, s * 0.67, -s * 0.42);
  ctx.moveTo(s * 0.22, s * 0.2); ctx.quadraticCurveTo(s * 0.31, s * 0.32, s * 0.37, s * 0.42); ctx.stroke();

  if (moth) {
    ctx.strokeStyle = "#F4E9D1"; ctx.lineWidth = Math.max(0.65, s * 0.025);
    ctx.beginPath(); ctx.moveTo(s * 0.28, s * 0.43); ctx.lineTo(s * 0.34, s * 0.49);
    ctx.moveTo(s * 0.39, s * 0.39); ctx.lineTo(s * 0.46, s * 0.44);
    ctx.moveTo(s * 0.5, s * 0.32); ctx.lineTo(s * 0.57, s * 0.35); ctx.stroke();
    ctx.fillStyle = "#B7A58B"; oval(ctx, s * 0.42, -s * 0.39, s * 0.08, s * 0.055, -0.45);
    ctx.fillStyle = "#F4E9D1"; oval(ctx, s * 0.42, -s * 0.39, s * 0.033, s * 0.035);
  } else {
    ctx.fillStyle = cols[1]; oval(ctx, s * 0.42, s * 0.31, s * 0.105, s * 0.105);
    ctx.fillStyle = "#F8E8C6"; oval(ctx, s * 0.42, s * 0.31, s * 0.068, s * 0.068);
    ctx.fillStyle = "#493842"; oval(ctx, s * 0.42, s * 0.31, s * 0.035, s * 0.035);
    ctx.strokeStyle = cols[1]; ctx.lineWidth = Math.max(0.7, s * 0.022);
    ctx.beginPath(); ctx.moveTo(s * 0.23, -s * 0.16); ctx.lineTo(s * 0.29, -s * 0.2);
    ctx.moveTo(s * 0.3, -s * 0.12); ctx.lineTo(s * 0.36, -s * 0.16);
    ctx.moveTo(s * 0.38, -s * 0.08); ctx.lineTo(s * 0.44, -s * 0.12); ctx.stroke();
  }
  ctx.restore();
}

export function butterfly(ctx: Pen, x: number, y: number, s: number, f: number, cols: readonly [string, string], tilt = 0, moth = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  const flap = Math.max(0.2, Math.min(1, f));
  butterflyWing(ctx, s, cols, -1, flap, moth); butterflyWing(ctx, s, cols, 1, flap, moth);
  const body = ctx.createLinearGradient(-s * 0.08, 0, s * 0.08, 0);
  body.addColorStop(0, moth ? "#514842" : "#3A3330"); body.addColorStop(0.5, moth ? "#887A6A" : "#625046"); body.addColorStop(1, "#302C2A");
  ctx.fillStyle = body; oval(ctx, 0, s * 0.02, s * 0.065, s * 0.38);
  ctx.fillStyle = moth ? "#5E554C" : "#443839"; oval(ctx, 0, -s * 0.32, s * 0.085, s * 0.09);
  ctx.fillStyle = "#241F20"; oval(ctx, -s * 0.035, -s * 0.34, s * 0.018, s * 0.024);
  ctx.strokeStyle = moth ? "#62594E" : "#483840"; ctx.lineWidth = Math.max(0.65, s * 0.018); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-s * 0.035, -s * 0.39); ctx.quadraticCurveTo(-s * 0.22, -s * 0.58, -s * 0.28, -s * 0.48);
  ctx.moveTo(s * 0.035, -s * 0.39); ctx.quadraticCurveTo(s * 0.22, -s * 0.58, s * 0.28, -s * 0.48); ctx.stroke();
  if (moth) {
    ctx.fillStyle = "#6D5948"; oval(ctx, -s * 0.28, -s * 0.48, s * 0.035, s * 0.055, -0.5);
    oval(ctx, s * 0.28, -s * 0.48, s * 0.035, s * 0.055, 0.5);
  } else {
    ctx.fillStyle = "#4C3B32"; oval(ctx, -s * 0.28, -s * 0.48, s * 0.03, s * 0.05, -0.5);
    oval(ctx, s * 0.28, -s * 0.48, s * 0.03, s * 0.05, 0.5);
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? "#51433D" : "#8A7160";
    oval(ctx, 0, s * (-0.12 + i * 0.105), s * 0.07, s * 0.028);
  }
  ctx.restore();
}

function beeWing(ctx: Pen, s: number, x: number, y: number, rot: number, len: number, width: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.globalAlpha *= 0.45;
  const fill = ctx.createLinearGradient(0, -width, len, width);
  fill.addColorStop(0, "#FFFFFF"); fill.addColorStop(1, "#BDE3E6"); ctx.fillStyle = fill;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.18, -width * 1.65, len * 0.72, -width);
  ctx.quadraticCurveTo(len * 1.12, -width * 0.55, len, 0);
  ctx.quadraticCurveTo(len * 0.68, width * 0.92, len * 0.24, width * 0.54); ctx.closePath(); ctx.fill();
  ctx.globalAlpha /= 0.45; ctx.strokeStyle = "#B7DCE0"; ctx.lineWidth = Math.max(0.55, s * 0.012);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.9, -width * 0.25);
  ctx.moveTo(len * 0.2, 0); ctx.quadraticCurveTo(len * 0.5, -width * 0.75, len * 0.75, -width * 0.92);
  ctx.moveTo(len * 0.25, width * 0.18); ctx.quadraticCurveTo(len * 0.55, width * 0.55, len * 0.81, width * 0.58);
  ctx.moveTo(len * 0.48, -width * 0.14); ctx.lineTo(len * 0.55, width * 0.48); ctx.stroke();
  ctx.restore();
}

export function bee(ctx: Pen, x: number, y: number, s: number, t: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const beat = Math.sin(t * 0.09), lift = Math.abs(beat);
  beeWing(ctx, s, -s * 0.02, -s * 0.2, -0.55 - beat * 0.4, s * 0.58, s * (0.14 + lift * 0.045));
  beeWing(ctx, s, s * 0.12, -s * 0.2, 0.4 + beat * 0.4, s * 0.48, s * (0.12 + lift * 0.04));
  beeWing(ctx, s, -s * 0.2, -s * 0.19, -0.92 - beat * 0.45, s * 0.42, s * (0.105 + lift * 0.04));
  beeWing(ctx, s, s * 0.2, -s * 0.18, 0.8 + beat * 0.45, s * 0.38, s * (0.1 + lift * 0.035));
  const shell = ctx.createRadialGradient(-s * 0.12, -s * 0.16, s * 0.03, 0, 0, s * 0.62);
  shell.addColorStop(0, "#FFE78A"); shell.addColorStop(0.58, "#E8A82C"); shell.addColorStop(1, "#AD6826");
  ctx.fillStyle = shell; oval(ctx, -s * 0.02, s * 0.015, s * 0.55, s * 0.32);
  ctx.fillStyle = "#49352D";
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.29); ctx.quadraticCurveTo(-s * 0.12, 0, -s * 0.17, s * 0.29);
  ctx.quadraticCurveTo(-s * 0.1, s * 0.32, -s * 0.045, s * 0.31); ctx.quadraticCurveTo(-s * 0.01, 0, -s * 0.05, -s * 0.31); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.035, -s * 0.31); ctx.quadraticCurveTo(s * 0.12, 0, s * 0.085, s * 0.31);
  ctx.quadraticCurveTo(s * 0.16, s * 0.31, s * 0.21, s * 0.27); ctx.quadraticCurveTo(s * 0.25, 0, s * 0.15, -s * 0.29); ctx.fill();
  ctx.strokeStyle = "rgba(255,239,172,0.65)"; ctx.lineWidth = Math.max(0.65, s * 0.018);
  ctx.beginPath(); ctx.moveTo(-s * 0.43, -s * 0.12); ctx.quadraticCurveTo(-s * 0.23, -s * 0.34, s * 0.04, -s * 0.29); ctx.stroke();
  ctx.fillStyle = "#D88732"; oval(ctx, s * 0.34, -s * 0.015, s * 0.2, s * 0.19);
  ctx.fillStyle = "#332B29"; oval(ctx, s * 0.4, -s * 0.065, s * 0.032, s * 0.038);
  ctx.fillStyle = "#FFFFFF"; oval(ctx, s * 0.408, -s * 0.08, s * 0.012, s * 0.014);
  ctx.strokeStyle = "#49352D"; ctx.lineWidth = Math.max(0.65, s * 0.018);
  ctx.beginPath(); ctx.moveTo(s * 0.36, -s * 0.16); ctx.quadraticCurveTo(s * 0.33, -s * 0.38, s * 0.2, -s * 0.39);
  ctx.moveTo(s * 0.44, -s * 0.16); ctx.quadraticCurveTo(s * 0.48, -s * 0.4, s * 0.58, -s * 0.39); ctx.stroke();
  ctx.strokeStyle = "#49352D"; ctx.lineWidth = Math.max(0.8, s * 0.021);
  ctx.beginPath();
  ctx.moveTo(-s * 0.27, s * 0.18); ctx.lineTo(-s * 0.34, s * 0.39); ctx.lineTo(-s * 0.28, s * 0.46);
  ctx.moveTo(-s * 0.06, s * 0.25); ctx.lineTo(-s * 0.09, s * 0.45); ctx.lineTo(-s * 0.02, s * 0.49);
  ctx.moveTo(s * 0.19, s * 0.19); ctx.lineTo(s * 0.26, s * 0.39); ctx.lineTo(s * 0.34, s * 0.42); ctx.stroke();
  ctx.fillStyle = "#C88D31"; oval(ctx, -s * 0.35, s * 0.38, s * 0.075, s * 0.045);
  ctx.fillStyle = "#EAC66A"; oval(ctx, -s * 0.35, s * 0.37, s * 0.035, s * 0.026);
  ctx.restore();
}

export function ladybird(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.strokeStyle = "#342B2A"; ctx.lineWidth = Math.max(0.8, s * 0.025);
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.14); ctx.lineTo(-s * 0.38, s * 0.31); ctx.lineTo(-s * 0.46, s * 0.34);
  ctx.moveTo(-s * 0.25, s * 0.14); ctx.lineTo(-s * 0.31, s * 0.32); ctx.lineTo(-s * 0.24, s * 0.4);
  ctx.moveTo(0, s * 0.23); ctx.lineTo(-s * 0.06, s * 0.4); ctx.lineTo(-s * 0.01, s * 0.45);
  ctx.moveTo(0, s * 0.23); ctx.lineTo(s * 0.08, s * 0.4); ctx.lineTo(s * 0.15, s * 0.43);
  ctx.moveTo(s * 0.25, s * 0.14); ctx.lineTo(s * 0.33, s * 0.31); ctx.lineTo(s * 0.43, s * 0.34);
  ctx.moveTo(s * 0.25, s * 0.14); ctx.lineTo(s * 0.34, s * 0.29); ctx.lineTo(s * 0.3, s * 0.38);
  ctx.moveTo(-s * 0.23, -s * 0.12); ctx.lineTo(-s * 0.35, -s * 0.3);
  ctx.moveTo(s * 0.22, -s * 0.12); ctx.lineTo(s * 0.31, -s * 0.3); ctx.stroke();
  const shell = ctx.createRadialGradient(-s * 0.2, -s * 0.25, s * 0.02, 0, 0, s * 0.68);
  shell.addColorStop(0, "#FF7860"); shell.addColorStop(0.56, "#E74438"); shell.addColorStop(1, "#9F2A2C");
  ctx.fillStyle = shell; oval(ctx, -s * 0.03, 0, s * 0.48, s * 0.4);
  ctx.strokeStyle = "#8E3030"; ctx.lineWidth = Math.max(0.7, s * 0.018);
  ctx.beginPath(); ctx.moveTo(-s * 0.03, -s * 0.39); ctx.lineTo(-s * 0.02, s * 0.37); ctx.stroke();
  ctx.fillStyle = "#28272A";
  oval(ctx, -s * 0.26, -s * 0.16, s * 0.075, s * 0.075);
  oval(ctx, -s * 0.15, s * 0.12, s * 0.072, s * 0.072);
  oval(ctx, s * 0.17, -s * 0.21, s * 0.075, s * 0.075);
  oval(ctx, s * 0.18, s * 0.12, s * 0.08, s * 0.08);
  oval(ctx, s * 0.45, -s * 0.08, s * 0.19, s * 0.17);
  ctx.fillStyle = "#FFF0D7"; oval(ctx, s * 0.51, -s * 0.12, s * 0.025, s * 0.028);
  ctx.strokeStyle = "#29272A"; ctx.lineWidth = Math.max(0.7, s * 0.016);
  ctx.beginPath(); ctx.moveTo(s * 0.48, -s * 0.2); ctx.quadraticCurveTo(s * 0.49, -s * 0.32, s * 0.43, -s * 0.34);
  ctx.moveTo(s * 0.56, -s * 0.19); ctx.quadraticCurveTo(s * 0.62, -s * 0.28, s * 0.65, -s * 0.26); ctx.stroke();
  ctx.strokeStyle = "rgba(255,211,170,0.75)"; ctx.lineWidth = Math.max(0.7, s * 0.02);
  ctx.beginPath(); ctx.quadraticCurveTo(-s * 0.22, -s * 0.39, s * 0.02, -s * 0.34); ctx.stroke();
  ctx.restore();
}

export function firefly(ctx: Pen, x: number, y: number, s: number, glow: number) {
  const alpha = ctx.globalAlpha;
  ctx.save(); ctx.translate(x, y);
  const halo = ctx.createRadialGradient(0, 0, s * 0.08, 0, 0, s * 1.65);
  halo.addColorStop(0, `rgba(255,248,166,${Math.min(0.72, 0.25 + glow * 0.45)})`);
  halo.addColorStop(0.28, `rgba(248,238,126,${Math.min(0.34, 0.1 + glow * 0.22)})`);
  halo.addColorStop(1, "rgba(248,238,126,0)");
  ctx.fillStyle = halo; oval(ctx, 0, 0, s * 1.65, s * 1.65);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#8B7250"; oval(ctx, -s * 0.08, -s * 0.12, s * 0.22, s * 0.14, -0.35);
  ctx.fillStyle = "#E5D78C"; oval(ctx, -s * 0.08, -s * 0.3, s * 0.22, s * 0.1, -0.3);
  ctx.strokeStyle = "#79664B"; ctx.lineWidth = Math.max(0.55, s * 0.05);
  ctx.beginPath(); ctx.moveTo(-s * 0.18, -s * 0.38); ctx.quadraticCurveTo(-s * 0.3, -s * 0.58, -s * 0.38, -s * 0.53);
  ctx.moveTo(s * 0.02, -s * 0.38); ctx.quadraticCurveTo(s * 0.18, -s * 0.57, s * 0.23, -s * 0.51); ctx.stroke();
  const light = ctx.createRadialGradient(-s * 0.04, -s * 0.02, s * 0.02, 0, 0, s * 0.29);
  light.addColorStop(0, "#FFFFE7"); light.addColorStop(0.5, "#F6F3A0"); light.addColorStop(1, "#C6B85D");
  ctx.fillStyle = light; oval(ctx, s * 0.25, s * 0.06, s * 0.29, s * 0.2);
  ctx.strokeStyle = "rgba(153,129,69,0.65)"; ctx.lineWidth = Math.max(0.5, s * 0.025);
  ctx.beginPath(); ctx.moveTo(s * 0.08, -s * 0.08); ctx.lineTo(s * 0.08, s * 0.19);
  ctx.moveTo(s * 0.2, -s * 0.11); ctx.lineTo(s * 0.2, s * 0.24);
  ctx.moveTo(s * 0.33, -s * 0.12); ctx.lineTo(s * 0.33, s * 0.24); ctx.stroke();
  ctx.restore();
}

function dragonWing(ctx: Pen, s: number, side: number, x: number, y: number, flap: number, forward: boolean) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(side * (Math.PI * 0.5 + (forward ? -0.24 : 0.24)));
  ctx.scale(1, flap); ctx.globalAlpha *= 0.48;
  const length = forward ? 0.75 : 0.62, width = forward ? 0.19 : 0.16;
  const wing = ctx.createLinearGradient(0, 0, s * length, 0);
  wing.addColorStop(0, "#E7FCF5"); wing.addColorStop(0.7, "#C7ECE3"); wing.addColorStop(1, "#A8D9D5");
  ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * length * 0.25, -s * width * 1.7, s * length * 0.78, -s * width);
  ctx.quadraticCurveTo(s * length * 1.1, -s * width * 0.48, s * length, 0);
  ctx.quadraticCurveTo(s * length * 0.7, s * width * 0.9, s * length * 0.16, s * width * 0.5); ctx.closePath(); ctx.fill();
  ctx.globalAlpha /= 0.48; ctx.strokeStyle = "#8EBFBA"; ctx.lineWidth = Math.max(0.55, s * 0.009);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * length, 0);
  ctx.moveTo(s * length * 0.12, -s * width * 0.06); ctx.lineTo(s * length * 0.77, -s * width * 0.83);
  ctx.moveTo(s * length * 0.15, s * width * 0.06); ctx.lineTo(s * length * 0.76, s * width * 0.67);
  ctx.moveTo(s * length * 0.35, -s * width * 0.1); ctx.lineTo(s * length * 0.46, s * width * 0.32);
  ctx.moveTo(s * length * 0.55, -s * width * 0.12); ctx.lineTo(s * length * 0.68, s * width * 0.25); ctx.stroke();
  ctx.restore();
}

export function dragonfly(ctx: Pen, x: number, y: number, s: number, ang: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  const beat = 0.78 + 0.22 * Math.sin(t * 0.11);
  dragonWing(ctx, s, -1, -s * 0.12, -s * 0.09, beat, true);
  dragonWing(ctx, s, 1, -s * 0.12, -s * 0.09, beat, true);
  dragonWing(ctx, s, -1, -s * 0.18, s * 0.01, beat, false);
  dragonWing(ctx, s, 1, -s * 0.18, s * 0.01, beat, false);
  const abdomen = ctx.createLinearGradient(-s * 0.85, -s * 0.1, -s * 0.85, s * 0.12);
  abdomen.addColorStop(0, "#65B6A9"); abdomen.addColorStop(0.5, "#2F8C8E"); abdomen.addColorStop(1, "#17636D");
  ctx.fillStyle = abdomen; oval(ctx, -s * 0.43, 0, s * 0.7, s * 0.08);
  ctx.strokeStyle = "#165E66"; ctx.lineWidth = Math.max(0.75, s * 0.018);
  for (let i = 0; i < 6; i++) {
    const px = -s * (0.16 + i * 0.16);
    ctx.beginPath(); ctx.moveTo(px, -s * 0.075); ctx.lineTo(px - s * 0.018, s * 0.075); ctx.stroke();
  }
  ctx.fillStyle = "#277C80"; oval(ctx, s * 0.13, 0, s * 0.2, s * 0.13);
  const head = ctx.createRadialGradient(s * 0.37, -s * 0.08, s * 0.01, s * 0.4, 0, s * 0.18);
  head.addColorStop(0, "#69B9A9"); head.addColorStop(1, "#1C6670");
  ctx.fillStyle = head; oval(ctx, s * 0.4, 0, s * 0.14, s * 0.14);
  ctx.fillStyle = "#163C4B"; oval(ctx, s * 0.44, -s * 0.1, s * 0.085, s * 0.11);
  ctx.fillStyle = "#EAF8D8"; oval(ctx, s * 0.46, -s * 0.13, s * 0.026, s * 0.03);
  ctx.restore();
}

export function beetle(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.strokeStyle = "#252D28"; ctx.lineWidth = Math.max(0.8, s * 0.027);
  ctx.beginPath();
  ctx.moveTo(-s * 0.27, s * 0.13); ctx.lineTo(-s * 0.38, s * 0.34); ctx.lineTo(-s * 0.47, s * 0.37);
  ctx.moveTo(-s * 0.27, s * 0.13); ctx.lineTo(-s * 0.29, s * 0.35); ctx.lineTo(-s * 0.2, s * 0.42);
  ctx.moveTo(-s * 0.08, s * 0.24); ctx.lineTo(-s * 0.12, s * 0.43); ctx.lineTo(-s * 0.04, s * 0.48);
  ctx.moveTo(-s * 0.08, s * 0.24); ctx.lineTo(s * 0.02, s * 0.43); ctx.lineTo(s * 0.1, s * 0.46);
  ctx.moveTo(s * 0.21, s * 0.15); ctx.lineTo(s * 0.27, s * 0.36); ctx.lineTo(s * 0.36, s * 0.39);
  ctx.moveTo(s * 0.21, s * 0.15); ctx.lineTo(s * 0.38, s * 0.3); ctx.lineTo(s * 0.4, s * 0.39);
  ctx.moveTo(-s * 0.24, -s * 0.12); ctx.lineTo(-s * 0.36, -s * 0.26);
  ctx.moveTo(s * 0.19, -s * 0.12); ctx.lineTo(s * 0.27, -s * 0.26); ctx.stroke();
  const shell = ctx.createRadialGradient(-s * 0.18, -s * 0.22, s * 0.01, 0, 0, s * 0.68);
  shell.addColorStop(0, "#929C78"); shell.addColorStop(0.45, "#52664D"); shell.addColorStop(1, "#283E37");
  ctx.fillStyle = shell; oval(ctx, -s * 0.02, 0, s * 0.48, s * 0.36);
  ctx.fillStyle = "rgba(179,194,139,0.25)"; oval(ctx, -s * 0.15, -s * 0.19, s * 0.22, s * 0.08, -0.25);
  ctx.strokeStyle = "#273A35"; ctx.lineWidth = Math.max(0.75, s * 0.02);
  ctx.beginPath(); ctx.moveTo(-s * 0.02, -s * 0.34); ctx.lineTo(-s * 0.02, s * 0.34); ctx.stroke();
  ctx.fillStyle = "#293D36"; oval(ctx, s * 0.43, -s * 0.04, s * 0.19, s * 0.16);
  ctx.fillStyle = "#C0B688"; oval(ctx, s * 0.49, -s * 0.1, s * 0.022, s * 0.022);
  ctx.strokeStyle = "#303D35"; ctx.lineWidth = Math.max(0.65, s * 0.018);
  ctx.beginPath(); ctx.moveTo(s * 0.42, -s * 0.17); ctx.quadraticCurveTo(s * 0.4, -s * 0.31, s * 0.34, -s * 0.33);
  ctx.moveTo(s * 0.5, -s * 0.17); ctx.quadraticCurveTo(s * 0.58, -s * 0.28, s * 0.62, -s * 0.25); ctx.stroke();
  ctx.fillStyle = "#C6C998"; oval(ctx, -s * 0.26, -s * 0.2, s * 0.09, s * 0.028, -0.4);
  ctx.restore();
}

export function bird(ctx: Pen, x: number, y: number, s: number, color: string, pose: "flying" | "perched" | "puffed", dir = 1, flap = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const flying = pose === "flying", puff = pose === "puffed";
  const body = ctx.createRadialGradient(-s * 0.1, -s * 0.2, s * 0.02, 0, 0, s * 0.7);
  body.addColorStop(0, color === "#E9BC45" ? "#FFE08A" : "#C19672");
  body.addColorStop(0.58, color); body.addColorStop(1, color === "#E9BC45" ? "#A66F2D" : "#554536");
  if (flying) {
    ctx.fillStyle = "#594C42";
    ctx.beginPath(); ctx.moveTo(-s * 0.35, s * 0.01); ctx.lineTo(-s * 0.83, -s * 0.15);
    ctx.lineTo(-s * 0.57, s * 0.16); ctx.lineTo(-s * 0.8, s * 0.31); ctx.lineTo(-s * 0.24, s * 0.23); ctx.fill();
    const wing = ctx.createLinearGradient(0, -s * 0.7, 0, s * 0.12);
    wing.addColorStop(0, "#6D5B4B"); wing.addColorStop(1, color);
    ctx.fillStyle = wing; ctx.beginPath(); ctx.moveTo(-s * 0.23, s * 0.02);
    ctx.quadraticCurveTo(-s * 0.38, -s * (0.35 + flap * 0.24), -s * 0.1, -s * (0.62 + flap * 0.3));
    ctx.quadraticCurveTo(s * 0.18, -s * (0.48 + flap * 0.25), s * 0.38, -s * 0.08);
    ctx.quadraticCurveTo(s * 0.04, -s * 0.25, -s * 0.23, s * 0.02); ctx.fill();
    ctx.strokeStyle = "rgba(255,239,201,0.45)"; ctx.lineWidth = Math.max(0.7, s * 0.025);
    ctx.beginPath(); ctx.moveTo(-s * 0.17, 0); ctx.quadraticCurveTo(-s * 0.02, -s * 0.38, s * 0.24, -s * 0.34);
    ctx.moveTo(-s * 0.1, -s * 0.06); ctx.lineTo(s * 0.11, -s * 0.42);
    ctx.moveTo(-s * 0.02, -s * 0.08); ctx.lineTo(s * 0.26, -s * 0.2); ctx.stroke();
  }
  ctx.fillStyle = body; oval(ctx, 0, s * 0.02, s * (puff ? 0.49 : 0.4), s * (puff ? 0.38 : 0.31), -0.08);
  if (!flying) {
    ctx.fillStyle = color === "#E9BC45" ? "#B7832F" : "#70513D";
    ctx.beginPath(); ctx.moveTo(-s * 0.29, s * 0.06); ctx.lineTo(-s * 0.73, s * 0.31);
    ctx.lineTo(-s * 0.25, s * 0.23); ctx.fill();
    ctx.fillStyle = color === "#E9BC45" ? "#F3CE69" : "#B39172";
    ctx.beginPath(); ctx.moveTo(-s * 0.17, -s * 0.15); ctx.quadraticCurveTo(-s * 0.05, -s * 0.36, s * 0.21, -s * 0.13);
    ctx.quadraticCurveTo(s * 0.06, s * 0.1, -s * 0.17, s * 0.1); ctx.fill();
    ctx.strokeStyle = "rgba(255,239,201,0.52)"; ctx.lineWidth = Math.max(0.7, s * 0.025);
    ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.03); ctx.quadraticCurveTo(-s * 0.02, -s * 0.19, s * 0.15, -s * 0.02);
    ctx.moveTo(-s * 0.12, s * 0.08); ctx.lineTo(s * 0.08, s * 0.13); ctx.stroke();
  }
  const headX = s * 0.3, headY = -s * 0.13;
  ctx.fillStyle = body; oval(ctx, headX, headY, s * 0.2, s * 0.19);
  ctx.fillStyle = color === "#E9BC45" ? "#D99935" : "#BA8661";
  ctx.beginPath(); ctx.moveTo(s * 0.45, -s * 0.12); ctx.lineTo(s * 0.76, -s * 0.04); ctx.lineTo(s * 0.46, s * 0.015); ctx.fill();
  ctx.fillStyle = "#292821"; oval(ctx, s * 0.36, -s * 0.17, s * 0.035, s * 0.04);
  ctx.fillStyle = "#FFF5D9"; oval(ctx, s * 0.37, -s * 0.185, s * 0.012, s * 0.014);
  ctx.strokeStyle = "#68543F"; ctx.lineWidth = Math.max(0.7, s * 0.035);
  ctx.beginPath(); ctx.moveTo(-s * 0.08, s * 0.27); ctx.lineTo(-s * 0.08, s * 0.46);
  ctx.moveTo(s * 0.12, s * 0.25); ctx.lineTo(s * 0.12, s * 0.43);
  ctx.moveTo(-s * 0.18, s * 0.46); ctx.lineTo(s * 0.01, s * 0.46);
  ctx.moveTo(s * 0.03, s * 0.43); ctx.lineTo(s * 0.2, s * 0.43); ctx.stroke();
  if (flying) {
    ctx.strokeStyle = "rgba(55,47,40,0.38)"; ctx.lineWidth = Math.max(0.65, s * 0.018);
    ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.07); ctx.quadraticCurveTo(0, s * 0.23, s * 0.17, s * 0.09); ctx.stroke();
  }
  ctx.restore();
}

export function owl(ctx: Pen, x: number, y: number, s: number, blink = false) {
  const body = ctx.createRadialGradient(x - s * 0.18, y - s * 0.3, s * 0.02, x, y, s * 0.75);
  body.addColorStop(0, "#A38A67"); body.addColorStop(0.6, "#75634D"); body.addColorStop(1, "#493D34");
  ctx.fillStyle = body; oval(ctx, x, y, s * 0.52, s * 0.62);
  ctx.fillStyle = "#5E4D3D";
  ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.32); ctx.lineTo(x - s * 0.46, y - s * 0.78); ctx.lineTo(x - s * 0.06, y - s * 0.48);
  ctx.moveTo(x + s * 0.4, y - s * 0.32); ctx.lineTo(x + s * 0.46, y - s * 0.78); ctx.lineTo(x + s * 0.06, y - s * 0.48); ctx.fill();
  ctx.fillStyle = "#E8D7B4"; oval(ctx, x, y + s * 0.28, s * 0.31, s * 0.28);
  ctx.strokeStyle = "#CBB994"; ctx.lineWidth = Math.max(0.7, s * 0.025);
  ctx.beginPath(); ctx.moveTo(x - s * 0.22, y + s * 0.2); ctx.lineTo(x, y + s * 0.46); ctx.lineTo(x + s * 0.22, y + s * 0.2); ctx.stroke();
  for (let side = -1; side <= 1; side += 2) {
    oval(ctx, x + s * side * 0.2, y - s * 0.12, s * 0.17, s * 0.18);
    ctx.fillStyle = "#F4E8D0"; oval(ctx, x + s * side * 0.2, y - s * 0.12, s * 0.125, s * 0.13);
    ctx.fillStyle = blink ? "#55463A" : "#D9A84D";
    oval(ctx, x + s * side * 0.2, y - s * 0.12, s * 0.065, s * (blink ? 0.018 : 0.085));
    if (!blink) { ctx.fillStyle = "#24251F"; oval(ctx, x + s * side * 0.2, y - s * 0.12, s * 0.027, s * 0.067); }
    ctx.fillStyle = "#FFFFFF"; oval(ctx, x + s * (side * 0.2 - 0.025), y - s * 0.16, s * 0.022, s * 0.022);
  }
  ctx.fillStyle = "#DDA64E"; ctx.beginPath(); ctx.moveTo(x, y + s * 0.02); ctx.lineTo(x - s * 0.07, y + s * 0.15); ctx.lineTo(x + s * 0.07, y + s * 0.15); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#D5C39F"; ctx.lineWidth = Math.max(0.7, s * 0.02);
  ctx.beginPath(); ctx.moveTo(x - s * 0.31, y + s * 0.5); ctx.lineTo(x - s * 0.13, y + s * 0.56);
  ctx.moveTo(x + s * 0.13, y + s * 0.56); ctx.lineTo(x + s * 0.31, y + s * 0.5); ctx.stroke();
}

export function gull(ctx: Pen, x: number, y: number, s: number, flap: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const lift = flap * 0.55;
  ctx.fillStyle = "#D5D5CC"; ctx.beginPath(); ctx.moveTo(-s * 0.8, s * 0.12);
  ctx.quadraticCurveTo(-s * 0.44, -s * (0.18 + lift), 0, s * 0.02);
  ctx.quadraticCurveTo(s * 0.42, -s * (0.2 + lift), s * 0.9, s * 0.12);
  ctx.quadraticCurveTo(s * 0.39, s * 0.18, 0, s * 0.12);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.19, -s * 0.8, s * 0.12); ctx.fill();
  ctx.strokeStyle = "#707A7D"; ctx.lineWidth = Math.max(0.75, s * 0.025);
  ctx.beginPath(); ctx.moveTo(-s * 0.6, s * 0.09); ctx.lineTo(-s * 0.45, s * 0.03);
  ctx.lineTo(-s * 0.34, s * 0.13); ctx.moveTo(s * 0.6, s * 0.08); ctx.lineTo(s * 0.45, s * 0.01);
  ctx.lineTo(s * 0.34, s * 0.13); ctx.stroke();
  ctx.fillStyle = "#F7F5EB"; oval(ctx, 0, s * 0.12, s * 0.27, s * 0.105);
  ctx.fillStyle = "#C94C36"; ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.08); ctx.lineTo(s * 0.48, s * 0.12);
  ctx.lineTo(s * 0.2, s * 0.16); ctx.fill();
  ctx.fillStyle = "#242525"; oval(ctx, s * 0.1, s * 0.08, s * 0.018, s * 0.022);
  ctx.restore();
}

export function frog(ctx: Pen, x: number, y: number, s: number, hop = 0) {
  const yy = y - hop;
  const body = ctx.createRadialGradient(x - s * 0.13, yy - s * 0.23, s * 0.02, x, yy, s * 0.66);
  body.addColorStop(0, "#9BC76D"); body.addColorStop(0.55, "#628B50"); body.addColorStop(1, "#3D6744");
  ctx.fillStyle = body; oval(ctx, x, yy, s * 0.48, s * 0.3);
  ctx.fillStyle = "#E7DDAA"; oval(ctx, x + s * 0.13, yy + s * 0.12, s * 0.23, s * 0.15);
  ctx.fillStyle = "#628B50";
  for (const dx of [-0.25, 0.25]) {
    oval(ctx, x + s * dx, yy - s * 0.22, s * 0.14, s * 0.14);
    ctx.fillStyle = "#F1E7C0"; oval(ctx, x + s * dx, yy - s * 0.22, s * 0.086, s * 0.088);
    ctx.fillStyle = "#243D2E"; oval(ctx, x + s * (dx + 0.025), yy - s * 0.22, s * 0.033, s * 0.057);
    ctx.fillStyle = "#FFFFFF"; oval(ctx, x + s * (dx + 0.005), yy - s * 0.245, s * 0.02, s * 0.022);
    ctx.fillStyle = "#628B50";
  }
  ctx.strokeStyle = "#426B45"; ctx.lineWidth = Math.max(0.8, s * 0.025);
  ctx.beginPath(); ctx.moveTo(x - s * 0.36, yy + s * 0.05); ctx.quadraticCurveTo(x, yy + s * 0.2, x + s * 0.36, yy + s * 0.05); ctx.stroke();
  ctx.fillStyle = "#A9CF77";
  oval(ctx, x - s * 0.17, yy + s * 0.015, s * 0.035, s * 0.025);
  oval(ctx, x + s * 0.24, yy - s * 0.03, s * 0.03, s * 0.022);
  ctx.strokeStyle = "#426B45"; ctx.lineWidth = Math.max(1, s * 0.11);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.23, yy + s * 0.18); ctx.quadraticCurveTo(x - s * 0.46, yy + s * 0.13, x - s * 0.42, yy + s * 0.34);
  ctx.lineTo(x - s * 0.53, yy + s * 0.38); ctx.moveTo(x + s * 0.21, yy + s * 0.18);
  ctx.quadraticCurveTo(x + s * 0.43, yy + s * 0.16, x + s * 0.4, yy + s * 0.34); ctx.stroke();
}

export function squirrel(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  const fur = ctx.createRadialGradient(-s * 0.14, -s * 0.33, s * 0.02, 0, 0, s * 0.72);
  fur.addColorStop(0, "#D4935A"); fur.addColorStop(0.58, "#A66A3F"); fur.addColorStop(1, "#70462F");
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.13);
  ctx.quadraticCurveTo(-s * 0.73, -s * 0.17, -s * 0.43, -s * 0.59);
  ctx.quadraticCurveTo(-s * 0.13, -s * 0.75, -s * 0.14, -s * 0.2);
  ctx.quadraticCurveTo(-s * 0.25, -s * 0.05, -s * 0.2, s * 0.13); ctx.fill();
  ctx.fillStyle = "#E9C29A";
  ctx.beginPath(); ctx.moveTo(-s * 0.29, -s * 0.09); ctx.quadraticCurveTo(-s * 0.53, -s * 0.35, -s * 0.38, -s * 0.48);
  ctx.quadraticCurveTo(-s * 0.16, -s * 0.56, -s * 0.23, -s * 0.27); ctx.fill();
  ctx.fillStyle = fur; oval(ctx, 0, -s * 0.04, s * 0.33, s * 0.25);
  ctx.fillStyle = "#E9C6A0"; oval(ctx, s * 0.1, s * 0.11, s * 0.19, s * 0.12);
  ctx.fillStyle = "#A66A3F"; oval(ctx, s * 0.24, -s * 0.32, s * 0.18, s * 0.18);
  ctx.beginPath(); ctx.moveTo(s * 0.15, -s * 0.42); ctx.lineTo(s * 0.13, -s * 0.68); ctx.lineTo(s * 0.32, -s * 0.48);
  ctx.moveTo(s * 0.35, -s * 0.42); ctx.lineTo(s * 0.46, -s * 0.59); ctx.lineTo(s * 0.46, -s * 0.35); ctx.fill();
  ctx.fillStyle = "#E6B59A"; oval(ctx, s * 0.2, -s * 0.49, s * 0.055, s * 0.09, -0.1);
  ctx.fillStyle = "#2B2924"; oval(ctx, s * 0.34, -s * 0.37, s * 0.028, s * 0.035);
  ctx.fillStyle = "#F7E5D3"; oval(ctx, s * 0.35, -s * 0.38, s * 0.01, s * 0.012);
  ctx.fillStyle = "#6F4331"; oval(ctx, s * 0.45, -s * 0.27, s * 0.045, s * 0.035);
  ctx.strokeStyle = "#70472F"; ctx.lineWidth = Math.max(0.75, s * 0.025);
  ctx.beginPath(); ctx.moveTo(-s * 0.08, s * 0.17); ctx.lineTo(-s * 0.16, s * 0.36);
  ctx.moveTo(s * 0.12, s * 0.17); ctx.lineTo(s * 0.2, s * 0.35);
  ctx.moveTo(-s * 0.02, -s * 0.02); ctx.lineTo(s * 0.1, s * 0.14); ctx.stroke();
  ctx.restore();
}

export function crab(ctx: Pen, x: number, y: number, s: number, dir = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.strokeStyle = "#B85E42"; ctx.lineWidth = Math.max(1, s * 0.055); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.1); ctx.lineTo(-s * 0.38, s * 0.25); ctx.lineTo(-s * 0.46, s * 0.38);
  ctx.moveTo(-s * 0.1, s * 0.18); ctx.lineTo(-s * 0.22, s * 0.36); ctx.lineTo(-s * 0.25, s * 0.43);
  ctx.moveTo(s * 0.1, s * 0.18); ctx.lineTo(s * 0.2, s * 0.36); ctx.lineTo(s * 0.25, s * 0.43);
  ctx.moveTo(s * 0.25, s * 0.1); ctx.lineTo(s * 0.38, s * 0.25); ctx.lineTo(s * 0.47, s * 0.36); ctx.stroke();
  const shell = ctx.createRadialGradient(-s * 0.14, -s * 0.15, s * 0.02, 0, 0, s * 0.65);
  shell.addColorStop(0, "#F3A06B"); shell.addColorStop(0.58, "#D87548"); shell.addColorStop(1, "#9F4D3C");
  ctx.fillStyle = shell; oval(ctx, 0, 0, s * 0.43, s * 0.25);
  ctx.strokeStyle = "#A84F3B"; ctx.lineWidth = Math.max(0.7, s * 0.022);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.09); ctx.quadraticCurveTo(0, -s * 0.31, s * 0.3, -s * 0.09);
  ctx.moveTo(-s * 0.35, s * 0.01); ctx.quadraticCurveTo(0, s * 0.19, s * 0.35, s * 0.01); ctx.stroke();
  ctx.strokeStyle = "#B85E42"; ctx.lineWidth = Math.max(1.2, s * 0.08);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.13); ctx.lineTo(-s * 0.48, -s * 0.33);
  ctx.quadraticCurveTo(-s * 0.58, -s * 0.45, -s * 0.7, -s * 0.34);
  ctx.moveTo(s * 0.3, -s * 0.13); ctx.lineTo(s * 0.48, -s * 0.33);
  ctx.quadraticCurveTo(s * 0.58, -s * 0.45, s * 0.7, -s * 0.34); ctx.stroke();
  ctx.fillStyle = "#D87548"; oval(ctx, -s * 0.7, -s * 0.34, s * 0.12, s * 0.1, -0.45);
  oval(ctx, s * 0.7, -s * 0.34, s * 0.12, s * 0.1, 0.45);
  ctx.strokeStyle = "#A84F3B"; ctx.lineWidth = Math.max(0.7, s * 0.025);
  ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.34); ctx.lineTo(-s * 0.75, -s * 0.24);
  ctx.moveTo(s * 0.7, -s * 0.34); ctx.lineTo(s * 0.75, -s * 0.24); ctx.stroke();
  ctx.fillStyle = "#F2E8D4";
  for (const side of [-1, 1]) {
    oval(ctx, side * s * 0.21, -s * 0.3, s * 0.105, s * 0.12);
    ctx.fillStyle = "#2E3430"; oval(ctx, side * s * 0.235, -s * 0.32, s * 0.04, s * 0.055);
    ctx.fillStyle = "#FFFFFF"; oval(ctx, side * s * 0.25, -s * 0.34, s * 0.014, s * 0.018);
    ctx.fillStyle = "#F2E8D4";
  }
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
