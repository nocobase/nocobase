import * as math from 'mathjs';
import { parseExpression, Scope } from '..';



export default function (expression: string, scope: Scope = {}) {
  const exp = parseExpression(expression, scope);
  const result = math.evaluate(exp, scope);
  if (typeof result === 'number') {
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return math.round(result, 9);
  }
  return result;
}
