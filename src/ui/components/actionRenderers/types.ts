import type { ActionNodeDefinition, Ingredient } from "../../../core/types/types";

export interface ActionNodeData {
  definition?: ActionNodeDefinition;
  params?: Record<string, number>;
  onParamsChange?: (id: string, params: Record<string, number>) => void;
  liveTemperature?: number;
  liveBurnerTemperature?: number;
  inputResults?: Ingredient[];
}

export interface ActionRendererProps {
  id: string;
  data: ActionNodeData;
  definition: ActionNodeDefinition;
  params: Record<string, number>;
  onParamChange: (key: string, value: number) => void;
}
