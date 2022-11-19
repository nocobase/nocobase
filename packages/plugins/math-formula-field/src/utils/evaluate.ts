import * as math from 'mathjs';

export function evaluate(exp: string, scope = {}) {
  const expression = exp.replace(/{{([^}]+)}}/g, (_, i) => {
    return scope[i.trim()] || '';
  });
  return math.evaluate(expression, scope);
}
