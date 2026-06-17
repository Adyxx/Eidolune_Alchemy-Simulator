// ui/helper/display.ts
import type { Ingredient } from "../../core/types/types";
import { findRecipeName } from "../../core/helper/recipeUtils";

// --- Display helpers ---

export function sweetnessColor(sweetness: number) {
  const t = Math.max(0, Math.min(1, sweetness / 100));
  const r = Math.floor(220 * t + 100 * (1 - t));
  const g = Math.floor(180 * (1 - t) + 220 * t);
  const b = Math.floor(255 * (1 - t));
  return `rgb(${r}, ${g}, ${b})`;
}

export function temperatureGlow(temperature: number) {
  const t = Math.max(0, Math.min(1, (temperature - 10) / 70));
  const alpha = 0.2 + 0.6 * t;
  return `0 0 ${Math.floor(10 + 20 * t)}px rgba(255, 150, 50, ${alpha})`;
}

export function qualityLabel(quality: number) {
  if (quality > 80) return "High";
  if (quality > 60) return "Good";
  if (quality > 40) return "Medium";
  if (quality > 20) return "Low";
  return "Poor";
}

export function getStateUnit(state?: string): string {
  switch (state) {
    case "liquid":
      return "ml";
    case "mixture":
      return "g/ml";
    case "solid":
      return "g";
    case "gas":
      return "L";
    case "plasma":
      return "erg";
    default:
      return "ml"; // default to milliliters for unknown states
  }
}

export function formatAmount(amount: number, state?: string): string {
  const unit = getStateUnit(state);
  return `${Math.round(amount * 10) / 10} ${unit}`;
}

export function flavorName(sweetness: number, temperature: number) {
  const sweet = sweetness < 20 ? "Bitter" : sweetness < 60 ? "Mildly Sweet" : "Sweet";
  const temp = temperature < 25 ? "Cold" : temperature < 60 ? "Warm" : "Hot";
  return `${temp} ${sweet} Water`;
}

export function getDisplayName(result: Ingredient) {
  if (!result) return "No output";

  const recipeName = findRecipeName(result);
  if (recipeName) return recipeName;

  if (result.name && !["Final Output", "Potion Mix"].some((tag) => result.name.startsWith(tag))) {
    return result.name;
  }

  if (result.name && result.name.startsWith("Mixed")) {
    return result.name;
  }

  if (result.sourceNames?.length === 1) {
    return result.sourceNames[0];
  }

  if (result.sourceNames?.length) {
    const joined = result.sourceNames.join(" + ");
    return `Mixed ${joined}`;
  }

  return flavorName(result.properties.sweetness ?? 0, result.temperature ?? result.properties.temperature ?? 0);
}

export function liquidTraits(result: Ingredient) {
  const traits: string[] = [];

  if (result.properties.sweetness !== undefined) {
    if (result.properties.sweetness > 50) traits.push("Very sweet");
    else if (result.properties.sweetness > 20) traits.push("Mild sweetness");
    else if (result.properties.sweetness > 5) traits.push("Slight sweetness");
    else traits.push("Not sweet");
  }

  const temperature = result.temperature ?? result.properties.temperature;
  if (temperature !== undefined) {
    if (temperature > 60) traits.push("Hot");
    else if (temperature > 40) traits.push("Warm");
    else traits.push("Cool");
  }

  return traits;
}