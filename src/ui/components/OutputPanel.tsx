// --- ui/components/OutputPanel.tsx ---

import type { Ingredient } from "../../core/types/types";
import { getDisplayName, liquidTraits, temperatureGlow, qualityLabel, formatAmount } from "../helper/display";

function OutputPanel({ result, show }: { result: Ingredient | null; show: boolean }) {
  const containerStyle: React.CSSProperties = {
    width: 320,
    background:
      "radial-gradient(circle at top right, rgba(125,211,252,0.16), rgba(0,0,0,0) 45%), linear-gradient(180deg, #1f1a16 0%, #171310 100%)",
    borderLeft: "1px solid #3a3127",
    padding: 14,
    overflowY: "auto",
    color: "#f4e8cf",
  };

  if (!show || !result) {
    return (
      <div style={containerStyle}>
        <h3 style={{ marginTop: 0 }}>Output Inspector</h3>
        <p style={{ fontSize: 12, color: "#c3ad84" }}>
          Drop ingredients + action nodes, connect to Output node to see final potion.
        </p>
      </div>
    );
  }

  const sweetness = result.properties.sweetness ?? 0;
  const temperature = result.temperature ?? result.properties.temperature ?? 0;
  const name = getDisplayName(result);
  const quality = result.quality;
  const outputColor =
    result.color ||
    `rgb(${Math.round(255 - sweetness * 2)}, ${Math.round(255 - sweetness)}, ${Math.round(255)})`;
  const traits = liquidTraits(result);
  const sourceEntries = Object.entries(result.sourceContributions ?? {});
  const sourceTotal = sourceEntries.reduce((acc, [, value]) => acc + value, 0) || 1;
  const hot = temperature > 85;
  const cold = temperature < 5;

  return (
    <div style={containerStyle}>
      <h3 style={{ marginTop: 0 }}>Output Inspector</h3>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 10 }}>
        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${outputColor}, #fff)`,
            boxShadow: temperatureGlow(temperature),
            animation: "pulse 2s ease-in-out infinite",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              animation: "swirl 8s linear infinite",
            }}
          />
          {hot ? (
            <div
              style={{
                position: "absolute",
                inset: "-6px",
                borderRadius: "50%",
                border: "2px dashed rgba(255,170,120,0.6)",
                animation: "steamRise 1.6s ease-in-out infinite",
              }}
            />
          ) : null}
          {cold ? (
            <div
              style={{
                position: "absolute",
                inset: 8,
                borderRadius: "50%",
                border: "1px solid rgba(200, 240, 255, 0.8)",
                boxShadow: "0 0 10px rgba(160,220,255,0.8)",
              }}
            />
          ) : null}
        </div>
        <div>
          <div style={{ fontWeight: "bold", fontSize: 15 }}>{name}</div>
          <div style={{ fontSize: 12, color: "#d7bf93" }}>
            Quality: {qualityLabel(quality)} ({quality.toFixed(0)}%)
          </div>
          <div style={{ fontSize: 12, color: "#d7bf93" }}>State: {result.state}</div>
        </div>
      </div>

      <div style={statGridStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Temperature</div>
          <div style={{ ...statValueStyle, color: temperature > 90 ? "#fca5a5" : "#7dd3fc" }}>
            {temperature.toFixed(1)}°C
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Amount</div>
          <div style={statValueStyle}>{formatAmount(result.amount, result.state)}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Sweetness</div>
          <div style={statValueStyle}>{sweetness.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong style={{ color: "#dfc99d" }}>Traits</strong>
        <ul style={{ margin: 4, paddingLeft: 20 }}>
          {traits.map((trait) => (
            <li key={trait}>{trait}</li>
          ))}
        </ul>
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <strong style={{ color: "#dfc99d" }}>Tags:</strong>{" "}
          {(result.tags || []).length === 0
            ? "none"
            : (result.tags || []).map((tag) => (
                <span key={tag} style={tagPillStyle}>
                  {tag}
                </span>
              ))}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <strong style={{ color: "#dfc99d" }}>Sources</strong>
        <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
          {sourceEntries.length === 0 ? (
            <div style={{ color: "#b6a079", fontSize: 12 }}>No source breakdown</div>
          ) : (
            sourceEntries
              .sort((a, b) => b[1] - a[1])
              .map(([source, amount]) => {
                const percentage = (amount / sourceTotal) * 100;
                return (
                  <div key={source} style={sourceRowStyle}>
                    <div style={{ fontSize: 12 }}>{source}</div>
                    <div style={{ fontSize: 12, color: "#c8b088" }}>
                      {amount.toFixed(1)} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

const statGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const statCardStyle: React.CSSProperties = {
  border: "1px solid #57472f",
  borderRadius: 8,
  padding: 8,
  background: "rgba(25, 20, 16, 0.7)",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#baa27a",
};

const statValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#f4e8cf",
};

const sourceRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  border: "1px solid #57472f",
  borderRadius: 8,
  background: "rgba(25, 20, 16, 0.7)",
  padding: "6px 8px",
};

const tagPillStyle: React.CSSProperties = {
  display: "inline-block",
  marginRight: 6,
  marginTop: 4,
  border: "1px solid #6b5537",
  borderRadius: 999,
  padding: "2px 8px",
  color: "#ebd6b0",
  background: "rgba(201, 169, 110, 0.18)",
};

// --- EXPORT IT ---
export default OutputPanel;