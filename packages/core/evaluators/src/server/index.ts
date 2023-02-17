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

const evaluators = new Registry<Evaluator>();

evaluators.register('math.js', mathjs);
evaluators.register('formula.js', formulajs);

export default evaluators;
