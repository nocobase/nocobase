/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from './errors';
import { FLOW_SURFACE_FILTER_GROUP_EXAMPLE, normalizeFlowSurfaceFilterGroupValue } from './filter-group';

export const FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPES = new Set(['table', 'list', 'gridCard']);

export function isFlowSurfacePublicDataSurfaceBlockType(blockType?: string) {
  return FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPES.has(String(blockType || '').trim());
}

export function normalizeFlowSurfacePublicBlockDefaultFilter(
  actionName: string,
  defaultFilter: any,
  options: {
    blockType?: string;
    template?: unknown;
    path?: string;
  },
) {
  if (_.isUndefined(defaultFilter)) {
    return undefined;
  }

  const fieldPath = options.path ? `${options.path}.defaultFilter` : 'defaultFilter';
  if (!isFlowSurfacePublicDataSurfaceBlockType(options.blockType) || !_.isUndefined(options.template)) {
    throwBadRequest(`flowSurfaces ${actionName} ${fieldPath} is only supported on direct table/list/gridCard blocks`);
  }

  return normalizeFlowSurfaceFilterGroupValue(
    defaultFilter,
    `flowSurfaces ${actionName} ${fieldPath} expects FilterGroup like ${FLOW_SURFACE_FILTER_GROUP_EXAMPLE}`,
  );
}

export function backfillFlowSurfaceDefaultFilterSetting(settings: any, defaultFilter: any) {
  if (_.isUndefined(defaultFilter)) {
    return settings;
  }
  if (_.isUndefined(settings)) {
    return {
      defaultFilter: _.cloneDeep(defaultFilter),
    };
  }
  if (!_.isPlainObject(settings)) {
    return settings;
  }
  if (Object.prototype.hasOwnProperty.call(settings, 'defaultFilter')) {
    return settings;
  }
  return {
    ..._.cloneDeep(settings),
    defaultFilter: _.cloneDeep(defaultFilter),
  };
}

export function backfillFlowSurfaceFilterActionDefaultFilter<
  T extends {
    type?: string;
    settings?: Record<string, any>;
  },
>(actions: T[], defaultFilter: any): T[] {
  if (_.isUndefined(defaultFilter)) {
    return actions;
  }
  return actions.map((action) => {
    if (String(action?.type || '').trim() !== 'filter') {
      return action;
    }
    const settings = backfillFlowSurfaceDefaultFilterSetting(action.settings, defaultFilter);
    if (settings === action.settings) {
      return action;
    }
    return {
      ...action,
      settings,
    };
  });
}
