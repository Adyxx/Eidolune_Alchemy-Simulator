import type { ActionLogic } from "../core/types/types";
import { evaluateReactions } from "../core/helper/reactionEvaluator";
import { getIngredientComposition, syncIngredientPhysicalState } from "../core/helper/physicalState";

export const heatLogic: ActionLogic = {
  id: "heat",

  apply: ([ingredient], params = {}, context) => {
    const previous = context?.previousOutput;
    const out = structuredClone(ingredient);

    const sameIngredient = previous?.id === ingredient.id;
    if (sameIngredient && previous?._heatMemory) {
      out._heatMemory = structuredClone(previous._heatMemory);
      out.temperature = previous.temperature;
    }

    out._heatMemory ??= { timeAboveThresholds: {} };
    out._heatMemory.timeAboveThresholds ??= {};

    const dt = Math.max(0.016, context?.deltaTime ?? 0.1);
    const power = params.power ?? 0;
    const ambientTemp = context?.ambientTemperature ?? 25;

    const conductivity = out.thermal?.conductivity ?? 0.05;
    const capacity = Math.max(0.05, out.thermal?.capacity ?? 1.0);

    const maxBurnerTemp = 240;
    const targetBurnerTemp = ambientTemp + (maxBurnerTemp - ambientTemp) * (power / 10);

    const burnerResponse = 1.35;
    const prevBurnerTemp = out._heatMemory.burnerTemperature ?? ambientTemp;
    const burnerTemp =
      prevBurnerTemp + (targetBurnerTemp - prevBurnerTemp) * (1 - Math.exp(-burnerResponse * dt));
    out._heatMemory.burnerTemperature = burnerTemp;

    const prevIngredientTemp = out.temperature;
    const heatFromBurner = conductivity * (burnerTemp - out.temperature);
    const passiveCooling = 0.09 * (ambientTemp - out.temperature);

    out.temperature += ((heatFromBurner + passiveCooling) / capacity) * dt;

    const riseRate = (out.temperature - prevIngredientTemp) / dt;
    out._heatMemory.lastTemperature = out.temperature;
    out._heatMemory.lastRiseRate = riseRate;

    const composition = getIngredientComposition(out);
    const heatFactor = Math.max(0, Math.min(1, (out.temperature - 35) / 120));
    const totalSolidFraction = composition.dissolvedSolids + composition.undissolvedSolids;
    const hasLiquidCarrier = composition.liquidPhase >= 0.06;
    const capacityPerLiquidUnit =
      0.3 + (out.solubility ?? 0.1) * 2.2 + Math.max(0, (out.temperature - 20) / 100);
    const dissolvedCapacityFraction = composition.liquidPhase * capacityPerLiquidUnit;
    const targetDissolvedFraction = hasLiquidCarrier
      ? Math.min(totalSolidFraction, dissolvedCapacityFraction)
      : composition.dissolvedSolids;
    const dissolveStep = Math.max(
      0,
      targetDissolvedFraction - composition.dissolvedSolids
    ) * (0.9 + heatFactor) * dt;

    out.composition = {
      liquidPhase: composition.liquidPhase,
      dissolvedSolids: Math.min(1, composition.dissolvedSolids + dissolveStep),
      undissolvedSolids: Math.max(0, composition.undissolvedSolids - dissolveStep),
    };
    out.solubility = Math.min(1, (out.solubility ?? 0.1) + heatFactor * 0.03 * dt);

    syncIngredientPhysicalState(out);

    return evaluateReactions(out, dt);
  },
};
