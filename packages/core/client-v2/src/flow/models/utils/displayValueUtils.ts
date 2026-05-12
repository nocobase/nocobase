/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValidElement } from 'react';

export function hasDisplayValue(value: any) {
  return value !== undefined && value !== null && value !== '';
}

function getTitleFieldName(collectionField: any) {
  const targetCollection = collectionField?.targetCollection;
  return (
    collectionField?.targetCollectionTitleFieldName ||
    targetCollection?.titleCollectionField?.name ||
    targetCollection?.titleField ||
    targetCollection?.options?.titleField
  );
}

function getTitleCollectionField(collectionField: any, titleFieldName: string) {
  return (
    collectionField?.targetCollection?.getField?.(titleFieldName) ||
    collectionField?.targetCollection?.titleCollectionField
  );
}

export function normalizeDisplayValue(value: any, options: { collectionField?: any } = {}): any {
  if (!hasDisplayValue(value) || isValidElement(value)) {
    return value;
  }
  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) => normalizeDisplayValue(item, options)).filter(hasDisplayValue);
    return parts.length ? parts.map(String).join(', ') : undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    const titleFieldName = getTitleFieldName(options.collectionField);
    if (titleFieldName) {
      return normalizeDisplayValue(value[titleFieldName], {
        collectionField: getTitleCollectionField(options.collectionField, titleFieldName),
      });
    }
    return undefined;
  }
  return value;
}
