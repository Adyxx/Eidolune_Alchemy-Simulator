// types.ts
export type MatterState =
  | "solid"
  | "liquid"
  | "mixture"
  | "gas"
  | "plasma";

export interface NumericRange {
  min?: number;
  max?: number;
}

export type MatterBehavior =
  | "fluid"
  | "syrup"
  | "slurry"
  | "paste"
  | "gel"
  | "solid";

export interface IngredientComposition {
  liquidPhase: number;
  dissolvedSolids: number;
  undissolvedSolids: number;
}

export interface SourceDetail {
  sourceName: string;
  tags: string[];
}

export interface Reaction {
  id: string;

  type: "temporary" | "permanent";

  conditions: {
    minTemp?: number;
    maxTemp?: number;
    requiredState?: MatterState;
    requiredTags?: string[];

    minTimeAboveTemp?: number;
    maxRiseRate?: number;
  };

  effects: {
    addTags?: string[];
    removeTags?: string[];
    setState?: MatterState;
    namePrefix?: string;
  };
}

export interface Ingredient {
  id: string;

  name: string;
  amount: number;        // grams / ml
  quality: number;       // 0–100

  // 🔥 CORE SIMULATION
  state: MatterState;
  viscosity: number; // 0 = fully fluid, 1 = fully solid
  temperature: number;
  behavior?: MatterBehavior;
  composition?: IngredientComposition;
  solubility?: number; // 0..1 dissolution tendency in available liquid phase

  // 🧪 SEMANTICS (non-physical traits)
  tags: string[];        // plant, toxic, magical...

  // ⚙️ NUMERICAL PROPERTIES
  properties: Record<string, number>; // sweetness, acidity, etc.

  // 🔥 THERMAL BEHAVIOR
  thermal: {
    conductivity: number; // how fast it matches environment
    capacity: number;     // resistance to change (later use)
  };

  // 🧠 REACTIONS (IMPORTANT)
  reactions?: Reaction[];

  // 🎨 VISUALS
  color?: string;
  colorEffectiveness?: number;
  emoji?: string;

  // 🧬 LINEAGE 
  sourceNames?: string[];
  sourceDetails?: SourceDetail[];
  sourceContributions?: Record<string, number>;

    // optional internal simulation memory
  _heatMemory?: {
    timeAboveThresholds: Record<number, number>;
    burnerTemperature?: number;
    lastTemperature?: number;
    lastRiseRate?: number;
    appliedReactions?: Record<string, boolean>;
    temporarySnapshots?: Record<
      string,
      {
        baseState?: MatterState;
        addedTags?: string[];
        namePrefix?: string;
      }
    >;
  };

}

export interface ActionInputSpec {
  id: string;

  allowedStates?: MatterState[];
  allowedTags?: string[];
  minViscosity?: number;
  maxViscosity?: number;
  minTemperature?: number;
  maxTemperature?: number;
  propertyConstraints?: Record<string, NumericRange>;

  optional?: boolean;
}

export interface ActionOutputSpec {
  id: string;
  label: string;
}

export interface ActionContext {
  deltaTime: number;
  elapsedTime?: number;
  ambientTemperature?: number;
  previousOutput?: Ingredient;
}

export interface ActionLogic {
  id: string;

  apply: (
    inputs: Ingredient[],
    params?: Record<string, number>,
    context?: ActionContext
  ) => Ingredient;
}

export interface ActionNodeParamSpec {
  id: string;
  label: string;
  min: number;
  max: number;
  default: number;
}

export type ActionNodeUiVariant = "default" | "burner" | "mix";

export interface ActionNodeUiSpec {
  variant?: ActionNodeUiVariant;
  color?: string;
}

export interface ActionNodeDefinition {
  id: string;
  name: string;
  emoji: string;
  inputSpec: ActionInputSpec[];
  outputSpec?: ActionOutputSpec[];
  paramSpec?: ActionNodeParamSpec[];
  validate?: (inputs: Ingredient[]) => boolean;
  ui?: ActionNodeUiSpec;
  logic: ActionLogic;
}


