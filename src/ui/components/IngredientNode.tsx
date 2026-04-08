import { useState, useEffect, memo } from "react";
import type { ChangeEvent } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

import type { Ingredient } from "../../core/types/types";

// --- Types ---

export type IngredientNodeData = {
  label: string;
  emoji?: string;
  ingredient?: Ingredient;
  onIngredientAmountChange?: (amount: number) => void;
};

// --- Component ---

function IngredientNode({ data }: NodeProps<IngredientNodeData>) {
  const [localAmount, setLocalAmount] = useState<string>(
    String(data.ingredient?.amount ?? 0)
  );

  // Sync external changes → local state
  useEffect(() => {
    setLocalAmount(String(data.ingredient?.amount ?? 0));
  }, [data.ingredient?.amount]);

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalAmount(value);

    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      data.onIngredientAmountChange?.(parsed);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        {data.emoji ?? "🌿"} {data.label}
      </div>

      <div style={tagsStyle}>
        tags: {(data.ingredient?.tags ?? []).join(" | ")}
      </div>

      <div style={inputWrapperStyle}>
        <label style={labelStyle}>Amount (g/ml):</label>
        <input
          className="nodrag nowheel"
          type="number"
          value={localAmount}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={handleAmountChange}
          style={inputStyle}
          min={0}
          step={1}
        />
      </div>

      <Handle type="source" position={Position.Right} id="output" style={handleStyle} />
    </div>
  );
}

// --- Styles (keep simple or replace with CSS later) ---

const containerStyle: React.CSSProperties = {
  padding: 10,
  background: "linear-gradient(180deg, #2f2822 0%, #241f1a 100%)",
  borderRadius: 10,
  minWidth: 190,
  border: "1px solid #70593d",
  color: "#f4e8cf",
  boxShadow: "0 8px 16px rgba(0,0,0,0.26)",
};

const titleStyle: React.CSSProperties = {
  marginBottom: 8,
  fontWeight: "bold",
};

const tagsStyle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: 12,
  color: "#ceb58a",
};

const inputWrapperStyle: React.CSSProperties = {
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 4,
  borderRadius: 4,
  border: "1px solid #7c6345",
  background: "#1a1511",
  color: "#f4e8cf",
  boxSizing: "border-box",
};

const handleStyle: React.CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: "2px solid #d3b27a",
  background: "#201b16",
  boxShadow: "0 0 8px rgba(125,211,252,0.5)",
};

// --- Export (memo for performance in ReactFlow) ---
export default memo(IngredientNode);