/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function first(initialValue: any) {
  return Array.isArray(initialValue) ? initialValue[0] : initialValue;
}

export function last(initialValue: any) {
  return Array.isArray(initialValue) ? initialValue[initialValue.length - 1] : initialValue;
}
