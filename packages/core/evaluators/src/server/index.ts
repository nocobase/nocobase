/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry, BASE_BLOCKED_IDENTIFIERS } from '@nocobase/utils';

import { Evaluator } from '../utils';
import mathjs from '../utils/mathjs';
import { createFormulaEvaluator } from '../utils/formulajs';
import string from '../utils/string';

export { Evaluator, evaluate, appendArrayColumn } from '../utils';

export const evaluators = new Registry<Evaluator>();

const formulajs = createFormulaEvaluator({
  blockedIdentifiers: [
    ...BASE_BLOCKED_IDENTIFIERS,
    'process',
    'require',
    'module',
    'exports',
    '__filename',
    '__dirname',
    'Buffer',
  ],
});

evaluators.register('math.js', mathjs);
evaluators.register('formula.js', formulajs);
evaluators.register('string', string);

export default evaluators;
