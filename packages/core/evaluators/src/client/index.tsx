import { Registry } from '@nocobase/utils/client';

import mathjs from './engines/mathjs';
import formulajs from './engines/formulajs';

export interface Evaluator {
  label: string;
  tooltip?: string;
  link?: string;
  evaluate(exp: string, scope?: { [key: string]: any }): any;
}

const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', mathjs);
evaluators.register('formula.js', formulajs);

export default evaluators;
