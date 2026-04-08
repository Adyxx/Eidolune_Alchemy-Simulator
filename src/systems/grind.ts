// systems/grind.ts
import type { ActionLogic } from "../core/types/types";
import { getIngredientComposition, syncIngredientPhysicalState } from "../core/helper/physicalState";

export const grindLogic: ActionLogic = {
  id: "grind",

  apply: ([ingredient]) => {
    const out = structuredClone(ingredient);
    const composition = getIngredientComposition(out);

    out.name = `Ground ${out.name}`;
    out.amount *= 0.95;
    out.quality = Math.max(0, out.quality - 10);
    out.tags = [...new Set([...out.tags, "powder"])];
    out.temperature += 5;
    out.solubility = Math.min(1, (out.solubility ?? 0.1) + 0.12);

    out.composition = {
      liquidPhase: composition.liquidPhase,
      dissolvedSolids: composition.dissolvedSolids,
      undissolvedSolids: Math.max(composition.undissolvedSolids, 0.8),
    };

    return syncIngredientPhysicalState(out);
  },
};