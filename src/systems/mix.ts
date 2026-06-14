import type { ActionLogic, Ingredient, MatterState } from "../core/types/types";
import {
  calculateViscosityFromComposition,
  deriveStateFromViscosity,
  getIngredientComposition,
  hasContinuousLiquidPhase,
  syncIngredientPhysicalState,
} from "../core/helper/physicalState";

export const mixLogic: ActionLogic = {
  id: "mix",

  apply: (ingredients) => {
    if (ingredients.length === 0) {
      throw new Error("Mix requires at least one ingredient");
    }

    // Single ingredient: just return it
    if (ingredients.length === 1) {
      return syncIngredientPhysicalState(structuredClone(ingredients[0]));
    }

    const totalAmount = ingredients.reduce((acc, item) => acc + item.amount, 0);
    if (totalAmount <= 0) {
      throw new Error("Mix requires a positive total amount");
    }

    const totalThermalMass = ingredients.reduce(
      (acc, item) => acc + item.amount * (item.thermal?.capacity ?? 1),
      0
    );

    const mixedTemperature =
      totalThermalMass > 0
        ? ingredients.reduce(
            (acc, item) =>
              acc + item.temperature * item.amount * (item.thermal?.capacity ?? 1),
            0
          ) / totalThermalMass
        : ingredients.reduce((acc, item) => acc + item.temperature * item.amount, 0) / totalAmount;

    const compositionTotals = ingredients.reduce(
      (acc, item) => {
        const composition = getIngredientComposition(item);

        acc.liquidPhaseMass += item.amount * composition.liquidPhase;
        acc.dissolvedMass += item.amount * composition.dissolvedSolids;
        acc.undissolvedMass += item.amount * composition.undissolvedSolids;
        return acc;
      },
      {
        liquidPhaseMass: 0,
        dissolvedMass: 0,
        undissolvedMass: 0,
      }
    );

    const totalSolidMass =
      compositionTotals.dissolvedMass + compositionTotals.undissolvedMass;
    const hasInitialLiquidPhase =
      compositionTotals.liquidPhaseMass / totalAmount >= 0.06;
    const liquidCarrierMass =
      compositionTotals.liquidPhaseMass + compositionTotals.dissolvedMass * 0.4;

    const weightedSolubility =
      ingredients.reduce(
        (acc, item) => acc + (item.solubility ?? 0.1) * item.amount,
        0
      ) / totalAmount;

    const dissolutionGain = ingredients.reduce((acc, item) => {
      if (!hasInitialLiquidPhase) return acc;

      const composition = getIngredientComposition(item);
      const availableUndissolved = item.amount * composition.undissolvedSolids;
      if (availableUndissolved <= 0) return acc;

      const baseSolubility = item.solubility ?? 0.1;
      const powderBoost = item.tags.includes("powder") ? 0.25 : 0;
      const heatBoost = Math.max(0, Math.min(0.35, (mixedTemperature - 20) / 180));
      const liquidAvailability =
        totalSolidMass > 0
          ? Math.max(0, Math.min(1, liquidCarrierMass / totalSolidMass))
          : 0;

      const dissolveFraction = Math.max(
        0,
        Math.min(
          1,
          baseSolubility * (0.35 + liquidAvailability * 0.5 + heatBoost + powderBoost)
        )
      );

      return acc + availableUndissolved * dissolveFraction;
    }, 0);

    const capacityPerLiquidUnit =
      0.25 + weightedSolubility * 2.25 + Math.max(0, (mixedTemperature - 20) / 120);
    const dissolvedCapacityMass = compositionTotals.liquidPhaseMass * capacityPerLiquidUnit;
    const maxDissolvedMass = Math.max(
      compositionTotals.dissolvedMass,
      dissolvedCapacityMass
    );

    const dissolvedMass = Math.min(
      totalSolidMass,
      maxDissolvedMass,
      compositionTotals.dissolvedMass + dissolutionGain
    );
    const undissolvedMass = Math.max(0, totalSolidMass - dissolvedMass);
    const liquidPhaseMass = compositionTotals.liquidPhaseMass;

    const mergedComposition = {
      liquidPhase: liquidPhaseMass / totalAmount,
      dissolvedSolids: dissolvedMass / totalAmount,
      undissolvedSolids: undissolvedMass / totalAmount,
    };

    const protoIngredient = {
      ...ingredients[0],
      temperature: mixedTemperature,
      composition: mergedComposition,
    } as Ingredient;
    const outputViscosity = calculateViscosityFromComposition(protoIngredient);
    const outputState = determineMixedState(ingredients, outputViscosity, mergedComposition);

    // Merge all ingredients
    const mergedTags = Array.from(
      new Set(ingredients.flatMap((item) => item.tags || []))
    );

    const hasLiquidInput = ingredients.some((item) => hasContinuousLiquidPhase(item));
    const hasSolidInput = ingredients.some((item) => {
      const composition = getIngredientComposition(item);
      return composition.undissolvedSolids > 0.45 && !hasContinuousLiquidPhase(item);
    });

    const namePrefix = hasLiquidInput && hasSolidInput
      ? "Dissolve"
      : hasLiquidInput
        ? "Mix"
        : "Dry Blend";

    const baseName = `${namePrefix} ${Array.from(
      new Set(ingredients.map((item) => item.name))
    ).join(", ")}`;

    const mergedSourceDetails = Array.from(
      new Map(
        ingredients
          .flatMap((item) =>
            item.sourceDetails && item.sourceDetails.length > 0
              ? item.sourceDetails
              : [{ sourceName: item.name, tags: item.tags || [] }]
          )
          .map((detail) => [detail.sourceName.toLowerCase(), detail])
      ).values()
    );

    const mergedSourceContributions: Record<string, number> = {};
    ingredients.forEach((item) => {
      if (item.sourceContributions) {
        Object.entries(item.sourceContributions).forEach(([k, v]) => {
          mergedSourceContributions[k] = (mergedSourceContributions[k] || 0) + v;
        });
      } else {
        mergedSourceContributions[item.name] =
          (mergedSourceContributions[item.name] || 0) + item.amount;
      }
    });

    // Blend colors
    const color = (() => {
      const parse = (hex: string) => {
        if (hex.startsWith("rgb")) {
          const parts = hex
            .replace(/[rgba() ]/g, "")
            .split(",")
            .map((n) => Number(n));
          return [parts[0], parts[1], parts[2]];
        }
        const c = hex.replace("#", "");
        const bigint = parseInt(c, 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
      };
      const total = ingredients.reduce(
        (acc, item) =>
          acc + (item.amount || 1) * (item.colorEffectiveness ?? 1),
        0
      );
      const blended = ingredients.reduce(
        (acc, item) => {
          const col = item.color ? parse(item.color) : [255, 255, 255];
          const weight = (item.amount || 1) * (item.colorEffectiveness ?? 1);
          return [
            acc[0] + col[0] * weight,
            acc[1] + col[1] * weight,
            acc[2] + col[2] * weight,
          ];
        },
        [0, 0, 0]
      );
      if (total <= 0) return "#ffffff";
      const rgb = blended.map((v: number) => Math.round(v / total));
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    })();

    const merged: Ingredient = {
      id: ingredients[0].id,
      name: baseName,
      amount: totalAmount,
      state: outputState,
      viscosity: outputViscosity,
      composition: mergedComposition,
      solubility:
        ingredients.reduce((acc, item) => acc + (item.solubility ?? 0.1) * item.amount, 0) /
        totalAmount,
      quality:
        ingredients.reduce((acc, item) => acc + item.quality * item.amount, 0) /
        totalAmount,
      properties: {},
      temperature: mixedTemperature,
      tags: mergedTags,
      thermal: ingredients[0].thermal || { conductivity: 0.05, capacity: 1.0 },
      reactions: ingredients[0].reactions,
      sourceNames: Array.from(
        new Set(
          ingredients.flatMap((item) => item.sourceNames || [item.name])
        )
      ),
      sourceDetails: mergedSourceDetails,
      sourceContributions: mergedSourceContributions,
      color,
    };

    // Merge properties (weighted by amount)
    const keys = new Set(
      ingredients.flatMap((item) => Object.keys(item.properties))
    );
    keys.forEach((key) => {
      merged.properties[key] =
        ingredients.reduce(
          (acc, item) => acc + (item.properties[key] || 0) * item.amount,
          0
        ) / totalAmount;
    });

    syncIngredientPhysicalState(merged);

    if (merged.state === "liquid") {
      merged.tags = merged.tags.filter((tag) => tag !== "powder");
    }

    return merged;
  },
};

/**
 * Determine the output state based on mixing rules
 */
function determineMixedState(
  ingredients: Ingredient[],
  mixedViscosity: number,
  composition: Ingredient["composition"]
): MatterState {
  const states = ingredients.map((i) => i.state);
  const uniqueStates = Array.from(new Set(states));

  // All same state
  if (uniqueStates.length === 1) {
    return uniqueStates[0] as MatterState;
  }

  // Plasma dominates
  if (uniqueStates.includes("plasma")) {
    return "plasma";
  }

  // Gas dominates
  if (uniqueStates.includes("gas")) {
    return "gas";
  }

  return deriveStateFromViscosity(mixedViscosity, undefined, composition);
}
