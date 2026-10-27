import type { Skeleton, Strategy } from "../generator";
import type { Species, StrategyId } from "../species";
import { branching } from "./branching";
import { palm } from "./palm";

const STRATEGIES: Record<StrategyId, Strategy> = { branching, palm };

/** The skeleton is the tree's whole lifetime for one seed, so it is built once and reused for every day. */
export function build(seed: number, S: Species): Skeleton {
  return STRATEGIES[S.strategy](seed, S);
}
