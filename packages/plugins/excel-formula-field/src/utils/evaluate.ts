import * as formulajs from '@formulajs/formulajs';

export function evaluate(exp: string, scope = {}) {
  const expression = exp.replace(/{{([^}]+)}}/g, (match, i) => {
    return scope[i.trim()] || '';
  });
  const fn = new Function(...Object.keys(formulajs), ...Object.keys(scope), `return ${expression}`);
  return fn(...Object.values(formulajs), ...Object.values(scope));
}
