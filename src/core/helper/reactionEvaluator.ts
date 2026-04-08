import type { Ingredient, Reaction } from "../types/types";
import {
  matchesStateRequirement,
  stateToDefaultViscosity,
  syncIngredientPhysicalState,
} from "./physicalState";

function applyReactionEffects(out: Ingredient, reaction: Reaction) {
  if (reaction.effects.addTags) {
    out.tags = Array.from(new Set([...out.tags, ...reaction.effects.addTags]));
  }

  if (reaction.effects.setState) {
    out.state = reaction.effects.setState;
    out.viscosity = stateToDefaultViscosity(reaction.effects.setState);
  }

  if (reaction.effects.namePrefix) {
    const prefixed = `${reaction.effects.namePrefix} `;
    if (!out.name.startsWith(prefixed)) {
      out.name = `${prefixed}${out.name}`;
    }
  }
}

export function evaluateReactions(ingredient: Ingredient, dt: number) {
  if (!ingredient.reactions) return ingredient;

  const out = structuredClone(ingredient);
  out._heatMemory ??= { timeAboveThresholds: {} };
  out._heatMemory.timeAboveThresholds ??= {};
  out._heatMemory.appliedReactions ??= {};
  out._heatMemory.temporarySnapshots ??= {};

  const reactions = out.reactions ?? [];

  for (const reaction of reactions) {
    const {
      minTemp,
      maxTemp,
      requiredState,
      requiredTags,
      minTimeAboveTemp,
      maxRiseRate,
    } = reaction.conditions;

    const tempOk =
      (minTemp === undefined || out.temperature >= minTemp) &&
      (maxTemp === undefined || out.temperature <= maxTemp);

    const stateOk = !requiredState || matchesStateRequirement(out, requiredState);
    const tagsOk =
      !requiredTags || requiredTags.every((tag) => out.tags.includes(tag));

    let timeOk = true;
    if (minTemp !== undefined) {
      const key = minTemp;
      const current = out._heatMemory.timeAboveThresholds[key] ?? 0;
      const next = out.temperature >= minTemp ? current + dt : 0;
      out._heatMemory.timeAboveThresholds[key] = next;

      if (minTimeAboveTemp !== undefined) {
        timeOk = next >= minTimeAboveTemp;
      }
    }

    const riseRateOk =
      maxRiseRate === undefined ||
      Math.abs(out._heatMemory.lastRiseRate ?? 0) <= maxRiseRate;

    const shouldApply = tempOk && stateOk && tagsOk && timeOk && riseRateOk;
    const alreadyApplied = out._heatMemory.appliedReactions[reaction.id] === true;

    if (shouldApply && !alreadyApplied) {
      out._heatMemory.appliedReactions[reaction.id] = true;

      if (reaction.type === "temporary") {
        out._heatMemory.temporarySnapshots[reaction.id] = {
          baseState: out.state,
          addedTags: reaction.effects.addTags,
          namePrefix: reaction.effects.namePrefix,
        };
      }
    }

    const keepActive =
      reaction.type === "permanent"
        ? shouldApply || alreadyApplied
        : shouldApply;

    if (keepActive) {
      applyReactionEffects(out, reaction);
    }

    if (!shouldApply && reaction.type === "temporary" && alreadyApplied) {
      const snapshot = out._heatMemory.temporarySnapshots[reaction.id];

      if (snapshot?.baseState) {
        out.state = snapshot.baseState;
        out.viscosity = stateToDefaultViscosity(snapshot.baseState);
      }

      if (snapshot?.addedTags?.length) {
        const removeSet = new Set(snapshot.addedTags);
        out.tags = out.tags.filter((tag) => !removeSet.has(tag));
      }

      if (snapshot?.namePrefix) {
        const prefixed = `${snapshot.namePrefix} `;
        if (out.name.startsWith(prefixed)) {
          out.name = out.name.slice(prefixed.length);
        }
      }

      delete out._heatMemory.appliedReactions[reaction.id];
      delete out._heatMemory.temporarySnapshots[reaction.id];
    }
  }

  return syncIngredientPhysicalState(out);
}