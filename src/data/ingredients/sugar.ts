// sugar.ts
import type { Ingredient } from "../../core/types/types";


export const Sugar: Ingredient = {
  id: "Sugar",

  name: "Sugar",
  amount: 100,
  quality: 100,
  state: "solid",
  viscosity: 1,
  temperature: 25,
  solubility: 0.9,
  composition: {
    liquidPhase: 0,
    dissolvedSolids: 0,
    undissolvedSolids: 1,
  },

  tags: ["organic", "powder"],

  properties: {
    sweetness: 70,
  },

  thermal: {
    conductivity: 0.08,
    capacity: 1.0,
  },

  emoji: "🍬",
  color: "#ffffff",
  colorEffectiveness: 0.2,
  sourceNames: ["Sugar"],
};