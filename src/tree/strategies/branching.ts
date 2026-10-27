import { builder, type Strategy } from "../generator";

/** Trunk, optional juvenile twigs, scaffold limbs (alternate or whorled) and sub-branches; weeping and aerial roots are options. */
export const branching: Strategy = (seed, S) => {
  const { rand, r, pick, trunk, kid, finish } = builder(seed, S);
  const q = S.TH / 560;
  if (S.twigs) for (let s = 70, side = 1; s < 170; s += r(26, 34), side = -side)
    kid(trunk, { pos: s * q, side, ang: r(50, 62), maxL: r(55, 75), rate: 5, bend: 0.004, depth: 1, die: 30 + (s - 70) / 100 * 22 });
  const sc = S.scaffold, sub = S.sub;
  for (let s = sc.from, side = 1; s < sc.to; s += pick(sc.step), side = -side) {
    const f = (s - sc.from) / (sc.to - sc.from);
    for (const sd of sc.whorl ? [side, -side] : [side]) {
      const b = kid(trunk, { pos: s, side: sd, ang: sc.ang(f) + r(-5, 5), maxL: sc.maxL(f) * r(0.9, 1.1), rate: sc.rate, bend: sc.bend, droop: sc.droop, depth: 1 });
      for (let s2 = pick(sub.first), side2 = sd; s2 < b.maxL - 15; s2 += pick(sub.step), side2 = -side2)
        kid(b, { pos: s2, side: side2, ang: pick(sub.ang), maxL: sub.maxL(s2, b.maxL), rate: sub.rate, bend: sub.bend, droop: sub.droop, depth: 2 });
      if (S.roots && rand() < S.roots.share)
        for (let s3 = r(30, 50); s3 < b.maxL - 20; s3 += r(28, 44))
          kid(b, { pos: s3, side: 1, ang: 0, bend: 0, maxL: S.TH, rate: 9, depth: 3, plumb: true }, Math.max(S.roots.from, b.when(s3 + 20)));
    }
  }
  return finish();
};
