/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as functions from '@formulajs/formulajs';
import { round } from 'mathjs';

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
    return round(result, 9);
  }
  return result;
}, {});
