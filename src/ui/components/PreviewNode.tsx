
import { Handle, Position, type NodeProps } from "reactflow";
import type { Ingredient } from "../../core/types/types";
import { getDisplayName, sweetnessColor, temperatureGlow } from "../helper/display";

interface PreviewNodeData {
  result?: Ingredient | null;
}

// --- Custom Preview Node ---
function PreviewNode({ data }: NodeProps<PreviewNodeData>) {
  const result = data?.result;
  const displayName = result ? getDisplayName(result) : "(no mixture yet)";
  const temp = result?.properties?.temperature ?? 20;
  const color = result?.color || (result ? sweetnessColor(result.properties.sweetness ?? 0) : "#ddd");

  return (
    <div
      style={{
        width: 180,
        padding: 10,
        background: "linear-gradient(180deg, #2f2822 0%, #241f1a 100%)",
        borderRadius: 10,
        textAlign: "center",
        color: "#f4e8cf",
        border: "2px dashed #8d724a",
        boxShadow: temperatureGlow(temp),
      }}
    >
      <div style={{ marginBottom: 6, fontWeight: "bold" }}>Preview</div>
      <div style={{ marginBottom: 8, fontSize: 13, color: "#e6d4b5" }}>{displayName}</div>
      <div
        style={{
          height: 64,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${color}, #fff)`,
          border: "1px solid #8d724a",
          marginBottom: 8,
        }}
      />
      <div style={{ fontSize: 12, color: "#d8c398" }}>Drag source connectors into this node</div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid #d3b27a",
          background: "#201b16",
          boxShadow: "0 0 8px rgba(125,211,252,0.5)",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid #d3b27a",
          background: "#201b16",
          boxShadow: "0 0 8px rgba(125,211,252,0.5)",
        }}
      />
    </div>
  );
}

export default PreviewNode;