import { Handle, Position, useUpdateNodeInternals } from "reactflow";
import { useEffect, useMemo } from "react";
import type { Ingredient } from "../../../core/types/types";
import type { ActionRendererProps } from "./types";
import { getIngredientComposition, hasContinuousLiquidPhase } from "../../../core/helper/physicalState";

/**
 * Dynamic Mix Node Renderer
 * Changes appearance based on input types and combines them visually
 */
export function MixActionRenderer({ id, definition, data }: ActionRendererProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const inputSlots = (data?.inputResults as Array<Ingredient | undefined> | undefined) || [];
  const connectedInputs = inputSlots.filter((i): i is Ingredient => !!i);

  const dynamicState = useMemo(() => {
    const hasLiquidInput = connectedInputs.some((input) => hasContinuousLiquidPhase(input));
    const hasDrySolidInput = connectedInputs.some((input) => {
      const composition = getIngredientComposition(input);
      return !hasContinuousLiquidPhase(input) && composition.undissolvedSolids > 0.55;
    });

    const states = connectedInputs.map((i) => i.state);
    const uniqueStates = Array.from(new Set(states));

    const stateEmoji: Record<string, string> = {
      solid: "◼",
      liquid: "◆",
      mixture: "◉",
      gas: "◈",
      plasma: "✦",
    };

    return {
      emoji: uniqueStates.map((s) => stateEmoji[s] || "?").join(""),
      label: hasLiquidInput && hasDrySolidInput
        ? "Dissolve"
        : hasLiquidInput
          ? "Mix"
          : connectedInputs.length > 0
            ? "Dry Blend"
            : "Mix",
    };
  }, [connectedInputs]);

  const dynamicColor = useMemo(() => {
    if (connectedInputs.length === 0) return "#6b4423";
    if (connectedInputs.length === 1) return connectedInputs[0].color || "#8d6e4d";

    // Blend colors from inputs
    const parse = (hex: string) => {
      if (hex.startsWith("rgb")) {
        const parts = hex
          .replace(/[rgba() ]/g, "")
          .split(",")
          .map((n) => Number(n));
        return [parts[0], parts[1], parts[2]];
      }
      const c = hex.replace("#", "");
      const bigint = parseInt(c, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const total = connectedInputs.reduce((acc) => acc + 1, 0);
    const blended = connectedInputs.reduce((acc, item) => {
      const col = item.color ? parse(item.color) : [200, 150, 100];
      return [
        acc[0] + col[0],
        acc[1] + col[1],
        acc[2] + col[2],
      ];
    }, [0, 0, 0]);

    const rgb = blended.map((v: number) => Math.round(v / total));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }, [connectedInputs]);

  const inputSpec = definition.inputSpec ?? [];
  const outputSpec = definition.outputSpec ?? [{ id: "output", label: "Out" }];
  const lastFilledIndex = inputSlots.reduce(
    (max, slot, idx) => (slot ? idx : max),
    -1
  );
  const visibleCount = Math.min(inputSpec.length, Math.max(1, lastFilledIndex + 2));
  const visibleInputs = inputSpec
    .slice(0, visibleCount)
    .map((spec, idx) => ({ spec, idx }));
  const nextEmptyIndex = inputSlots.findIndex((slot) => !slot);
  const firstInputTop = 142;
  const inputRowGap = 22;
  const totalSlots = inputSpec.length;
  const outputTop = firstInputTop + Math.max(0, (totalSlots - 1) * inputRowGap * 0.5);
  const nodeHeight = firstInputTop + Math.max(1, totalSlots) * inputRowGap + 24;

  useEffect(() => {
    // React Flow must recalculate dynamic handle coordinates when pin count changes.
    updateNodeInternals(id);
  }, [id, visibleCount, updateNodeInternals]);

  return (
    <div
      style={{
        width: 160,
        height: nodeHeight,
        padding: 10,
        background: "linear-gradient(180deg, #3a2f27 0%, #2a2017 100%)",
        borderRadius: 12,
        textAlign: "center",
        color: "#f4e8cf",
        border: "2px solid #8d6e4d",
        boxShadow: "0 0 12px rgba(100, 70, 40, 0.5)",
        position: "relative",
        overflow: "visible",
      }}
    >

      {/* Header */}
      <div
        style={{
          marginBottom: 8,
          fontWeight: "bold",
          fontSize: 13,
          position: "relative",
          zIndex: 3,
        }}
      >
        {dynamicState.label}
      </div>

      {/* State emoji / indicator */}
      <div
        style={{
          fontSize: 24,
          marginBottom: 8,
          position: "relative",
          zIndex: 3,
          letterSpacing: "2px",
        }}
      >
        {dynamicState.emoji}
      </div>

      {/* Visual mixing display */}
      <div
        style={{
          height: 60,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${dynamicColor}, #fff)`,
          border: "1px solid #8d724a",
          marginBottom: 8,
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* Swirling ingredients animation */}
        {connectedInputs.length > 0 && (
          <>
            <div
              style={{
                position: "absolute",
                width: "20%",
                height: "20%",
                borderRadius: "50%",
                background: connectedInputs[0]?.color || "#fff",
                opacity: 0.6,
                animation: "swirl 3s ease-in-out infinite",
              }}
            />
            {connectedInputs[1] && (
              <div
                style={{
                  position: "absolute",
                  width: "18%",
                  height: "18%",
                  borderRadius: "50%",
                  background: connectedInputs[1].color || "#fff",
                  opacity: 0.5,
                  animation: "swirl 4s ease-in-out infinite reverse",
                  right: 0,
                  bottom: 0,
                }}
              />
            )}
            {connectedInputs[2] && (
              <div
                style={{
                  position: "absolute",
                  width: "16%",
                  height: "16%",
                  borderRadius: "50%",
                  background: connectedInputs[2].color || "#fff",
                  opacity: 0.4,
                  animation: "swirl 3.5s ease-in-out infinite",
                  bottom: 0,
                  left: "50%",
                }}
              />
            )}
          </>
        )}
        {/* Ingredient count indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 6,
            fontSize: 11,
            padding: "1px 4px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: 3,
            color: "#f4e8cf",
            zIndex: 10,
          }}
        >
          {connectedInputs.length} ingredients
        </div>
      </div>

      {/* Input labels */}
      <div
        style={{
          position: "absolute",
          top: firstInputTop - 10,
          left: 16,
          right: 12,
          height: visibleCount * inputRowGap,
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          textAlign: "left",
          fontSize: 10,
          color: "#d8c398",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {visibleInputs.map(({ spec, idx }) => {
          return (
            <div
              key={spec.id}
              style={{
                display: "flex",
                alignItems: "center",
                height: inputRowGap,
                minHeight: inputRowGap,
              }}
            >
              <div style={{ width: 18, marginRight: 6 }} />
              <span
                style={{
                  fontSize: 9,
                  lineHeight: `${inputRowGap}px`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {inputSlots[idx]
                  ? inputSlots[idx]!.name
                  : `Input ${idx + 1}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input handles with true per-row hitboxes */}
      {visibleInputs.map(({ spec, idx }, rowIndex) => (
        <Handle
          key={spec.id}
          type="target"
          position={Position.Left}
          id={spec.id}
          className={`mix-input-handle mix-input-handle-${rowIndex}`}
          isConnectable={!inputSlots[idx]}
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border:
              idx === nextEmptyIndex && !inputSlots[idx]
                ? "2px solid #9afc8f"
                : "2px solid #d3b27a",
            background: inputSlots[idx]
              ? inputSlots[idx]!.color || "#201b16"
              : "#201b16",
            boxShadow: inputSlots[idx]
              ? `0 0 8px ${inputSlots[idx]!.color || "#7dd3fc"}`
              : idx === nextEmptyIndex
                ? "0 0 12px rgba(154,252,143,0.9)"
                : "0 0 8px rgba(125,211,252,0.5)",
            cursor: "crosshair",
            transition: "all 0.2s ease",
            top: firstInputTop + rowIndex * inputRowGap,
            left: -8,
            zIndex: 6,
          }}
        />
      ))}

      {/* Output handle */}
      {outputSpec.map((outSpec) => (
        <Handle
          key={outSpec.id}
          type="source"
          position={Position.Right}
          id={outSpec.id}
          className="mix-output-handle"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid #d3b27a",
            background: dynamicColor,
            boxShadow: `0 0 8px ${dynamicColor}`,
            top: outputTop,
            right: -8,
            zIndex: 6,
          }}
        />
      ))}
    </div>
  );
}
