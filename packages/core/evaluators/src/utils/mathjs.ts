import * as math from 'mathjs';

export default function (expression: string, scope = {}) {
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => v);
  const result = math.evaluate(exp, scope);
  if (typeof result === 'number') {
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return math.round(result, 9);
  }
  return result;
}
