/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isVariableExpression, pruneFilter } from '@nocobase/flow-engine';
import { transformFilter } from '@nocobase/utils/client';
import _ from 'lodash';

const PRESERVE_NULL = { __nocobaseDataScopeNull__: true };

function isPreserveNull(value: any) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    value.__nocobaseDataScopeNull__ === true &&
    Object.keys(value).length === 1
  );
}

function restorePreservedNull(value: any): any {
  if (isPreserveNull(value)) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => restorePreservedNull(item));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce<Record<string, any>>((result, key) => {
      result[key] = restorePreservedNull(value[key]);
      return result;
    }, {});
  }
  return value;
}

function markEmptyVariableValues(rawNode: any, resolvedNode: any) {
  if (!rawNode || !resolvedNode || typeof rawNode !== 'object' || typeof resolvedNode !== 'object') {
    return;
  }

  if ('path' in rawNode && 'operator' in rawNode) {
    if (
      isVariableExpression(rawNode.value) &&
      (resolvedNode.value === undefined || resolvedNode.value === null || resolvedNode.value === '')
    ) {
      resolvedNode.value = PRESERVE_NULL;
    }
    return;
  }

  if (Array.isArray(rawNode.items) && Array.isArray(resolvedNode.items)) {
    rawNode.items.forEach((rawItem, index) => {
      markEmptyVariableValues(rawItem, resolvedNode.items[index]);
    });
  }
}

export function normalizeDataScopeFilter(rawFilter: any, resolvedFilter: any) {
  const filterForTransform = _.cloneDeep(resolvedFilter);
  markEmptyVariableValues(rawFilter, filterForTransform);

  const filter = pruneFilter(transformFilter(filterForTransform));
  return restorePreservedNull(filter);
}
