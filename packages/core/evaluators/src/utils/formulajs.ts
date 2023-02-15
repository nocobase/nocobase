import { default as fns } from '@formulajs/formulajs';



export default function(expression) {
  const fn = new Function(...Object.keys(fns), `return ${expression}`);
  const result = fn(...Object.values(fns));
  if (typeof result === 'number') {
    return fns.ROUND(result, 9);
  }

  return result;
}
