import React from 'react';
import * as formulajs from '@formulajs/formulajs';
import { lang } from '../../../locale';

export default {
  label: 'formula.js',
  description: <a href="https://formulajs.info/functions/" target="_blank">{lang('Syntax references')} (formula.js)</a>,
  evaluate(exp: string) {
    const fn = new Function(...Object.keys(formulajs), `return ${exp}`);
    return fn(...Object.values(formulajs));
  }
};
