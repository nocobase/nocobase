/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getNumberPrecision, toFixed } from '@rc-component/mini-decimal';

export function toFixedByStep(value: any, step: string | number) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return '';
  }
  const precision = getNumberPrecision(step);
  // return parseFloat(String(value)).toFixed(precision);
  return toFixed(String(value), '.', precision);
}
