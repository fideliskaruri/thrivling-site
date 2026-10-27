import { CATALOG, HABITATS } from "./catalog";
import { compose } from "./compose";
import type { Species } from "./types";

export type * from "./types";
export { compose } from "./compose";
export { FORM, LEAF, BARK as BARK_ATOMS, SEASON } from "./atoms";

export type SpeciesId = keyof typeof CATALOG;
export const SPECIES = Object.fromEntries(
  Object.entries(CATALOG).map(([id, def]) => [id, compose({ ...def, habitat: HABITATS[id as SpeciesId] })]),
) as Record<SpeciesId, Species>;
