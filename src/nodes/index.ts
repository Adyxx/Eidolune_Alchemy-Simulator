// nodes/index.ts

import { DistillateNode } from "./distillateNode";
import { GrindNode } from "./grindNode";
import { HeatNode } from "./heatNode";
import { MixNode } from "./mixNode";
import type { ActionNodeDefinition } from "../core/types/types";

export const ActionsList: Record<string, ActionNodeDefinition> = {
  Distillate: DistillateNode,
  Grind: GrindNode,
  Heat: HeatNode,
  Mix: MixNode,
};

export * from "./getActionByName";