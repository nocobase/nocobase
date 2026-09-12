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
import {
  getCollectionFields,
  getCollectionTitleFieldName,
  getFieldFilterable,
  getFieldInterface,
  getFieldName,
  isAssociationField,
} from './service-helpers';
import { hasFlowSurfaceTemplateDocument } from './template-reference';

export const FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPES = new Set([
  'table',
  'list',
  'gridCard',
  'calendar',
  'kanban',
]);
export const FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPE_LABEL = 'table/list/gridCard/calendar/kanban';
export const FLOW_SURFACE_DEFAULT_FILTER_MAX_CANDIDATE_FIELDS = 4;
export const FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT = 3;
export const FLOW_SURFACE_DEFAULT_FILTER_MINIMUM_COVERAGE_FIELDS = FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT;

const FLOW_SURFACE_DEFAULT_FILTER_CANDIDATE_INTERFACES = new Set([
  'input',
  'email',
  'url',
  'phone',
  'textarea',
  'select',
  'radioGroup',
]);

const FLOW_SURFACE_DEFAULT_FILTER_EXCLUDED_FIELD_NAMES = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'deletedBy',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
  'deleted_by',
  'sort',
]);

const FLOW_SURFACE_DEFAULT_FILTER_PREFERRED_FIELD_NAMES = [
  'name',
  'title',
  'nickname',
  'username',
  'email',
  'status',
  'phone',
  'mobile',
  'label',
  'code',
  'subject',
  'category',
  'scope',
  'priority',
  'description',
];

export function isFlowSurfacePublicDataSurfaceBlockType(blockType?: string) {
  return FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPES.has(String(blockType || '').trim());
}

export function resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames(
  collection: any,
  options: {
    maxCandidates?: number;
    minimumFields?: number;
  } = {},
) {
  const minimumFields = normalizePositiveInteger(
    options.minimumFields,
    FLOW_SURFACE_DEFAULT_FILTER_MINIMUM_COVERAGE_FIELDS,
  );
  const candidateFieldNames = resolveFlowSurfaceDefaultFilterCandidateFieldNames(collection, options);
  return candidateFieldNames.slice(0, Math.min(minimumFields, candidateFieldNames.length));
}

export function resolveFlowSurfaceDefaultFilterRequiredFieldCount(collection: any) {
  if (!collection) {
    return FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT;
  }
  const candidateFieldCount = resolveFlowSurfaceDefaultFilterCandidateFieldNames(collection, {
    maxCandidates: FLOW_SURFACE_DEFAULT_FILTER_MAX_CANDIDATE_FIELDS,
  }).length;
  return Math.min(FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT, candidateFieldCount);
}

export function resolveFlowSurfaceDefaultFilterCandidateFieldNames(
  collection: any,
  options: {
    maxCandidates?: number;
  } = {},
) {
  const maxCandidates = normalizePositiveInteger(
    options.maxCandidates,
    FLOW_SURFACE_DEFAULT_FILTER_MAX_CANDIDATE_FIELDS,
  );
  if (!collection || maxCandidates === 0) {
    return [];
  }

  const availableFields = getCollectionFields(collection).filter(isFlowSurfaceDefaultFilterEligibleField);
  const fieldsByName = new Map<string, any>();
  availableFields.forEach((field) => {
    const fieldName = normalizeText(getFieldName(field));
    if (fieldName && !fieldsByName.has(fieldName)) {
      fieldsByName.set(fieldName, field);
    }
  });

  const selectedFieldNames: string[] = [];
  const seenFieldNames = new Set<string>();
  const pushFieldByName = (value: any) => {
    if (selectedFieldNames.length >= maxCandidates) {
      return;
    }
    const fieldName = normalizeText(value);
    if (!fieldName || seenFieldNames.has(fieldName) || !fieldsByName.has(fieldName)) {
      return;
    }
    seenFieldNames.add(fieldName);
    selectedFieldNames.push(fieldName);
  };

  pushFieldByName(getCollectionTitleFieldName(collection));
  FLOW_SURFACE_DEFAULT_FILTER_PREFERRED_FIELD_NAMES.forEach(pushFieldByName);
  availableFields.forEach((field) => pushFieldByName(getFieldName(field)));

  return selectedFieldNames;
}

export function buildFlowSurfaceDefaultFilterFromCollection(
  collection: any,
  options: {
    maxCandidates?: number;
  } = {},
) {
  const candidateFieldNames = resolveFlowSurfaceDefaultFilterCandidateFieldNames(collection, options);
  if (!candidateFieldNames.length) {
    return undefined;
  }
  return {
    logic: '$and',
    items: candidateFieldNames.map((fieldName) => ({
      path: fieldName,
      operator: resolveFlowSurfaceDefaultFilterOperator(collection, fieldName),
    })),
  };
}

