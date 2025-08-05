/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

export function getDefaultOperator(model: FlowModel) {
  return model.getStepParams('filterFormItemSettings', 'defaultOperator')?.value;
}

/**
 * 判断筛选值是否为空
 *
 * 专门用于筛选器场景的空值判断，不会将 boolean 类型视为空值
 *
 * @param value - 要判断的值
 * @returns 如果值为空则返回 true，否则返回 false
 */
export function isFilterValueEmpty(value: any): boolean {
  // null 或 undefined 视为空
  if (value === null || value === undefined) {
    return true;
  }

  // 空字符串视为空
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }

  // 空数组视为空
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }

  // 空对象视为空（但不包括 Date、RegExp 等特殊对象）
  if (typeof value === 'object' && value.constructor === Object && Object.keys(value).length === 0) {
    return true;
  }

  // 其他情况（包括 boolean、number、Date 等）都不视为空
  return false;
}
