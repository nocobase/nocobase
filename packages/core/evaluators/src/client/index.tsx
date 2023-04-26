import { Registry } from '@nocobase/utils/client';

import mathjs from './engines/mathjs';
import formulajs from './engines/formulajs';

export interface Evaluator {
  label: string;
  tooltip?: string;
  link?: string;
  evaluate(exp: string, scope?: { [key: string]: any }): any;
}

export const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', mathjs);
evaluators.register('formula.js', formulajs);

export function getOptions() {
  return Array.from((evaluators as Registry<Evaluator>).getEntities()).reduce(
    (result: any[], [value, options]) => result.concat({ value, ...options }),
    [],
  );
}

export default evaluators;
