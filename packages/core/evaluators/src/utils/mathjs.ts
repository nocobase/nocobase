import * as math from 'mathjs';

export default function (expression: string, scope = {}) {
  const result = math.evaluate(expression, scope);
  if (typeof result === 'number') {
    return math.round(result, 9);
  }
  return result;
}
