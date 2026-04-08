import { IngredientsList } from "../../data/ingredients";
import type { Ingredient } from "../types/types";
import { createIngredient as baseCreateIngredient } from "../helper/createIngredients";
import { syncIngredientPhysicalState } from "../helper/physicalState";

export class IngredientFactory {
  static fromName(name: string): Ingredient {
    const entries = Object.entries(IngredientsList) as [string, Ingredient][];

    const found = entries.find(
      ([key, ingredient]) =>
        ingredient.name === name || key.toLowerCase() === name.toLowerCase()
    );

    if (!found) throw new Error(`Ingredient ${name} not found`);
    return syncIngredientPhysicalState(structuredClone(found[1]));
  }

  static create(base: Partial<Ingredient> = {}): Ingredient {
    return syncIngredientPhysicalState(baseCreateIngredient(base));
  }

  static clone(ingredient: Ingredient): Ingredient {
    return syncIngredientPhysicalState(baseCreateIngredient({
      ...ingredient,
      viscosity: ingredient.viscosity,
      properties: { ...ingredient.properties },
      tags: [...ingredient.tags],
      sourceNames: [...(ingredient.sourceNames ?? [])],
      sourceDetails: [...(ingredient.sourceDetails ?? [])],
      sourceContributions: { ...ingredient.sourceContributions },
    }));
  }
}