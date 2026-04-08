import { ActionsList } from "./index";
import type { ActionNodeDefinition } from "../core/types/types";

export function getActionByName(name: string): ActionNodeDefinition {
  const entry = Object.values(ActionsList).find(
    (action) => action.name === name
  );

  return entry ?? ActionsList.Mix;
}