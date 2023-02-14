import { get } from "lodash";

import { Registry, RegistryOptions } from "@nocobase/utils";

import mathjs from "../utils/mathjs";
import formulajs from "../utils/formulajs";



export interface Evaluator {
  (expression: string, scope?: { [key: string]: any }): any;
}

export interface EvaluatorsOptions extends RegistryOptions {
  empty?: boolean;
  evaluators?: { [key: string]: Evaluator };
}

function evaluate(this: Evaluator, expression: string, scope: { [key: string]: any } = {}): any {
  const exp = expression.trim().replace(/\{\{\s*([^{}]+)\.?\s*\}\}/g, (_, v) => {
    const item = get(scope, v);
    return typeof item === 'function' ? item() : item;
  });
  return this(exp);
}

const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', evaluate.bind(mathjs));
evaluators.register('formula.js', evaluate.bind(formulajs));

export default evaluators;
