// moonleaf.ts
import type { Ingredient } from "../../core/types/types";


export const Moonleaf: Ingredient = {
  id: "moonleaf",

  name: "Moonleaf",
  amount: 100,
  quality: 100,
  state: "solid",
  viscosity: 0.93,
  temperature: 25,
  solubility: 0.2,
  composition: {
    liquidPhase: 0,
    dissolvedSolids: 0,
    undissolvedSolids: 1,
  },

  tags: ["plant", "magical", "luminous"],

  properties: {
    sweetness: 5,
  },
  
  thermal: {
    conductivity: 0.08,
    capacity: 1.0,
  },

  emoji: "🌿",
  color: "#62c050",
  colorEffectiveness: 1,

  sourceNames: ["Moonleaf"],
};
