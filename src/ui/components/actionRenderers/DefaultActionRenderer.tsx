import { Handle, Position } from "reactflow";
import type { ActionRendererProps } from "./types";

export function DefaultActionRenderer({ definition, params, onParamChange }: ActionRendererProps) {
  const inputSpec = definition.inputSpec ?? [];
  const outputSpec = definition.outputSpec ?? [{ id: "output", label: "Out" }];

  const handleStyle: React.CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid #d3b27a",
    background: "#201b16",
    boxShadow: "0 0 8px rgba(125,211,252,0.5)",
  };

  return (
    <div
      style={{
        padding: 10,
        background: "linear-gradient(180deg, #2f2822 0%, #241f1a 100%)",
        borderRadius: 10,
        textAlign: "center",
        minWidth: 180,
        border: "1px solid #70593d",
        color: "#f4e8cf",
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: "bold" }}>
        {definition.emoji} {definition.name}
      </div>

      <div style={{ marginBottom: 8, fontSize: 11, color: "#ceb58a" }}>
        {inputSpec.map((spec) => spec.id).join(" + ") || "step"}
      </div>

      {inputSpec.map((spec, idx) => (
        <Handle
          key={spec.id}
          type="target"
          position={Position.Left}
          id={spec.id}
          style={{ ...handleStyle, top: 20 + idx * 18 }}
        />
      ))}

      {definition.paramSpec?.map((param) => (
        <div key={param.id} style={{ margin: "6px 0" }}>
          <label style={{ fontSize: 12 }}>
            {param.label}: {params[param.id] ?? param.default}
          </label>
          <input
            className="nodrag nowheel"
            type="range"
            min={param.min}
            max={param.max}
            step={0.1}
            value={params[param.id] ?? param.default}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onParamChange(param.id, Number(e.target.value))}
            style={{ width: "100%", accentColor: "#c9a96e" }}
          />
        </div>
      ))}

      {outputSpec.map((out, idx) => (
        <Handle
          key={out.id}
          type="source"
          position={Position.Right}
          id={out.id}
          style={{ ...handleStyle, top: 22 + idx * 18 }}
        />
      ))}
    </div>
  );
}
