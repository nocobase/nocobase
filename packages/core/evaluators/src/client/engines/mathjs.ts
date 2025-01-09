/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import mathjs from '../../utils/mathjs';

export default {
  label: 'Math.js',
  tooltip: `{{t('Math.js comes with a large set of built-in functions and constants, and offers an integrated solution to work with different data types.')}}`,
  link: 'https://docs.nocobase.com/handbook/calculation-engines/mathjs',
  evaluate: mathjs,
};
