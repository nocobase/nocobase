import { get } from "lodash";

import { Registry, RegistryOptions } from "@nocobase/utils";

import mathjs from "../utils/mathjs";
import formulajs from "../utils/formulajs";



export type Scope = { [key: string]: any };

export type Evaluator = (expression: string, scope?: Scope) => any;
export interface EvaluatorsOptions extends RegistryOptions {
  empty?: boolean;
  evaluators?: { [key: string]: Evaluator };
}

const evaluators = new Registry<Evaluator>();

function evaluate(this: Evaluator, expression: string, scope: Scope = {}) {
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => {
    const item = get(scope, v);
    const key = v.replace(/\.(\d+)/g, '["$1"]');
    return ` ${typeof item === 'function' ? item() : key} `;
  });
  return this(exp, scope);
}

evaluators.register('math.js', evaluate.bind(mathjs));
evaluators.register('formula.js', evaluate.bind(formulajs));

export default evaluators;
