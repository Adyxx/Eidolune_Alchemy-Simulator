import { useEffect, useState } from "react";
import type { NodeProps } from "reactflow";
import { BurnerActionRenderer, DefaultActionRenderer, MixActionRenderer } from "./actionRenderers";
import type { ActionNodeData } from "./actionRenderers";

interface ActionNodeProps extends NodeProps<ActionNodeData> {}

const ACTION_RENDERERS = {
  default: DefaultActionRenderer,
  burner: BurnerActionRenderer,
  mix: MixActionRenderer,
} as const;

export function ActionNode({ id, data }: ActionNodeProps) {
  const def = data.definition;
  if (!def) return null;

  const [params, setParams] = useState<Record<string, number>>(data.params || {});
  useEffect(() => {
    setParams(data.params || {});
  }, [data.params]);

  const handleParamChange = (key: string, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    data.onParamsChange?.(id, newParams);
  };

  const variant = def.ui?.variant ?? "default";
  const Renderer = ACTION_RENDERERS[variant] ?? DefaultActionRenderer;

  return (
    <Renderer
      id={id}
      data={data}
      definition={def}
      params={params}
      onParamChange={handleParamChange}
    />
  );
}

export default ActionNode;