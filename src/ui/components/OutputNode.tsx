
import { Handle, Position, type NodeProps } from "reactflow";
import type { Ingredient } from "../../core/types/types";
import { sweetnessColor, temperatureGlow } from "../helper/display";

interface OutputNodeData {
  result?: Ingredient | null;
}

// --- Custom Output Node ---
function OutputNode({ data }: NodeProps<OutputNodeData>) {
  const result = data?.result;
  const temp = result?.properties?.temperature ?? 20;
  const color = result?.color || (result ? sweetnessColor(result.properties.sweetness ?? 0) : "#aaa");

  return (
    <div
      style={{
        width: 170,
        height: 160,
        padding: 10,
        background: "linear-gradient(180deg, #2f2822 0%, #241f1a 100%)",
        borderRadius: 12,
        textAlign: "center",
        fontWeight: "bold",
        color: "#f4e8cf",
        border: "2px solid #b8935f",
        boxShadow: temperatureGlow(temp),
      }}
    >
      <div style={{ marginBottom: 6 }}>🧪 Output</div>
      <div
        style={{
          width: 96,
          height: 96,
          margin: "0 auto",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${color}, #fff)`,
          animation: "pulse 1.2s ease-in-out infinite",
          boxShadow: `0 0 18px rgba(255,255,255,0.7)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            animation: "swirl 6s linear infinite",
          }}
        />
      </div>

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
    </div>
  );
}

export default OutputNode;