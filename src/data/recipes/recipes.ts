

export interface RatioRange {
  min: number;
  max: number;
}

export interface Recipe {
  name: string;
  requiredSources: string[];
  optionalSources?: string[];
  requiredTags?: string[];
  requiredTagSources?: { source: string; tag: string }[];
  requiredRatios?: Record<string, RatioRange>;
  requiredMinTemperature?: number;
  allowExtras?: boolean; // when true, extra sources are allowed; when false, only required+optional sources allowed
  description?: string;
}

export const RecipeBook: Recipe[] = [
  {
    name: "Sweet Water",
    requiredSources: ["Water", "Sugar"],
    requiredRatios: {
      Water: { min: 60, max: 95 },
      Sugar: { min: 5, max: 40 },
    },
    allowExtras: false,
    description: "A balanced sugar dissolution in water.",
  }
];
