// nodes/grindNode.ts
import { grindLogic } from "../systems/grind";
import type { ActionNodeDefinition } from "../core/types/types";

export const GrindNode: ActionNodeDefinition = {
  id: "grind",

  name: "Grind",
  emoji: "⚙️",

  inputSpec: [
    {
      id: "in",
      allowedStates: ["solid"],
      minViscosity: 0.95,
    },
  ],

  logic: grindLogic,
};