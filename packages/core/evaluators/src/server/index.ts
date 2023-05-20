import { Registry } from '@nocobase/utils';

import type { Evaluator } from '../utils';
import { evaluate } from '../utils';
import formulajs from '../utils/formulajs';
import mathjs from '../utils/mathjs';

export { appendArrayColumn, evaluate } from '../utils';
export type { Evaluator } from '../utils';

export const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', evaluate.bind(mathjs));
evaluators.register('formula.js', evaluate.bind(formulajs));

export default evaluators;
