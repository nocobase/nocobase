import * as formulajs from '@formulajs/formulajs';

export function evaluate(exp: string, scope = {}) {
  const fn = new Function(...Object.keys(formulajs), ...Object.keys(scope), `return ${exp}`);
  return fn(...Object.values(formulajs), ...Object.values(scope));
}
