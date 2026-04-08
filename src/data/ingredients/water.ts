//water.ts
import type { Ingredient, Reaction } from "../../core/types/types";

const freezeWater: Reaction = {
  id: "freeze_water",
  type: "temporary",
  conditions: {
    maxTemp: 0,
    requiredState: "liquid",
  },
  effects: {
    setState: "solid",
    addTags: ["crystal"],
    namePrefix: "Ice",
  },
};

const boilWater: Reaction = {
  id: "boil_water",
  type: "temporary",
  conditions: {
    minTemp: 100,
    requiredState: "liquid",
  },
  effects: {
    addTags: ["boiling"],
  },
};

export const Water: Ingredient = {
  id: "water",

  name: "Water",
  amount: 100,
  quality: 100,
  state: "liquid",
  viscosity: 0.02,
  temperature: 25,
  solubility: 1,
  composition: {
    liquidPhase: 1,
    dissolvedSolids: 0,
    undissolvedSolids: 0,
  },

  tags: ["inert", "stable"],

  properties: {
    sweetness: 0,
  },

  thermal: {
    conductivity: 0.08,
    capacity: 1.0,
  },

  reactions: [freezeWater, boilWater],

  emoji: "💧",
  color: "#78d0ff",
  colorEffectiveness: 0.1,

  sourceNames: ["water"],
};