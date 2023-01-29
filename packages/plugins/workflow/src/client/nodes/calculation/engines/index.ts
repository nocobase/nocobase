import { Registry } from '@nocobase/utils/client';

import mathjs from './mathjs';
import formulajs from './formulajs';

export interface CalculationEngine {
  label: string;
  description?: React.ReactNode;
  evaluate(exp: string): any;
}

export const calculationEngines = new Registry<CalculationEngine>();

calculationEngines.register('math.js', mathjs);
calculationEngines.register('formula.js', formulajs);
