import type { ActionInputSpec, Ingredient } from "../types/types";
import { getIngredientViscosity, matchesStateRequirement } from "./physicalState";

function isBelowMin(value: number | undefined, min: number | undefined): boolean {
  return min !== undefined && value !== undefined && value < min;
}

function isAboveMax(value: number | undefined, max: number | undefined): boolean {
  return max !== undefined && value !== undefined && value > max;
}

export function getIngredientNumericProperty(
  ingredient: Ingredient,
  key: string
): number | undefined {
  if (key === "temperature") return ingredient.temperature;
  if (key === "viscosity") return getIngredientViscosity(ingredient);
  return ingredient.properties?.[key];
}

export function validateIngredientAgainstInputSpec(
  input: Ingredient,
  spec: ActionInputSpec
): boolean {
  if (
    spec.allowedStates &&
    !spec.allowedStates.some((state) => matchesStateRequirement(input, state))
  ) {
    return false;
  }

  if (spec.allowedTags && !input.tags.some((tag) => spec.allowedTags!.includes(tag))) {
    return false;
  }

  const viscosity = getIngredientViscosity(input);
  if (isBelowMin(viscosity, spec.minViscosity) || isAboveMax(viscosity, spec.maxViscosity)) {
    return false;
  }

  const temperature = input.temperature;
  if (
    isBelowMin(temperature, spec.minTemperature) ||
    isAboveMax(temperature, spec.maxTemperature)
  ) {
    return false;
  }

  if (spec.propertyConstraints) {
    for (const [property, range] of Object.entries(spec.propertyConstraints)) {
      const value = getIngredientNumericProperty(input, property);
      if (value === undefined) return false;
      if (isBelowMin(value, range.min) || isAboveMax(value, range.max)) {
        return false;
      }
    }
  }

  return true;
}
