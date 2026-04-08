import { Handle, Position } from "reactflow";
import type { ActionRendererProps } from "./types";

export function BurnerActionRenderer({ definition, data, params, onParamChange }: ActionRendererProps) {
  const inputSpec = definition.inputSpec ?? [];
  const outputSpec = definition.outputSpec ?? [{ id: "output", label: "Out" }];
  const powerSpec = definition.paramSpec?.find((p) => p.id === "power");
  const power = params.power ?? powerSpec?.default ?? 0;

  const liveBurnerTemperature = data.liveBurnerTemperature ?? 25;
  const liveIngredientTemperature = data.liveTemperature ?? 25;
  const heatIntensity = Math.max(0, Math.min(1, (liveBurnerTemperature - 25) / 200));
  const gaugeAngle = -130 + heatIntensity * 260;

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
        padding: 12,
        background: "linear-gradient(180deg, #f0e5cf 0%, #cab289 100%)",
        borderRadius: 16,
        minWidth: 210,
        border: "2px solid #5d4a2f",
        boxShadow: "0 12px 20px rgba(45, 27, 4, 0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 700, color: "#3b2a13" }}>
        {definition.emoji} {definition.name}
      </div>

      {inputSpec.map((spec, idx) => (
        <Handle
          key={spec.id}
          type="target"
          position={Position.Left}
          id={spec.id}
          style={{ ...handleStyle, top: 28 + idx * 18 }}
        />
      ))}

      <div
        style={{
          width: 132,
          height: 68,
          margin: "4px auto 10px",
          borderRadius: "0 0 65px 65px",
          background: "linear-gradient(180deg, #2d2b34 0%, #16141d 100%)",
          border: "2px solid #8f836b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            width: 68,
            height: 32,
            borderRadius: "50% 50% 45% 45%",
            background: `radial-gradient(circle at 50% 80%, rgba(255,140,20,${0.45 + heatIntensity * 0.5}) 0%, rgba(255,80,0,${0.2 + heatIntensity * 0.5}) 48%, rgba(255,40,0,0) 78%)`,
            filter: `blur(${1 + heatIntensity * 5}px)`,
            animation: "burnerFlicker 900ms ease-in-out infinite",
            opacity: 0.2 + heatIntensity * 0.9,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            border: "3px solid #7a6748",
            background: "radial-gradient(circle at 50% 38%, #fff6e7 0%, #dcc7a3 68%, #c2a77e 100%)",
            position: "relative",
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 2,
              height: 32,
              background: "#2f2313",
              transformOrigin: "50% 100%",
              transform: `translate(-50%, -100%) rotate(${gaugeAngle}deg)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "#2f2313",
            }}
          >
            {Math.round(liveBurnerTemperature)}
          </div>
        </div>

        <div style={{ width: 34, position: "relative", paddingTop: 2 }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 2,
              bottom: 2,
              width: 6,
              transform: "translateX(-50%)",
              borderRadius: 999,
              background: "repeating-linear-gradient(180deg, #7c613b 0px, #7c613b 2px, #92724a 2px, #92724a 6px)",
            }}
          />
          <input
            className="nodrag nowheel"
            type="range"
            min={powerSpec?.min ?? 0}
            max={powerSpec?.max ?? 10}
            step={0.1}
            value={power}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onParamChange("power", Number(e.target.value))}
            style={{
              writingMode: "vertical-lr",
              width: 34,
              height: 96,
              appearance: "none",
              background: "transparent",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: "#3b2a13" }}>
        Ingredient Temp: {liveIngredientTemperature.toFixed(1)}°C
      </div>
      <div style={{ marginTop: 2, fontSize: 11, color: "#3b2a13" }}>
        Rope Power: {power.toFixed(1)}
      </div>

      {outputSpec.map((out, idx) => (
        <Handle
          key={out.id}
          type="source"
          position={Position.Right}
          id={out.id}
          style={{ ...handleStyle, top: 32 + idx * 18 }}
        />
      ))}
    </div>
  );
}
