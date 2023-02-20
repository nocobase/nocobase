import { default as fns } from '@formulajs/formulajs';
import { parseExpression, Scope } from '..';



export default function(expression: string, scope?: Scope) {
  const exp = parseExpression(expression, scope);
  const fn = new Function(...Object.keys(fns), ...Object.keys(scope), `return ${exp}`);
  const result = fn(...Object.values(fns), ...Object.values(scope));
  if (typeof result === 'number') {
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return fns.ROUND(result, 9);
  }
  return result;
}
