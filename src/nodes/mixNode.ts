import type { ActionNodeDefinition } from "../core/types/types";
import { mixLogic } from "../systems/mix";
import { getIngredientComposition, hasContinuousLiquidPhase } from "../core/helper/physicalState";

export const MixNode: ActionNodeDefinition = {
  id: "mix",
  name: "Mix",
  emoji: "🌊",
  logic: mixLogic,

  inputSpec: [
    {
      id: "input1",
      optional: false,
    },
    {
      id: "input2",
      optional: true,
    },
    {
      id: "input3",
      optional: true,
    },
    {
      id: "input4",
      optional: true,
    },
    {
      id: "input5",
      optional: true,
    },
    {
      id: "input6",
      optional: true,
    },
  ],

  validate: (inputs) => {
    return inputs.every((input) => {
      const composition = getIngredientComposition(input);
      const drySolidLike = !hasContinuousLiquidPhase(input) && composition.undissolvedSolids > 0.55;
      if (!drySolidLike) return true;
      return input.tags.includes("powder");
    });
  },

  outputSpec: [
    {
      id: "output",
      label: "Mixture",
    },
  ],

  ui: {
    variant: "mix",
    color: "#6b4423",
  },
};
