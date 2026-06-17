

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
  },
  {
    name: "Tea",
    requiredSources: ["Water", "Moonleaf"],
    requiredTagSources: [
      { source: "Water", tag: "boiling" }
    ],
    requiredRatios: {
      Water: { min: 70, max: 99 },
      Moonleaf: { min: 1, max: 30 },
    },
    allowExtras: false,
    description: "Infuse Moonleaf in boiling water to make tea.",
  },
  {
    name: "Alchemical Base I",
    requiredSources: ["Water", "Moonleaf", "Sugar"],
    requiredRatios: {
      Water: { min: 50, max: 95 },
      Moonleaf: { min: 1, max: 20 },
      Sugar: { min: 1, max: 30 },
    },
    allowExtras: false,
    description: "A simple alchemical base created from plant matter and solvent.",
  },
  {
    name: "Minor Healing Potion",
    requiredSources: ["Alchemical Base I", "Moonleaf"],
    requiredRatios: {
      "Alchemical Base I": { min: 60, max: 99 },
      Moonleaf: { min: 1, max: 15 },
    },
    allowExtras: true,
    description: "A simple restorative potion made from a basic alchemical base and herbs.",
  },

];
