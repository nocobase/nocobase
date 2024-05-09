/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { castArray } from 'lodash';

export const getValues = (values, fieldNames) => {
  return castArray(values)
    .filter((item) => item != null)
    .map((val) => (typeof val === 'object' ? val[fieldNames.value] : val));
};
