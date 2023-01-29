import * as fns from '@formulajs/formulajs';



export default function(exp: string) {
  const fn = new Function(...Object.keys(fns), `return ${exp}`);
  return fn(...Object.values(fns));
}
