import { clamp, hex, mix, WILT } from "./util";
import type { Pen } from "./pen";
import type { Layout } from "./grow";
import type { Species } from "./species";
import type { Palette } from "./palette";
import { createLife, type LifeScene, type LifeTime, type LifeWeather } from "./life";

interface Fall {
  x: number; y: number; ph: number; r0: number; r?: number; petal: boolean;
  age: number; landed: number; size: number; col: string;
}

export interface AmbientEnvironment {
  fallen?: boolean;
  time?: LifeTime;
  weather?: LifeWeather;
  /** The visible span in layout units, when the screen is wider than the tree's square. */
  view?: [number, number];
}

export interface Ambient {
  step(ctx: Pen, lay: Layout, t: number, dt: number, env?: AmbientEnvironment): void;
  wakeAt(): number;
  reset(): void;
}

export function createAmbient(S: Species, pal: Palette): Ambient {
  let lastRet = 1, nextLeaf = Infinity, nextLifeWake = Infinity, lastRate: number | null = null;
  const fall: Fall[] = [], life = createLife();
  const lifeScene: LifeScene = {
    W: 0, H: 0, s: 0, air: [0, 0, 0, 0], perches: [], flowers: [], ground: [[0, 0, 0]],
    time: "day", lively: 1, max: { firefly: 6 }, habitats: [S.habitat], weather: "clear",
  };
  const interval = (rate: number) => -Math.log(1 - Math.random()) * 1000 / rate;

  function step(ctx: Pen, lay: Layout, t: number, dt: number, env: AmbientEnvironment = {}) {
    const { d, health, k, ret, mass, W, GY } = lay;
    const fallen = env.fallen ?? false;
    const loose = fallen ? [] : lay.loose, flowers = fallen ? [] : lay.flowers;
    const sc = W / 920, rnd = Math.random;
    const rate = loose.length ? 0.4 * mass + 3 * k * Math.min(1, loose.length / 200) : 0;
    if (rate !== lastRate) {
      nextLeaf = rate ? t + interval(rate) : Infinity;
      lastRate = rate;
    }
    const src = loose;
    const shed = lastRet > ret && src.length ? Math.min(12, Math.round((lastRet - ret) * src.length * 0.6 + rnd())) : 0;
    lastRet = ret;
    const natural = rate && t >= nextLeaf ? 1 : 0;
    if (natural) nextLeaf = t + interval(rate);
    for (let n = natural + shed; n > 0 && fall.length < 90; n--) {
      const petal = flowers.length > 0 && rnd() < 0.5;
      const e = petal ? flowers[rnd() * flowers.length | 0]! : src[rnd() * src.length | 0]!;
      fall.push({ x: e.mx, y: e.my, ph: rnd() * 6, r0: rnd() * 6, petal, age: 0, landed: 0,
        size: e.size * (petal ? 0.25 : 0.9),
        col: petal ? mix(hex(S.blossom!.colors[1]!), WILT[2]!, k) : mix(pal.LEAF[rnd() * 3 | 0]!, WILT[1]!, Math.max(k, 0.25 + rnd() * 0.4)) });
    }
    for (let i = fall.length - 1; i >= 0; i--) {
      const p = fall[i]!;
      if (p.landed) {
        p.landed += dt;
        if (p.landed > 4) { fall.splice(i, 1); continue; }
      } else {
        p.age += dt;
        p.x += (25 + Math.sin(p.age * 2.2 + p.ph) * 40) * sc * dt;
        p.y += (45 + 15 * Math.sin(p.age * 3 + p.ph)) * sc * dt;
        p.r = p.r0 + Math.sin(p.age * 2.2 + p.ph) * 1.1;
        if (p.y >= GY - 1) { p.y = GY - 1; p.landed = 0.001; p.r = Math.PI / 2; }
        if (p.x > (env.view?.[1] ?? W) + 20) { fall.splice(i, 1); continue; }
      }
      ctx.globalAlpha = p.landed ? 1 - clamp(p.landed - 3) : 1;
      ctx.fillStyle = ctx.strokeStyle = p.col;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r!);
      const s2 = p.size;
      ctx.beginPath();
      if (p.petal) { ctx.ellipse(0, 0, s2, s2 * 0.6, 0, 0, 2 * Math.PI); ctx.fill(); }
      else if (S.shape === "needle") { ctx.lineWidth = Math.max(0.8, s2 * 0.07); ctx.moveTo(0, -s2 / 2); ctx.lineTo(0, s2 / 2); ctx.stroke(); }
      else { const w = s2 * 0.32; ctx.moveTo(0, s2 / 2); ctx.quadraticCurveTo(-w * 1.6, 0, 0, -s2 / 2); ctx.quadraticCurveTo(w * 1.6, 0, 0, s2 / 2); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    lifeScene.W = W; lifeScene.H = W; lifeScene.s = W * 0.014; lifeScene.view = env.view;
    lifeScene.air[0] = W * 0.08;
    lifeScene.air[1] = Math.max(W * 0.04, GY - W * 0.72);
    lifeScene.air[2] = W * 0.92;
    lifeScene.air[3] = GY - W * 0.04;
    lifeScene.time = env.time ?? "day";
    lifeScene.weather = env.weather ?? "clear";
    lifeScene.lively = fallen ? 0.6 : d < 5 ? 0.4 : clamp((health - 40) / 40);
    lifeScene.perches = src; lifeScene.flowers = flowers;
    lifeScene.ground[0]![0] = W * 0.18;
    lifeScene.ground[0]![1] = W * 0.82;
    lifeScene.ground[0]![2] = GY - W * 0.004;
    life.step(ctx, lifeScene, t, dt);
    nextLifeWake = life.busy() ? Infinity : t + 1000;
  }

  return {
    step,
    wakeAt() { return fall.length || life.busy() ? 0 : Math.min(nextLeaf, nextLifeWake); },
    reset() { fall.length = 0; lastRet = 1; nextLeaf = Infinity; nextLifeWake = Infinity; lastRate = null; life.reset(); },
  };
}
