// engine.ts
import type { Ingredient, ActionNodeDefinition } from "./types/types";
import type { Node, Edge } from "reactflow";
import { createIngredient } from "./helper/createIngredients";
import { findRecipeName } from "./helper/recipeUtils";
import { validateIngredientAgainstInputSpec } from "./helper/inputValidation";
import {
  deriveStateFromViscosity,
  getIngredientViscosity,
  syncIngredientPhysicalState,
} from "./helper/physicalState";

export interface SimulationOptions {
  deltaTime?: number;
  elapsedTime?: number;
  ambientTemperature?: number;
  previousResults?: Record<string, Ingredient>;
}

function collapseToRecipe(result: Ingredient): Ingredient {
  const recipeName = findRecipeName(result);
  if (!recipeName) return result;

  return {
    ...result,
    name: recipeName,

    // 🔥 FULL COLLAPSE
    sourceNames: [recipeName],

    sourceDetails: [
      {
        sourceName: recipeName,
        tags: result.tags || [],
      },
    ],

    sourceContributions: {
      [recipeName]: result.amount,
    },
  };
}

export function runSimulation(
  nodes: Node[],
  edges: Edge[],
  options: SimulationOptions = {}
): Record<string, Ingredient> {
  const results: Record<string, Ingredient> = {};
  const processed = new Set<string>();
  const previousResults = options.previousResults ?? {};
  const deltaTime = options.deltaTime ?? 0.1;
  const elapsedTime = options.elapsedTime ?? 0;
  const ambientTemperature = options.ambientTemperature ?? 25;

  const getInputEdges = (nodeId: string) => edges.filter((e) => e.target === nodeId);

  let iteration = 0;
  let progress = true;

  while (progress && iteration < 100) {
    iteration++;
    progress = false;

    for (const node of nodes) {
      if (processed.has(node.id)) continue;

      if (node.type === "ingredient") {
        const ingredient: Ingredient = { ...node.data.ingredient };
        if (ingredient) {
          const prev = previousResults[node.id];
          const temperature = prev?.temperature ?? ingredient.temperature;

          results[node.id] = {
            ...ingredient,
            temperature,
            properties: { ...ingredient.properties },
            tags: [...(ingredient.tags ?? [])],
            sourceNames: ingredient.sourceNames || [ingredient.name],
            sourceDetails: ingredient.sourceDetails || [
              { sourceName: ingredient.name, tags: [...ingredient.tags] },
            ],
            sourceContributions: {
              [ingredient.name]: ingredient.amount,
            },
          };
          syncIngredientPhysicalState(results[node.id]);
          processed.add(node.id);
          progress = true;
        }
        continue;
      }

      if (node.type === "action") {
        const def: ActionNodeDefinition = node.data.definition;
        if (!def) continue;

        const inputEdges = getInputEdges(node.id);

        const inputsBySpec = def.inputSpec.map((spec) => {
          const edge = inputEdges.find((e) => e.targetHandle === spec.id);
          if (!edge) return null;

          const sourceResult = results[edge.source];
          return sourceResult;
        });

        // ❗ required inputs missing
        const missingRequired = inputsBySpec.some((value, idx) => {
          const spec = def.inputSpec[idx];
          return value == null && spec.optional !== true;
        });

        if (missingRequired) continue;

        // ❗ still waiting for upstream nodes
        if (inputsBySpec.some((value) => value === undefined)) continue;

        const inputs = inputsBySpec.filter((i): i is Ingredient => !!i);

        // 🔍 Validation (state + tags)
        let valid = true;

        for (let i = 0; i < inputsBySpec.length; i++) {
          const spec = def.inputSpec[i];
          const input = inputsBySpec[i];

          if (!input) continue;

          if (!validateIngredientAgainstInputSpec(input, spec)) {
            valid = false;
            break;
          }
        }

        // 🔍 Custom validation hook
        if (valid && def.validate) {
          valid = def.validate(inputs);
        }

        if (!valid) {
          results[node.id] = {
            ...inputs[0],
            name: `${def.name} failed`,
            quality: 0,
          };
          syncIngredientPhysicalState(results[node.id]);
          processed.add(node.id);
          progress = true;
          continue;
        }

        try {
          const params = node.data.params || {};
          const outResult = def.logic.apply(inputs, params, {
            deltaTime,
            elapsedTime,
            ambientTemperature,
            previousOutput: previousResults[node.id],
          });

          let mainOut: Ingredient;
          let extraOutputs: Record<string, Ingredient> = {};

          if (
            typeof (outResult as any).main !== "undefined" &&
            (outResult as any).outputs
          ) {
            mainOut = (outResult as any).main;
            extraOutputs = (outResult as any).outputs;
          } else {
            mainOut = outResult as Ingredient;
          }

          const outputSpec = def.outputSpec || [{ id: "output", label: "Output" }];

          outputSpec.forEach((outSpec) => {
            const dest =
              outSpec.id === "output" ? node.id : `${node.id}:${outSpec.id}`;

            const ingredient =
              outSpec.id === "output"
                ? mainOut
                : extraOutputs[outSpec.id];

            if (!ingredient) return;

            syncIngredientPhysicalState(ingredient);

            results[dest] = ingredient;
          });

          processed.add(node.id);
          progress = true;
        } catch (error) {
          results[node.id] = createIngredient({
            name: `${def.name} error`,
          });

          processed.add(node.id);
          progress = true;
        }

        continue;
      }
      if (node.type === "output" || node.type === "preview") {
        const inputEdges = getInputEdges(node.id);
        if (!inputEdges.length) continue;

        const inputResults = inputEdges
          .map((e) => {
            const key = e.sourceHandle ? `${e.source}:${e.sourceHandle}` : e.source;
            return results[key] || results[e.source];
          })
          .filter((maybe): maybe is Ingredient => maybe !== undefined);

        if (inputResults.length !== inputEdges.length) continue;

        const totalAmount = inputResults.reduce((acc, item) => acc + (item.amount || 0), 0);
        if (totalAmount === 0) continue;

        const mergedTags = Array.from(
          new Set(inputResults.flatMap((item) => item.tags || []))
        );

        const baseName =
          inputResults.length === 1
            ? inputResults[0].name
            : `Mixed ${Array.from(new Set(inputResults.map((item) => item.name))).join(", ")}`;

        const mergedSourceDetails = Array.from(
          new Map(
            inputResults
              .flatMap((item) =>
                item.sourceDetails && item.sourceDetails.length > 0
                  ? item.sourceDetails
                  : [{ sourceName: item.name, tags: item.tags || [] }]
              )
              .map((detail) => [detail.sourceName.toLowerCase(), detail])
          ).values()
        );

        const mergedSourceContributions: Record<string, number> = {};
        inputResults.forEach((item) => {
          if (item.sourceContributions) {
            Object.entries(item.sourceContributions).forEach(([k, v]) => {
              mergedSourceContributions[k] = (mergedSourceContributions[k] || 0) + v;
            });
          } else {
            mergedSourceContributions[item.name] = (mergedSourceContributions[item.name] || 0) + item.amount;
          }
        });

        const totalThermalMass = inputResults.reduce(
          (acc, item) => acc + item.amount * (item.thermal?.capacity ?? 1),
          0
        );

        // 🔥 PRESERVE STATE from single input or determine from ingredients
        const mergedState = inputResults.length === 1
          ? inputResults[0].state
          : deriveStateFromViscosity(
              inputResults.reduce((acc, item) => acc + getIngredientViscosity(item) * item.amount, 0) /
                totalAmount
            );

        const mergedViscosity =
          inputResults.reduce(
            (acc, item) => acc + getIngredientViscosity(item) * item.amount,
            0
          ) / totalAmount;

        // 🔥 MERGE HEAT MEMORY to preserve temporary reactions and thermal state
        const mergedHeatMemory = inputResults.length === 1
          ? { ...inputResults[0]._heatMemory }
          : {
              timeAboveThresholds: Object.assign({}, ...inputResults.map(i => i._heatMemory?.timeAboveThresholds || {})),
              burnerTemperature: inputResults[0]._heatMemory?.burnerTemperature,
              lastTemperature: inputResults[0]._heatMemory?.lastTemperature,
              lastRiseRate: inputResults[0]._heatMemory?.lastRiseRate,
              appliedReactions: Object.assign({}, ...inputResults.map(i => i._heatMemory?.appliedReactions || {})),
              temporarySnapshots: Object.assign({}, ...inputResults.map(i => i._heatMemory?.temporarySnapshots || {})),
            };

        const merged = {
          id: inputResults[0].id,
          name: baseName,
          amount: totalAmount,
          state: mergedState,
          viscosity: mergedViscosity,
          quality:
            inputResults.reduce((acc, item) => acc + item.quality * item.amount, 0) / totalAmount,
          properties: {},
          temperature:
            totalThermalMass > 0
              ? inputResults.reduce(
                  (acc, item) =>
                    acc + item.temperature * item.amount * (item.thermal?.capacity ?? 1),
                  0
                ) / totalThermalMass
              : inputResults.reduce((acc, item) => acc + item.temperature * item.amount, 0) / totalAmount,
          tags: mergedTags,
          thermal: inputResults[0].thermal || { conductivity: 0.05, capacity: 1.0 },
          reactions: inputResults[0].reactions,
          sourceNames: Array.from(new Set(inputResults.flatMap((item) => item.sourceNames || [item.name]))),
          sourceDetails: mergedSourceDetails,
          sourceContributions: mergedSourceContributions,
          _heatMemory: mergedHeatMemory,
          color: (() => {
            const parse = (hex: string) => {
              if (hex.startsWith("rgb")) {
                const parts = hex.replace(/[rgba() ]/g, "").split(",").map((n) => Number(n));
                return [parts[0], parts[1], parts[2]];
              }
              const c = hex.replace("#", "");
              const bigint = parseInt(c, 16);
              return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
            };
            const total = inputResults.reduce(
              (acc, item) =>
                acc + (item.amount || 1) * (item.colorEffectiveness ?? 1),
              0
            );
            const blended = inputResults.reduce(
              (acc, item) => {
                const col = item.color ? parse(item.color) : [255, 255, 255];
                const weight = (item.amount || 1) * (item.colorEffectiveness ?? 1);
                return [
                  acc[0] + col[0] * weight,
                  acc[1] + col[1] * weight,
                  acc[2] + col[2] * weight,
                ];
              },
              [0, 0, 0]
            );
            if (total <= 0) return "#ffffff";
            const rgb = blended.map((v) => Math.round(v / total));
            return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
          })(),
        } as Ingredient;

        const keys = new Set(inputResults.flatMap((item) => Object.keys(item.properties)));
        keys.forEach((key) => {
          merged.properties[key] =
            inputResults.reduce((acc, item) => acc + (item.properties[key] || 0) * item.amount, 0) / totalAmount;
        });
        syncIngredientPhysicalState(merged);

        const mergedResult: Ingredient = {
          ...merged,
          sourceNames: Array.from(
            new Set([...(merged.sourceNames || []), merged.name])
          ),
          sourceDetails: Array.from(
            new Map<string, unknown>(
              [
                ...(merged.sourceDetails || []).map((d) => [d.sourceName.toLowerCase(), d] as [string, unknown]),
                [merged.name.toLowerCase(), { sourceName: merged.name, tags: merged.tags || [] } as any] as [string, unknown],
              ]
            ).values()
          ) as any,
        };

        results[node.id] = collapseToRecipe(syncIngredientPhysicalState(mergedResult));
        processed.add(node.id);
        progress = true;
      }
    }
  }

  return results;
}
