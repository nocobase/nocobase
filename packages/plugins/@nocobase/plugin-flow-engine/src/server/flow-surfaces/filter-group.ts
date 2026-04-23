/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { transformFilter } from '@nocobase/utils';
import _ from 'lodash';
import { throwBadRequest } from './errors';

export const FLOW_SURFACE_EMPTY_FILTER_GROUP = {
  logic: '$and',
  items: [],
};

export const FLOW_SURFACE_FILTER_GROUP_EXAMPLE = JSON.stringify(FLOW_SURFACE_EMPTY_FILTER_GROUP);

export function normalizeFlowSurfaceFilterGroupValue(value: any, errorPrefix: string) {
  const normalized =
    value === null || (_.isPlainObject(value) && !Object.keys(value).length)
      ? _.cloneDeep(FLOW_SURFACE_EMPTY_FILTER_GROUP)
      : _.cloneDeep(value);

  try {
    assertFlowSurfaceFilterGroupShape(normalized);
    transformFilter(normalized);
    return normalized;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throwBadRequest(`${errorPrefix}: ${reason}`);
  }
}

export function assertFlowSurfaceFilterGroupShape(filter: any) {
  if (!_.isPlainObject(filter)) {
    throw new Error('Invalid filter: filter must be an object');
  }
  if (!('logic' in filter) || !('items' in filter)) {
    throw new Error('Invalid filter: filter must have logic and items properties');
  }
  if (filter.logic !== '$and' && filter.logic !== '$or') {
    throw new Error("Invalid filter: logic must be '$and' or '$or'");
  }
  if (!Array.isArray(filter.items)) {
    throw new Error('Invalid filter: items must be an array');
  }
  filter.items.forEach((item: any) => {
    if (_.isPlainObject(item) && 'logic' in item && 'items' in item) {
      assertFlowSurfaceFilterGroupShape(item);
      return;
    }
    if (_.isPlainObject(item) && typeof item.path === 'string' && typeof item.operator === 'string') {
      return;
    }
    throw new Error('Invalid filter item type');
  });
}
