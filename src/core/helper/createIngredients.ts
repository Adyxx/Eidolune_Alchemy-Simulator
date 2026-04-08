
import type { Ingredient } from "../../core/types/types";

export function createIngredient(
  base: Partial<Ingredient>
): Ingredient {
  return {
    id: crypto.randomUUID(),

    name: "Unknown",
    amount: 0,
    quality: 0,

    properties: {},
    tags: [],

    state: "solid",
    viscosity: 0.95,
    temperature: 20,
    behavior: "solid",
    composition: {
      liquidPhase: 0,
      dissolvedSolids: 0,
      undissolvedSolids: 1,
    },
    solubility: 0.1,
    thermal: {
      conductivity: 0.5, // default medium-ish
      capacity: 1,       // default heat capacity
    },


    sourceNames: [],
    sourceDetails: [],
    sourceContributions: {},

    ...base,
  };
}
