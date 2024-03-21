import * as functions from '@formulajs/formulajs';

import { evaluate } from '.';

const fnNames = Object.keys(functions).filter((key) => key !== 'default');
const fns = fnNames.map((key) => functions[key]);

export default evaluate.bind(function (expression: string, scope = {}) {
  const fn = new Function(...fnNames, ...Object.keys(scope), `return ${expression}`);
  const result = fn(...fns, ...Object.values(scope));
  if (typeof result === 'number') {
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return functions.ROUND(result, 9);
  }
  return result;
}, {});
