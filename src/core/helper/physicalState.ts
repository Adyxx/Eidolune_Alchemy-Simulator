import type {
  Ingredient,
  IngredientComposition,
  MatterBehavior,
  MatterState,
} from "../types/types";

export const LIQUID_VISCOSITY_MAX = 0.3;
export const SOLID_VISCOSITY_MIN = 0.9;

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeComposition(composition: IngredientComposition): IngredientComposition {
  const liquidPhase = clamp01(composition.liquidPhase);
  const dissolvedSolids = clamp01(composition.dissolvedSolids);
  const undissolvedSolids = clamp01(composition.undissolvedSolids);

  const total = liquidPhase + dissolvedSolids + undissolvedSolids;
  if (total <= 0) {
    return { liquidPhase: 0, dissolvedSolids: 0, undissolvedSolids: 1 };
  }

  return {
    liquidPhase: liquidPhase / total,
    dissolvedSolids: dissolvedSolids / total,
    undissolvedSolids: undissolvedSolids / total,
  };
}

export function hasContinuousLiquidPhase(ingredient: Ingredient): boolean {
  if (ingredient.state === "gas" || ingredient.state === "plasma") return false;
  const composition = getIngredientComposition(ingredient);
  return composition.liquidPhase >= 0.06;
}

export function stateToDefaultViscosity(state?: MatterState): number {
  switch (state) {
    case "liquid":
      return 0.08;
    case "solid":
      return 0.95;
    case "mixture":
      return 0.65;
    case "gas":
    case "plasma":
      return 0;
    default:
      return 0.65;
  }
}

export function getIngredientComposition(ingredient: Ingredient): IngredientComposition {
  if (ingredient.composition) {
    return normalizeComposition(ingredient.composition);
  }

  switch (ingredient.state) {
    case "liquid":
      return { liquidPhase: 1, dissolvedSolids: 0, undissolvedSolids: 0 };
    case "solid":
      return { liquidPhase: 0, dissolvedSolids: 0, undissolvedSolids: 1 };
    case "mixture":
      return { liquidPhase: 0.45, dissolvedSolids: 0.2, undissolvedSolids: 0.35 };
    default:
      return { liquidPhase: 0, dissolvedSolids: 0, undissolvedSolids: 0 };
  }
}

export function calculateViscosityFromComposition(ingredient: Ingredient): number {
  if (ingredient.state === "gas" || ingredient.state === "plasma") {
    return 0;
  }

  const composition = getIngredientComposition(ingredient);
  const dissolved = composition.dissolvedSolids;
  const undissolved = composition.undissolvedSolids;
  const liquid = composition.liquidPhase;

  const temperature = ingredient.temperature ?? ingredient.properties?.temperature ?? 20;
  const heatThinning = Math.max(0, Math.min(0.2, (temperature - 20) / 400));

  let viscosity =
    0.08 +
    dissolved * 0.5 +
    undissolved * 0.9 -
    liquid * 0.35 -
    heatThinning;

  if (ingredient.tags.includes("powder") && undissolved > 0.2) {
    viscosity -= 0.05;
  }

  if (ingredient.tags.includes("gel") || ingredient.tags.includes("gelling")) {
    viscosity = Math.max(viscosity, 0.72);
  }

  return clamp01(viscosity);
}

export function getIngredientViscosity(ingredient: Ingredient): number {
  if (ingredient.state === "gas" || ingredient.state === "plasma") return 0;

  if (ingredient.composition) {
    return calculateViscosityFromComposition(ingredient);
  }

  return clamp01(
    ingredient.viscosity ?? stateToDefaultViscosity(ingredient.state)
  );
}

export function classifyMatterBehavior(ingredient: Ingredient): MatterBehavior {
  const viscosity = getIngredientViscosity(ingredient);
  const composition = getIngredientComposition(ingredient);
  const hasLiquid = hasContinuousLiquidPhase(ingredient);

  if (ingredient.tags.includes("gel") || ingredient.tags.includes("gelling")) {
    return "gel";
  }

  if (!hasLiquid && composition.undissolvedSolids >= 0.6) {
    return "solid";
  }

  if (viscosity <= 0.3 && composition.undissolvedSolids < 0.12) {
    return "fluid";
  }

  if (viscosity <= 0.7 && composition.undissolvedSolids <= 0.2) {
    return "syrup";
  }

  if (viscosity <= 0.8) {
    return "slurry";
  }

  if (viscosity < 0.95) {
    return "paste";
  }

  return "solid";
}

export function deriveStateFromViscosity(
  viscosity: number,
  currentState?: MatterState,
  composition?: IngredientComposition
): MatterState {
  if (currentState === "gas" || currentState === "plasma") {
    return currentState;
  }

  const normalized = composition
    ? normalizeComposition(composition)
    : undefined;
  const hasLiquid = (normalized?.liquidPhase ?? 0) >= 0.06;

  if (!hasLiquid && viscosity >= SOLID_VISCOSITY_MIN) {
    return "solid";
  }

  if (!hasLiquid) {
    return "mixture";
  }

  // Liquid-phase dominance: as long as free liquid exists and density is not extreme,
  // physical behavior remains liquid-like.
  if (hasLiquid && viscosity < 0.9) {
    return "liquid";
  }

  if (viscosity <= LIQUID_VISCOSITY_MAX) return "liquid";
  if (viscosity >= 0.95) return "solid";
  return "mixture";
}

export function matchesStateRequirement(
  ingredient: Ingredient,
  requiredState: MatterState
): boolean {
  if (requiredState === "gas" || requiredState === "plasma") {
    return ingredient.state === requiredState;
  }

  const composition = getIngredientComposition(ingredient);
  const viscosity = getIngredientViscosity(ingredient);
  const hasLiquid = hasContinuousLiquidPhase(ingredient);

  if (requiredState === "liquid") {
    return hasLiquid && viscosity < 0.9;
  }

  if (requiredState === "solid") {
    return !hasLiquid || viscosity >= 0.95 || composition.undissolvedSolids > 0.9;
  }

  return hasLiquid && viscosity >= 0.3 && viscosity < 0.95;
}

export function syncIngredientPhysicalState<T extends Ingredient>(
  ingredient: T
): T {
  const composition = getIngredientComposition(ingredient);
  const viscosity = getIngredientViscosity({
    ...ingredient,
    composition,
  } as Ingredient);
  const behavior = classifyMatterBehavior({
    ...ingredient,
    composition,
    viscosity,
  } as Ingredient);

  ingredient.composition = composition;
  ingredient.viscosity = viscosity;
  ingredient.behavior = behavior;
  ingredient.state = deriveStateFromViscosity(
    viscosity,
    ingredient.state,
    composition
  );

  ingredient.properties ??= {};
  ingredient.properties.viscosity = viscosity;
  ingredient.properties.temperature = ingredient.temperature;
  ingredient.properties.liquidPhase = composition.liquidPhase;
  ingredient.properties.dissolvedSolids = composition.dissolvedSolids;
  ingredient.properties.undissolvedSolids = composition.undissolvedSolids;

  return ingredient;
}
