/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { getConfigureOptionKeysForUse } from './configure-options';
import { throwBadRequest } from './errors';
import { FLOW_SURFACE_BLOCK_SUPPORT_BY_KEY, FLOW_SURFACE_BLOCK_SUPPORT_BY_USE } from './support-matrix';

type NormalizeSortingAliasInput = {
  context: string;
  type?: string;
  use?: string;
  settings?: any;
};

function resolveBlockUse(input: Pick<NormalizeSortingAliasInput, 'type' | 'use'>) {
  const explicitUse = String(input.use || '').trim();
  if (explicitUse) {
    return explicitUse;
  }
  const typeOrUse = String(input.type || '').trim();
  if (!typeOrUse) {
    return undefined;
  }
  if (FLOW_SURFACE_BLOCK_SUPPORT_BY_USE.has(typeOrUse)) {
    return typeOrUse;
  }
  return FLOW_SURFACE_BLOCK_SUPPORT_BY_KEY.get(typeOrUse)?.modelUse || typeOrUse;
}

function blockSupportsSorting(use?: string) {
  return !!use && getConfigureOptionKeysForUse(use).includes('sorting');
}

function normalizeSortingDirection(input: any, context: string) {
  const normalized = String(input || '')
    .trim()
    .toLowerCase();
  if (!normalized || normalized === 'asc' || normalized === 'ascend' || normalized === 'ascending') {
    return 'asc';
  }
  if (normalized === 'desc' || normalized === 'descend' || normalized === 'descending') {
    return 'desc';
  }
  throwBadRequest(`${context} must be 'asc' or 'desc'`);
}

function normalizeSortingField(input: any, context: string) {
  const field = String(input || '').trim();
  if (!field) {
    throwBadRequest(`${context} must be a non-empty field name`);
  }
  return field;
}

function normalizeSortingEntry(input: any, context: string) {
  if (_.isString(input)) {
    const value = input.trim();
    if (!value) {
      throwBadRequest(`${context} must be a non-empty sort field`);
    }
    const descending = value.startsWith('-');
    const field = descending ? value.slice(1).trim() : value;
    return {
      field: normalizeSortingField(field, context),
      direction: descending ? 'desc' : 'asc',
    };
  }

  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context} must be a string or an object with field and direction`);
  }

  return {
    field: normalizeSortingField(input.field, `${context}.field`),
    direction: normalizeSortingDirection(input.direction, `${context}.direction`),
  };
}

function normalizeSortingArray(input: any, context: string) {
  if (!Array.isArray(input)) {
    throwBadRequest(`${context} must be an array`);
  }
  return input.map((item, index) => normalizeSortingEntry(item, `${context}[${index}]`));
}

export function normalizeFlowSurfacePublicSortingAlias(input: NormalizeSortingAliasInput) {
  if (_.isUndefined(input.settings)) {
    return input.settings;
  }
  if (!_.isPlainObject(input.settings)) {
    throwBadRequest(`${input.context} must be an object`);
  }
  if (!Object.prototype.hasOwnProperty.call(input.settings, 'sort')) {
    return input.settings;
  }

  const use = resolveBlockUse(input);
  if (!blockSupportsSorting(use)) {
    return input.settings;
  }

  const nextSettings = _.cloneDeep(input.settings);
  const sortingFromSort = normalizeSortingArray(nextSettings.sort, `${input.context}.sort`);
  if (Object.prototype.hasOwnProperty.call(nextSettings, 'sorting')) {
    const canonicalSorting = normalizeSortingArray(nextSettings.sorting, `${input.context}.sorting`);
    if (!_.isEqual(sortingFromSort, canonicalSorting)) {
      throwBadRequest(`${input.context}.sort conflicts with ${input.context}.sorting; use canonical sorting`);
    }
    nextSettings.sorting = canonicalSorting;
  } else {
    nextSettings.sorting = sortingFromSort;
  }
  delete nextSettings.sort;
  return nextSettings;
}
