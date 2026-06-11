/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

/** Maximum writes per path per transaction to prevent rule oscillation loops */
export const MAX_WRITES_PER_PATH_PER_TX = 20;

export function isEmptyValue(v: any): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (_.isPlainObject(v)) return Object.keys(v).length === 0;
  return false;
}

export function createTxId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
