/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import formulajs from '../../utils/formulajs';

export default {
  label: 'Formula.js',
  tooltip: '{{t("Formula.js supports most Microsoft Excel formula functions.")}}',
  link: 'https://docs.nocobase.com/handbook/calculation-engines/formula',
  evaluate: formulajs,
};
