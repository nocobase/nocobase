/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function parseCollectionName(collection: string) {
  if (!collection) {
    return [];
  }
  const dataSourceCollection = collection.split(':');
  const collectionName = dataSourceCollection.pop();
  const dataSourceName = dataSourceCollection[0] ?? 'main';
  return [dataSourceName, collectionName];
}

export function joinCollectionName(dataSourceName: string, collectionName: string) {
  if (!dataSourceName || dataSourceName === 'main') {
    return collectionName;
  }

  return `${dataSourceName}:${collectionName}`;
}

const NUMERIC_FIELD_TYPES = new Set(['integer', 'bigInt', 'float', 'double', 'decimal']);

export function isNumericField(field?: { options?: { type?: string } }) {
  const fieldType = field?.options?.type;
  return typeof fieldType === 'string' && NUMERIC_FIELD_TYPES.has(fieldType);
}
