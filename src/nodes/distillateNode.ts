import type { ActionNodeDefinition } from "../core/types/types";
import { distillateLogic } from "../systems/distillate";

const DISTILLATION_TEMP = 85;

export const DistillateNode: ActionNodeDefinition = {
	id: "distillate",
	name: "Distill",
	emoji: "⚗️",
	inputSpec: [
		{
			id: "input1",
			allowedStates: ["liquid"],
			minTemperature: DISTILLATION_TEMP,
			optional: false,
		},
		{
			id: "input2",
			optional: false,
		},
	],
	outputSpec: [
		{
			id: "output",
			label: "Purified Liquid",
		},
	],
	logic: distillateLogic,
	ui: {
		color: "#6d8fb3",
	},
};