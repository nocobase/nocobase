/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BASE_BLOCKED_IDENTIFIERS } from '@nocobase/utils/client';
import { createFormulaEvaluator } from '../../utils/formulajs';

const blockedIdentifiers = [
  ...BASE_BLOCKED_IDENTIFIERS,
  'window',
  'document',
  'parent',
  'top',
  'frames',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
];

const formulajs = createFormulaEvaluator({
  blockedIdentifiers,
});

export default {
  label: 'Formula.js',
  tooltip: '{{t("Formula.js supports most Microsoft Excel formula functions.")}}',
  link: 'FORMULAJS_DOC_URL',
  evaluate: formulajs,
};
