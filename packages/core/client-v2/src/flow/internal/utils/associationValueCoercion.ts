/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 判断集合字段是否为“对多”关联
export function isToManyAssociation(collectionField: any): boolean {
  if (!collectionField) return false;
  const relationType = collectionField?.type;
  return relationType === 'belongsToMany' || relationType === 'hasMany' || relationType === 'belongsToArray';
}

/**
 * 若目标字段为“对一”关联且传入值为数组，则取第一个元素
 * - 对多关联/非关联字段：不处理，原样返回
 * - 传入空数组：返回 undefined
 */
export function coerceForToOneField(collectionField: any, value: any) {
  const isAssociation = !!collectionField?.isAssociationField?.();
  const toMany = isToManyAssociation(collectionField);
  if (isAssociation && !toMany && Array.isArray(value)) {
    return value.length ? value[0] : undefined;
  }
  return value;
}
