// data/ingredients/index.ts

import * as Water from './water';
import * as Sugar from './sugar';
import * as Moonleaf from './moonleaf';

export const IngredientsList = {
  ...Water,
  ...Sugar,
  ...Moonleaf,

};
