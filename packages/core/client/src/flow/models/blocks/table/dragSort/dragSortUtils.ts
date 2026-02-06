/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from '@nocobase/flow-engine';

/**
 * 从 collection 中获取所有 sort 类型的字段
 * @param collection - 集合对象
 * @returns 排序字段数组
 */
export function getSortFields(collection: Collection | undefined) {
  if (!collection) return [];

  const fields = collection.getFields?.() || [];

  return fields.filter((field) => {
    return !field?.target && field.interface === 'sort';
  });
}

/**
 * 获取 collection 中第一个可用的 sort 字段
 * @param collection - 集合对象
 * @returns 第一个排序字段，如果没有则返回 undefined
 */
export function getFirstSortField(collection: Collection | undefined) {
  const sortFields = getSortFields(collection);
  return sortFields[0];
}

/**
 * 将 sort 字段转换为选项格式
 * @param fields - 字段数组
 * @returns 选项数组
 */
export function convertFieldsToOptions(fields: any[]) {
  return fields.map((field) => ({
    label: field?.uiSchema?.title || field?.name,
    value: field?.name,
    disabled: field?.options?.scopeKey,
  }));
}

/**
 * 检查 collection 是否支持拖拽排序
 * @param collection - 集合对象
 * @returns 如果 collection 有 sort 字段则返回 true
 */
export function supportsDragSort(collection: Collection | undefined): boolean {
  return getSortFields(collection).length > 0;
}
