import type { Node } from "reactflow";
import type { Ingredient, ActionNodeDefinition } from "../types/types";
import { IngredientFactory } from "./IngredientFactory";

/**
 * NodeFactory: creates fully typed ReactFlow nodes
 */
export class NodeFactory {
  // --- Ingredient Node ---
  static createIngredientNode(options: {
    label: string;
    emoji?: string;
    ingredientBase?: Partial<Ingredient>;
    x: number;
    y: number;
    onIngredientAmountChange?: (id: string, amount: number) => void;
  }): Node {
    const { label, emoji, ingredientBase, x, y, onIngredientAmountChange } = options;

    // Create full ingredient using the IngredientFactory
    const ingredient = ingredientBase
      ? IngredientFactory.create(ingredientBase)
      : IngredientFactory.create({ name: label });

    const id = `${Date.now()}-${Math.random()}`;

    return {
      id,
      type: "ingredient",
      position: { x, y },
      data: {
        label,
        emoji,
        ingredient,
        onIngredientAmountChange: (amount: number) =>
          onIngredientAmountChange?.(id, amount), // 🔥 inject id here
      },
    };
  }

  // --- Action Node ---
  static createActionNode(options: {
    label: string;
    emoji?: string;
    action: ActionNodeDefinition;
    x: number;
    y: number;
    onParamsChange?: (id: string, params: Record<string, number>) => void;
  }): Node {
    const { label, emoji, action, x, y, onParamsChange } = options;
    const params = (action.paramSpec ?? []).reduce<Record<string, number>>(
      (acc, spec) => {
        acc[spec.id] = spec.default;
        return acc;
      },
      {}
    );

    return {
      id: `${Date.now()}-${Math.random()}`,
      type: "action",
      position: { x, y },
      data: {
        label,
        emoji,
        action,
        definition: action,
        params,
        onParamsChange,
      },
    };
  }

  // --- Preview Node ---
  static createPreviewNode(options: {
    label: string;
    emoji?: string;
    x: number;
    y: number;
  }): Node {
    const { label, emoji, x, y } = options;
    return {
      id: `${Date.now()}-${Math.random()}`,
      type: "preview",
      position: { x, y },
      data: { label, emoji, result: null },
    };
  }

  // --- Output Node ---
  static createOutputNode(options: { x: number; y: number }): Node {
    const { x, y } = options;
    return {
      id: "output",
      type: "output",
      position: { x, y },
      data: {},

      selectable: false,
    };
  }
}