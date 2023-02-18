import { default as fns } from '@formulajs/formulajs';
import { parseExpression, Scope } from '..';



export default function(expression: string, scope?: Scope) {
  const exp = parseExpression(expression, scope);
  const fn = new Function(...Object.keys(fns), `return ${exp}`);
  return fn(...Object.values(fns));
}
