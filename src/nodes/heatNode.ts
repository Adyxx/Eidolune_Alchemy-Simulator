import { heatLogic } from "../systems/heat";
import type { ActionNodeDefinition } from "../core/types/types";

export const HeatNode: ActionNodeDefinition = {
  id: "heat",
  name: "Heat",
  emoji: "🔥",
  ui: {
    variant: "burner",
    color: "#5d4a2f",
  },
  inputSpec: [{ id: "in" }],
  paramSpec: [
    {
      id: "power",
      label: "Burner Power",
      min: 0,
      max: 10,
      default: 0,
    },
  ],
  logic: heatLogic,
};