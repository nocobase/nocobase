import * as math from 'mathjs';

export default function (expression: string, scope = {}) {
  const result = math.evaluate(expression, scope);
  if (typeof result === 'number') {
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return math.round(result, 9);
  }
  return result;
}
