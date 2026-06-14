# Alchemy Simulator (Eidolune)

A React + TypeScript + Vite-based visual alchemy simulator for the Eidolune project. This repository implements a node-based mixing engine (React Flow) that models ingredients, actions (mix, heat, grind, distillate, +more in the future), and the emergent results of combining them. The simulation engine focuses on physical state, temperature, viscosity, and recipe recognition to collapse mixtures into named recipes when applicable.

---

## Quick Links
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`

---

## Purpose & Motivation
This project explores emergent combinatorial chemistry in a game/experimental environment. It is intended for:
- Prototyping alchemical mechanics for Eidolune.
- Modeling ingredient interactions (heat, mixing, grinding, distillation).
- Defining and validating recipes by tags/ratios/temperature.

---

## Key Features
- Visual node editor built with React + React Flow.
- Deterministic simulation engine (runSimulation) that resolves nodes until quiescence.
- Ingredient model with thermal, viscosity, tags, and source-tracking.
- Recipe recognition that "collapses" mixtures into named recipes when constraints match.
- Modular action nodes: mix, heat, grind, distillate, etc.
- Data-driven ingredients & recipes (see `src/data/*`).

---

## Architecture Overview
- src/core/engine.ts — main simulation loop. Processes nodes by type (ingredient, action, output/preview) and resolves outputs in iterative passes.
- src/core/helper/* — utilities for validation, physical state, recipe lookup, and ingredient creation.
- src/data/* — canonical ingredient definitions and recipe book.
- src/ui/* — React components that provide the node UI, preview, and controls.

Engine highlights:
- Iterative resolution: nodes run when upstream inputs are available.
- Validation: inputs are checked against action inputSpec and custom validators.
- Merge semantics: outputs merge tags, temperatures, source contributions, and preserve heat memory for temporal reactions.
- Collapse to recipe: mixtures are replaced with a single recipe-identified ingredient when a matching recipe is found.

---

## Data Models (summary)
Recipe (src/data/recipes/recipes.ts):
- name, requiredSources, optionalSources, requiredTags, requiredRatios, requiredMinTemperature, allowExtras, description.

Ingredient (in engine and types):
- name, amount, temperature, state, viscosity, tags, properties, thermal (capacity/conductivity), sourceNames, sourceDetails, sourceContributions, _heatMemory, color, quality.

---

## Example: a Recipe
Sweet Water (example in recipe book):
- required: Water + Sugar
- requiredRatios: Water 60–95, Sugar 5–40
- allowExtras: false

When a mixture satisfies recipe constraints, the engine collapses that mixture into the recipe name and records source contributions.

---

## Development
Requirements: Node 18+ (or matching environment used with Vite/TypeScript).

1. Install dependencies

   npm install

2. Run in dev mode

   npm run dev

3. Build for production

   npm run build

4. Preview a build

   npm run preview

5. Lint

   npm run lint

---

## Extending the Simulator
- Adding Ingredients: add a file under `src/data/ingredients/` exporting ingredient definitions and include them in `src/data/ingredients/index.ts`.
- Adding Recipes: append to `src/data/recipes/recipes.ts` using the Recipe shape (name, requiredSources, ratios, tags).
- Creating Action Nodes: implement a node definition with `inputSpec`, `outputSpec`, `validate` (optional), and `logic` that returns an Ingredient or { main, outputs }.

Important hooks are in `src/core/helper/*` to validate, sync physical state, and evaluate reactions.

---

## How Simulation Works (concise)
- The engine iterates up to a safety limit (100 iterations), scanning nodes.
- Ingredient nodes provide base results; action nodes compute outputs when inputs are ready and valid.
- Output/preview nodes merge inputs into a single Ingredient (preserving heat memory and calculating blended properties).
- After producing an Ingredient, `syncIngredientPhysicalState` and optional recipe collapse take place.

---

## Testing & Quality
- No dedicated test harness included yet; consider adding unit tests for core helpers (`physicalState`, `recipeUtils`, `reactionEvaluator`) and integration tests for `runSimulation`.
- Use `eslint` (configured) to keep code quality consistent.

---

## Roadmap
- Add comprehensive unit tests for engine invariants.
- Introduce deterministic reaction definitions and scheduling for long-running thermal reactions.
- Expand recipe language (regex-like tags, conditional rules, chainable reactions).
- Save/load graph states and support serialization for persistent experiments.

