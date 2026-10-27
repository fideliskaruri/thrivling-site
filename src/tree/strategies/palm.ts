import { builder, LIFETIME, type Strategy } from "../generator";
import { clamp } from "../util";

/** An unbranched trunk crowned by fronds; old fronds fall as new ones unfurl at the tip, each a little longer as the palm matures. */
export const palm: Strategy = (seed, S) => {
  const { r, pick, trunk, kid, finish } = builder(seed, S);
  const c = S.crown!;
  const life = c.turnover * LIFETIME, last = LIFETIME * 0.92;
  for (let i = 0, side = 1; i < c.fronds; i++, side = -side) {
    const born = 0.6 + (last - 0.6) * i / (c.fronds - 1) + r(0, 1.5);
    kid(trunk, {
      pos: S.TH * 2, side, ang: pick(c.spread), maxL: S.TH * pick(c.length) * (0.3 + 0.7 * clamp(born / (LIFETIME * 0.6))), rate: S.TH * 0.03, bend: 0,
      droop: c.droop * r(0.8, 1.2), depth: 1, die: born + life < LIFETIME ? born + life : undefined,
    }, born);
  }
  return finish();
};
