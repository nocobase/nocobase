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

export const FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPES = new Set([
  'table',
  'list',
  'gridCard',
  'calendar',
  'kanban',
]);
export const FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPE_LABEL = 'table/list/gridCard/calendar/kanban';

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

  const fieldPath = buildFlowSurfaceDefaultFilterFieldPath(actionName, options.path);
  if (!isFlowSurfacePublicDataSurfaceBlockType(options.blockType) || !_.isUndefined(options.template)) {
    throwBadRequest(
      `flowSurfaces ${actionName} ${fieldPath} is only supported on direct ${FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPE_LABEL} blocks`,
    );
  }

  const normalized = normalizeFlowSurfaceFilterGroupValue(
    defaultFilter,
    `flowSurfaces ${actionName} ${fieldPath} expects FilterGroup like ${FLOW_SURFACE_FILTER_GROUP_EXAMPLE}`,
  );
  return normalized;
}

export function assertFlowSurfaceConcreteDefaultFilterItem(
  actionName: string,
  defaultFilter: any,
  options: {
    path?: string;
  } = {},
) {
  const fieldPath = buildFlowSurfaceDefaultFilterFieldPath(actionName, options.path);
  if (!hasConcreteFlowSurfaceFilterItem(defaultFilter)) {
    throwBadRequest(
      `flowSurfaces ${actionName} ${fieldPath} must include at least one concrete filter item; empty defaultFilter groups such as {}, null, or { logic, items: [] } are not allowed`,
    );
  }
}

function buildFlowSurfaceDefaultFilterFieldPath(actionName: string, path?: string) {
  if (!path) {
    return 'defaultFilter';
  }

  const prefix = `flowSurfaces ${actionName} `;
  const normalizedPath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
  return normalizedPath.endsWith('.defaultFilter') ? normalizedPath : `${normalizedPath}.defaultFilter`;
}

function hasConcreteFlowSurfaceFilterItem(filter: any): boolean {
  if (!_.isPlainObject(filter) || !Array.isArray(filter.items)) {
    return false;
  }
  return filter.items.some((item: any) => {
    if (_.isPlainObject(item) && 'logic' in item && 'items' in item) {
      return hasConcreteFlowSurfaceFilterItem(item);
    }
    return _.isPlainObject(item) && typeof item.path === 'string' && typeof item.operator === 'string';
  });
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
