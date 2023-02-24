import { Registry } from "@nocobase/utils";

import { evaluate, Evaluator } from '../utils';
import mathjs from "../utils/mathjs";
import formulajs from "../utils/formulajs";



export { Evaluator } from '../utils';

export const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', evaluate.bind(mathjs));
evaluators.register('formula.js', evaluate.bind(formulajs));

export default evaluators;
