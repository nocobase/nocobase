import * as formulajs from '@formulajs/formulajs';



export default {
  label: 'Formula.js',
  tooltip: '{{t("Formula.js supports most Microsoft Excel formula functions.")}}',
  link: 'https://formulajs.info/functions/',
  evaluate(exp: string) {
    const fn = new Function(...Object.keys(formulajs), `return ${exp}`);
    return fn(...Object.values(formulajs));
  }
};
