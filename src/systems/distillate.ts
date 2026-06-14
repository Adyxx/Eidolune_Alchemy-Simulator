import type { ActionLogic } from "../core/types/types";
import {
	getIngredientComposition,
	syncIngredientPhysicalState,
} from "../core/helper/physicalState";

const DISTILLATION_TEMP = 85;

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

export const distillateLogic: ActionLogic = {
	id: "distillate",

	apply: ([liquidInput, supportInput]) => {
		const out = structuredClone(liquidInput);

		const liquidComposition = getIngredientComposition(liquidInput);
		const supportComposition = getIngredientComposition(supportInput);
		const tempFactor = clamp01((liquidInput.temperature - DISTILLATION_TEMP) / 90);
		const supportPurity = clamp01((supportInput.quality ?? 50) / 100);

		const purificationStrength = clamp01(0.35 + tempFactor * 0.45 + supportPurity * 0.1);

		out.name = `Purified ${liquidInput.name}`;
		out.amount = Math.max(0.1, liquidInput.amount * (0.9 - supportComposition.undissolvedSolids * 0.05));
		out.quality = Math.min(
			100,
			liquidInput.quality + 8 + tempFactor * 12 + supportPurity * 6
		);
		out.temperature = Math.max(liquidInput.temperature - 2, DISTILLATION_TEMP + 1);
		out.tags = Array.from(new Set([...(liquidInput.tags || []), "purified", "distilled"]));
		out.solubility = Math.min(1, Math.max(liquidInput.solubility ?? 0.1, 0.7 + tempFactor * 0.2));

		out.composition = {
			liquidPhase: Math.min(0.98, Math.max(0.8, liquidComposition.liquidPhase + purificationStrength * 0.18)),
			dissolvedSolids: liquidComposition.dissolvedSolids * (1 - purificationStrength * 0.7),
			undissolvedSolids: liquidComposition.undissolvedSolids * (1 - purificationStrength * 0.9),
		};

		out.sourceNames = Array.from(
			new Set([
				...(liquidInput.sourceNames || [liquidInput.name]),
				...(supportInput.sourceNames || [supportInput.name]),
			])
		);

		out.sourceDetails = [
			...(liquidInput.sourceDetails || [{ sourceName: liquidInput.name, tags: liquidInput.tags || [] }]),
			...(supportInput.sourceDetails || [{ sourceName: supportInput.name, tags: supportInput.tags || [] }]),
		];

		return syncIngredientPhysicalState(out);
	},
};


