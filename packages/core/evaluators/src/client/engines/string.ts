/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import string from '../../utils/string';

export default {
  label: `{{t('String template')}}`,
  tooltip: `{{t('Simple string replacement, can be used to interpolate variables in a string.')}}`,
  evaluate: string,
};
