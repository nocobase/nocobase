import { get } from 'lodash';

import Plugin from "..";
import basic from './basic';
import mathjs from "./mathjs";
import formulajs from "./formulajs";

export type Scope = { [key: string]: any };

export type Evaluator = (expression: string, scope?: Scope) => any;

export function parseExpression(exp: string, scope: Scope = {}) {
  return exp.trim().replace(/\{\{\s*([^{}]+)\.?\s*\}\}/g, (_, v) => {
    const item = get(scope, v);
    return typeof item === 'function' ? item() : item;
  });
}

export default function(plugin: Plugin) {
  plugin.calculators.register('basic', basic);
  plugin.calculators.register('math.js', mathjs);
  plugin.calculators.register('formula.js', formulajs);
};
