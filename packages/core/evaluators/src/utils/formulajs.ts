import * as fns from '@formulajs/formulajs';



export default function(exp: string, scope = {}) {
  const expression = exp.replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => v);
  const fn = new Function(...Object.keys(fns), ...Object.keys(scope), `return ${expression}`);
  const result = fn(...Object.values(fns), ...Object.values(scope));
  if (typeof result === 'number') {
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return fns.ROUND(result, 9);
  }
  return result;
}
