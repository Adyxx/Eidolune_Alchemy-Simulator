import type { Ingredient } from "../../core/types/types";
import { RecipeBook } from "../../data/recipes/recipes";

function normalizeSourceNames(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[+,]/) // split mixtures
    .map((part) =>
      part
        .replace(/^\s*(mixed|heated|infused|distilled|filtered|fermented|ground|ice)\s+/i, "")
        .replace(/\(.*\)/, "")
        .trim()
    )
    .filter(Boolean);
}

function normalizeSourceName(name: string): string {
  const normalized = normalizeSourceNames(name);
  return normalized.length > 0 ? normalized[0] : "";
}

export function findRecipeName(result: Ingredient): string | null {
  const sourceNames = result.sourceNames?.flatMap((n) => normalizeSourceNames(n)) || [];
  const sourceDetails = result.sourceDetails || [];
  const sourceDetailNames = sourceDetails.flatMap((d) => normalizeSourceNames(d.sourceName));
  const normalizedResultName = result.name ? normalizeSourceName(result.name) : "";

  // auto-name simple water/ice endpoints:
  if (
    sourceDetails.length === 1 &&
    normalizeSourceName(sourceDetails[0].sourceName) === "water" &&
    result.tags.includes("fluid")
  ) {
    return "Water";
  }

  if (
    sourceDetails.some((d) => d.sourceName.toLowerCase() === "water") &&
    result.tags.includes("solid") &&
    !result.tags.includes("fluid") &&
    (result.properties.temperature ?? 20) <= 0
  ) {
    return "Ice";
  }

  const allRecipeNames = new Set(RecipeBook.map((r) => normalizeSourceName(r.name)));
  const targetSourceNames = new Set<string>([
    ...sourceNames,
    ...sourceDetailNames,
    normalizedResultName,
    ...sourceDetails.map((d) => normalizeSourceName(d.sourceName)),
  ]);
  for (const recipe of RecipeBook) {
    const requiredSourceLower = recipe.requiredSources.map((name) => name.toLowerCase());
    const optionalSourceLower = (recipe.optionalSources || []).map((name) => name.toLowerCase());

    const hasSources = requiredSourceLower.every((name) => targetSourceNames.has(name));
    if (!hasSources) continue;

    const uniqueResultSources = Array.from(new Set(sourceNames));
    const allowedSources = recipe.allowExtras
      ? uniqueResultSources
      : Array.from(new Set([...requiredSourceLower, ...optionalSourceLower]));

    if (!recipe.allowExtras) {
      const extrasPass = uniqueResultSources.every((name) => {
        if (allowedSources.includes(name)) return true;
        if (allRecipeNames.has(name)) return true;
        if (name === (result.name || "").toLowerCase()) return true;
        const derivedPrefixes = ["mixed ", "heated ", "infused ", "distilled ", "filtered ", "fermented ", "ground "]; 
        if (derivedPrefixes.some((prefix) => name.startsWith(prefix))) return true;
        return false;
      });
      if (!extrasPass) continue;
    }

    if (recipe.requiredTags) {
      const tagSet = new Set((result.tags || []).map((t) => t.toLowerCase()));
      const hasTags = recipe.requiredTags.every((tag) => tagSet.has(tag.toLowerCase()));
      if (!hasTags) continue;
    }

    if (recipe.requiredTagSources) {
      let tagSourceOK = true;
      for (const requirement of recipe.requiredTagSources) {
        const normalizedReqSource = normalizeSourceName(requirement.source);
        const sourceDetail = sourceDetails.find(
          (d) => normalizeSourceName(d.sourceName) === normalizedReqSource
        );
        if (!sourceDetail || !sourceDetail.tags.includes(requirement.tag)) {
          tagSourceOK = false;
          break;
        }
      }
      if (!tagSourceOK) continue;
    }

    if (recipe.requiredRatios && result.sourceContributions) {
      const total = Object.values(result.sourceContributions).reduce(
        (acc, value) => acc + value,
        0
      );
      let ratioOK = true;
      for (const [src, range] of Object.entries(recipe.requiredRatios)) {
        const value = result.sourceContributions[src] ?? 0;
        const pct = total > 0 ? (value / total) * 100 : 0;
        if (pct < range.min || pct > range.max) {
          ratioOK = false;
          break;
        }
      }
      if (!ratioOK) continue;
    }

    if (
      recipe.requiredMinTemperature !== undefined &&
      (result.properties.temperature ?? 0) < recipe.requiredMinTemperature
    ) {
      continue;
    }

    return recipe.name;
  }

  return null;
}
