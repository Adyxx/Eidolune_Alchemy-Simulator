import { useMemo, useState, type DragEvent } from "react";

import { IngredientsList } from "../../data/ingredients";
import { ActionsList } from "../../nodes"; // or "systems" depending on your final choice
import type { Ingredient } from "../../core/types/types";

// --- Types ---

type DraggableItemProps = {
  type: string;
  label: string;
  emoji: string;
  color?: string;
  subtitle?: string;
};

// --- Small internal component ---

function DraggableItem({ type, label, emoji, color, subtitle }: DraggableItemProps) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("label", label);
    e.dataTransfer.setData("emoji", emoji);
  };

  return (
    <div draggable onDragStart={handleDragStart} style={itemStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={vialStyle(color)}>
          <div style={vialLiquidStyle(color)} />
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 700, color: "#f5e6c8", fontSize: 13 }}>
            {emoji} {label}
          </div>
          {subtitle ? (
            <div style={{ color: "#b8a88d", fontSize: 11 }}>{subtitle}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// --- Main component ---

function Sidebar() {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const ingredients = useMemo(
    () => Object.entries(IngredientsList) as [string, Ingredient][],
    []
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    ingredients.forEach(([, ingredient]) => {
      ingredient.tags.forEach((tag) => tags.add(tag));
      tags.add(ingredient.state);
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return ingredients.filter(([, ingredient]) => {
      const searchOk =
        lowered.length === 0 ||
        ingredient.name.toLowerCase().includes(lowered) ||
        ingredient.tags.some((tag) => tag.toLowerCase().includes(lowered));

      const tags = [...ingredient.tags, ingredient.state];
      const tagsOk = selectedTags.every((tag) => tags.includes(tag));

      return searchOk && tagsOk;
    });
  }, [ingredients, query, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((entry) => entry !== tag)
        : [...current, tag]
    );
  };

  return (
    <div style={sidebarStyle}>
      <div style={titleStyle}>Ingredients</div>
      <input
        className="nodrag nowheel"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ingredients or tags"
        style={searchStyle}
      />

      <div style={tagWrapStyle}>
        {allTags.map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              style={tagStyle(active)}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {filteredIngredients.map(([key, ingredient]) => (
        <DraggableItem
          key={key}
          type="ingredient"
          label={ingredient.name}
          emoji={ingredient.emoji ?? "🧪"}
          color={ingredient.color}
          subtitle={`${ingredient.state} | ${ingredient.tags.join(" • ")}`}
        />
      ))}

      <div style={sectionTitleStyle}>Actions</div>
      {Object.entries(ActionsList).map(([key, actionData]) => (
        <DraggableItem
          key={key}
          type="action"
          label={actionData.name}
          emoji={actionData.emoji}
          subtitle="Alchemical process"
        />
      ))}

      <div style={sectionTitleStyle}>Preview</div>
      <DraggableItem type="preview" label="Preview" emoji="🔮" subtitle="Live intermediate result" />
    </div>
  );
}

export default Sidebar;

// --- Styles ---

const sidebarStyle: React.CSSProperties = {
  width: 260,
  background:
    "radial-gradient(circle at top, rgba(201,169,110,0.16), rgba(0,0,0,0) 55%), linear-gradient(180deg, #221e1a 0%, #171310 100%)",
  borderRight: "1px solid #3a3127",
  padding: 12,
  overflowY: "auto",
};

const itemStyle: React.CSSProperties = {
  padding: 8,
  marginBottom: 8,
  cursor: "grab",
  borderRadius: 10,
  border: "1px solid #5e4c32",
  background: "linear-gradient(180deg, #2f2822 0%, #241f1a 100%)",
  boxShadow: "0 6px 12px rgba(0, 0, 0, 0.22)",
};

const titleStyle: React.CSSProperties = {
  color: "#f5e6c8",
  fontSize: 18,
  fontWeight: 700,
  textAlign: "left",
  marginBottom: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 14,
  marginBottom: 8,
  color: "#d8c398",
  fontSize: 14,
  fontWeight: 700,
  textAlign: "left",
};

const searchStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #70553b",
  background: "#191512",
  color: "#f5e6c8",
  padding: "8px 10px",
  marginBottom: 10,
};

const tagWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 10,
};

const tagStyle = (active: boolean): React.CSSProperties => ({
  border: `1px solid ${active ? "#c9a96e" : "#5f4d34"}`,
  background: active ? "rgba(201, 169, 110, 0.2)" : "rgba(50, 40, 30, 0.7)",
  color: active ? "#fbe3b9" : "#baa27a",
  fontSize: 11,
  borderRadius: 999,
  padding: "4px 8px",
  cursor: "pointer",
});

const vialStyle = (color?: string): React.CSSProperties => ({
  width: 18,
  height: 24,
  borderRadius: 6,
  border: "1px solid #9a845d",
  background: "rgba(255,255,255,0.05)",
  boxShadow: `0 0 10px ${color ?? "rgba(201,169,110,0.4)"}`,
  display: "flex",
  alignItems: "flex-end",
  overflow: "hidden",
});

const vialLiquidStyle = (color?: string): React.CSSProperties => ({
  width: "100%",
  height: "54%",
  background: color ?? "#7dd3fc",
  opacity: 0.9,
});