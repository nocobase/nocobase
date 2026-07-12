/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { JsonRecord, getDate, getRecord, getString } from '../actions/utils';

const DEFAULT_RUN_LIST_PAGE_SIZE = 50;
const MAX_RUN_LIST_PAGE_SIZE = 100;
const RUN_LIST_SORT_FIELD_MAP: Record<string, string> = {
  runCode: 'runCode',
  status: 'status',
  sourceType: 'sourceType',
  taskTemplateId: 'taskTemplateId',
  startedAt: 'startedAt',
  finishedAt: 'finishedAt',
  requestedAt: 'requestedAt',
  queuedAt: 'queuedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
};

function getQueryValue(ctx: Context, key: string) {
  const value = getRecord(ctx.query)[key];
  return Array.isArray(value) ? value[0] : value;
}

function getQueryString(ctx: Context, key: string) {
  return getString(getQueryValue(ctx, key));
}

export function getRunQueryLimit(ctx: Context) {
  const value = Number(getQueryValue(ctx, 'limit') || DEFAULT_RUN_LIST_PAGE_SIZE);
  return Number.isInteger(value) && value > 0 ? Math.min(value, MAX_RUN_LIST_PAGE_SIZE) : DEFAULT_RUN_LIST_PAGE_SIZE;
}

function getPositiveQueryInteger(ctx: Context, key: string, defaultValue: number) {
  const value = Number(getQueryValue(ctx, key) || defaultValue);
  return Number.isInteger(value) && value > 0 ? value : defaultValue;
}

export function getRunListPagination(ctx: Context) {
  const page = getPositiveQueryInteger(ctx, 'page', 1);
  const pageSizeValue = getQueryValue(ctx, 'pageSize') ?? getQueryValue(ctx, 'limit');
  const pageSize = Number(pageSizeValue || DEFAULT_RUN_LIST_PAGE_SIZE);
  const normalizedPageSize =
    Number.isInteger(pageSize) && pageSize > 0
      ? Math.min(pageSize, MAX_RUN_LIST_PAGE_SIZE)
      : DEFAULT_RUN_LIST_PAGE_SIZE;
  return { page, pageSize: normalizedPageSize, offset: (page - 1) * normalizedPageSize };
}

function normalizeRunListSortItem(value: unknown) {
  const rawSort = getString(value).trim();
  if (!rawSort) {
    return null;
  }
  const descending = rawSort.startsWith('-');
  const requestedField = descending ? rawSort.slice(1) : rawSort;
  const sortField = RUN_LIST_SORT_FIELD_MAP[requestedField];
  return sortField ? `${descending ? '-' : ''}${sortField}` : null;
}

export function getRunListSort(ctx: Context) {
  const rawSort = getRecord(ctx.query).sort;
  let sortValues: unknown[] = Array.isArray(rawSort) ? rawSort : [rawSort];
  if (typeof rawSort === 'string') {
    const trimmed = rawSort.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        sortValues = Array.isArray(parsed) ? parsed : [rawSort];
      } catch {
        sortValues = [rawSort];
      }
    } else if (trimmed.includes(',')) {
      sortValues = trimmed.split(',');
    }
  }
  const sort = sortValues.map(normalizeRunListSortItem).filter((item): item is string => Boolean(item));
  if (!sort.length) {
    return ['-createdAt'];
  }
  if (!sort.includes('createdAt') && !sort.includes('-createdAt')) {
    sort.push('-createdAt');
  }
  return sort;
}

export function getTotalPage(count: number, pageSize: number) {
  return Math.ceil(count / pageSize);
}

function hasFilterValues(filter: JsonRecord) {
  return Object.keys(filter).length > 0;
}

function getQueryFilter(ctx: Context) {
  const filter = getQueryValue(ctx, 'filter');
  if (typeof filter !== 'string') {
    return getRecord(filter);
  }
  if (!filter.trim()) {
    return {};
  }
  try {
    return getRecord(JSON.parse(filter));
  } catch {
    return {};
  }
}

function mergeRunFilters(filters: JsonRecord[]) {
  const activeFilters = filters.filter(hasFilterValues);
  if (!activeFilters.length) {
    return {};
  }
  return activeFilters.length === 1 ? activeFilters[0] : { $and: activeFilters };
}

export function getRunListFilter(ctx: Context) {
  const compiledFilter = getQueryFilter(ctx);
  const directFilter: JsonRecord = {};
  const status = getQueryString(ctx, 'status');
  const nodeId = getQueryString(ctx, 'nodeId');
  const agentProfileId = getQueryString(ctx, 'agentProfileId');
  const taskTemplateId = getQueryString(ctx, 'taskTemplateId');
  const createdAtFrom = getDate(getQueryValue(ctx, 'createdAtFrom'));
  const createdAtTo = getDate(getQueryValue(ctx, 'createdAtTo'));

  if (status) {
    directFilter.status = status.includes(',')
      ? {
          $in: status
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }
      : status;
  }
  if (nodeId) directFilter.nodeId = nodeId;
  if (agentProfileId) directFilter.agentProfileId = agentProfileId;
  if (taskTemplateId) directFilter.taskTemplateId = taskTemplateId;
  if (createdAtFrom || createdAtTo) {
    directFilter.createdAt = {
      ...(createdAtFrom ? { $gte: createdAtFrom } : {}),
      ...(createdAtTo ? { $lte: createdAtTo } : {}),
    };
  }
  return mergeRunFilters([compiledFilter, directFilter]);
}