export function clampFlowSurfaceDefaultFilterToCandidateLimit(defaultFilter: any) {
  return clampFlowSurfaceDefaultFilterGroup(defaultFilter, FLOW_SURFACE_DEFAULT_FILTER_MAX_CANDIDATE_FIELDS).value;
}

export function resolveFlowSurfaceDefaultFilterFieldNames(defaultFilter: any): string[] {
  const fieldNames: string[] = [];
  const seen = new Set<string>();
  const visit = (value: any) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!_.isPlainObject(value)) {
      return;
    }
    const path = typeof value.path === 'string' ? value.path.trim() : '';
    if (path && !seen.has(path)) {
      seen.add(path);
      fieldNames.push(path);
    }
    if (Array.isArray(value.items)) {
      value.items.forEach(visit);
    }
  };
  visit(defaultFilter);
  return fieldNames;
}

function clampFlowSurfaceDefaultFilterGroup(value: any, remaining: number): { value: any; remaining: number } {
  if (remaining <= 0) {
    return {
      value: _.isPlainObject(value)
        ? {
            ..._.cloneDeep(value),
            items: [],
          }
        : value,
      remaining: 0,
    };
  }
  if (!_.isPlainObject(value) || !Array.isArray(value.items)) {
    return {
      value: _.cloneDeep(value),
      remaining,
    };
  }

  const nextItems: any[] = [];
  let nextRemaining = remaining;
  for (const item of value.items) {
    if (nextRemaining <= 0) {
      break;
    }
    if (_.isPlainObject(item) && Array.isArray(item.items)) {
      const nested = clampFlowSurfaceDefaultFilterGroup(item, nextRemaining);
      if (_.isPlainObject(nested.value) && Array.isArray(nested.value.items) && nested.value.items.length) {
        nextItems.push(nested.value);
      }
      nextRemaining = nested.remaining;
      continue;
    }
    if (_.isPlainObject(item) && typeof item.path === 'string' && typeof item.operator === 'string') {
      nextItems.push(_.cloneDeep(item));
      nextRemaining -= 1;
      continue;
    }
    nextItems.push(_.cloneDeep(item));
  }

  return {
    value: {
      ..._.cloneDeep(value),
      items: nextItems,
    },
    remaining: nextRemaining,
  };
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
  if (!isFlowSurfacePublicDataSurfaceBlockType(options.blockType) || hasFlowSurfaceTemplateDocument(options.template)) {
    throwBadRequest(
      `flowSurfaces ${actionName} ${fieldPath} is only supported on direct ${FLOW_SURFACE_PUBLIC_DATA_SURFACE_BLOCK_TYPE_LABEL} blocks`,
    );
  }

  const normalized = normalizeFlowSurfaceFilterGroupValue(
    defaultFilter,
    `flowSurfaces ${actionName} ${fieldPath} expects FilterGroup like ${FLOW_SURFACE_FILTER_GROUP_EXAMPLE}`,
    { strictDateValues: true },
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
  const defaults = {
    defaultFilter: _.cloneDeep(defaultFilter),
  };
  if (_.isUndefined(settings)) {
    return defaults;
  }
  if (!_.isPlainObject(settings)) {
    return settings;
  }
  if (Object.prototype.hasOwnProperty.call(settings, 'defaultFilter')) {
    return settings;
  }
  return {
    ...defaults,
    ..._.cloneDeep(settings),
  };
}

export function backfillFlowSurfaceFilterActionDefaultFilter<
  T extends {
    type?: string;
    settings?: Record<string, any>;
  },
>(actions: T[], defaultFilter: any): T[] {
  // Mirror the effective block defaultFilter into an existing filter action.
  // Missing direct data-surface defaults are generated earlier from collection metadata.
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

export function isFlowSurfaceDefaultFilterEligibleField(field: any) {
  const fieldName = normalizeText(getFieldName(field));
  const fieldInterface = normalizeText(getFieldInterface(field));
  if (!fieldName || !fieldInterface) {
    return false;
  }
  if (FLOW_SURFACE_DEFAULT_FILTER_EXCLUDED_FIELD_NAMES.has(fieldName)) {
    return false;
  }
  if (!FLOW_SURFACE_DEFAULT_FILTER_CANDIDATE_INTERFACES.has(fieldInterface)) {
    return false;
  }
  if (field?.hidden === true || field?.options?.hidden === true) {
    return false;
  }
  if (getFieldFilterable(field) === false) {
    return false;
  }
  return !isAssociationField(field);
}

function resolveFlowSurfaceDefaultFilterOperator(collection: any, fieldName: string) {
  const field = getCollectionFields(collection).find(
    (candidate) => normalizeText(getFieldName(candidate)) === fieldName,
  );
  const fieldInterface = normalizeText(getFieldInterface(field));
  return fieldInterface === 'select' || fieldInterface === 'radioGroup' ? '$eq' : '$includes';
}

function normalizeText(value: any) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).replace(/\s+/g, ' ').trim() : '';
}

function normalizePositiveInteger(value: any, fallback: number) {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(0, Math.trunc(num));
}
