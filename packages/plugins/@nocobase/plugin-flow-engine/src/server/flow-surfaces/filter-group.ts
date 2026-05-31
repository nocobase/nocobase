/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { operators as databaseOperators } from '@nocobase/database';
import { getDayRangeByParams, parseDate, transformFilter } from '@nocobase/utils';
import _ from 'lodash';
import { Op, Utils } from 'sequelize';
import { FlowSurfaceBadRequestError, throwBadRequest } from './errors';

export const FLOW_SURFACE_EMPTY_FILTER_GROUP = {
  logic: '$and',
  items: [],
};

export const FLOW_SURFACE_FILTER_GROUP_EXAMPLE = JSON.stringify(FLOW_SURFACE_EMPTY_FILTER_GROUP);

const FLOW_SURFACE_FILTER_OPERATOR_REPAIR_HINT =
  'FilterGroup operators must use NocoBase operator names such as $notIn and $dateBefore.';

const FLOW_SURFACE_FILTER_OPERATOR_REPAIR_EXAMPLE = {
  logic: '$and',
  items: [
    {
      path: 'stage',
      operator: '$notIn',
      value: ['won', 'lost'],
    },
  ],
};

const FLOW_SURFACE_DATE_FILTER_OPERATORS = new Set([
  '$dateOn',
  '$dateNotOn',
  '$dateBefore',
  '$dateAfter',
  '$dateNotBefore',
  '$dateNotAfter',
  '$dateBetween',
]);

const FLOW_SURFACE_DATE_RANGE_TYPES = new Set([
  'today',
  'yesterday',
  'tomorrow',
  'thisWeek',
  'lastWeek',
  'nextWeek',
  'thisMonth',
  'lastMonth',
  'nextMonth',
  'thisQuarter',
  'lastQuarter',
  'nextQuarter',
  'thisYear',
  'lastYear',
  'nextYear',
  'past',
  'next',
]);

const FLOW_SURFACE_DATE_RANGE_UNITS = new Set(['day', 'week', 'month', 'year']);

const FLOW_SURFACE_DATE_VALUE_REPAIR_HINT =
  'Date filter values must use NocoBase-supported date values such as "2026-05-17", ["2026-05-01","2026-05-31"], or UI relative date descriptors like {"type":"past","number":14,"unit":"day"}.';

const FLOW_SURFACE_DATE_VALUE_REPAIR_EXAMPLE = {
  logic: '$and',
  items: [
    {
      path: 'lastFollowUpAt',
      operator: '$dateBefore',
      value: { type: 'past', number: 14, unit: 'day' },
    },
  ],
};

const FLOW_SURFACE_KNOWN_FILTER_OPERATORS = buildFlowSurfaceKnownFilterOperators();

function buildFlowSurfaceKnownFilterOperators() {
  const operators = new Set(Object.keys(databaseOperators));
  for (const key in Op) {
    operators.add(`$${key}`);
    const underscored = Utils.underscoredIf(key, true);
    operators.add(`$${underscored}`);
    operators.add(`$${underscored.replace(/_/g, '')}`);
  }
  return operators;
}

function getSuggestedFlowSurfaceFilterOperator(operator: string) {
  if (operator.startsWith('$')) {
    return undefined;
  }
  const suggestedOperator = `$${operator}`;
  return FLOW_SURFACE_KNOWN_FILTER_OPERATORS.has(suggestedOperator) ? suggestedOperator : undefined;
}

export function assertFlowSurfaceFilterOperator(operator: unknown, path: string) {
  if (typeof operator !== 'string' || !operator.trim()) {
    throwBadRequest(`${path} must be a non-empty operator string`, {
      path,
      ruleId: 'filter-group-operator-invalid',
      details: {
        invalidOperator: operator,
        repairHint: FLOW_SURFACE_FILTER_OPERATOR_REPAIR_HINT,
        repairExample: FLOW_SURFACE_FILTER_OPERATOR_REPAIR_EXAMPLE,
      },
    });
  }

  if (!operator.startsWith('$')) {
    const suggestedOperator = getSuggestedFlowSurfaceFilterOperator(operator);
    throwBadRequest(
      suggestedOperator
        ? `${path} must start with "$"; use "${suggestedOperator}" instead of "${operator}"`
        : `${path} must start with "$"`,
      {
        path,
        ruleId: 'filter-group-operator-missing-dollar',
        details: {
          invalidOperator: operator,
          ...(suggestedOperator ? { suggestedOperator } : {}),
          repairHint: FLOW_SURFACE_FILTER_OPERATOR_REPAIR_HINT,
          repairExample: FLOW_SURFACE_FILTER_OPERATOR_REPAIR_EXAMPLE,
        },
      },
    );
  }
}

export function normalizeFlowSurfaceFilterDateValue(operator: unknown, value: unknown, path: string) {
  if (typeof operator !== 'string' || !FLOW_SURFACE_DATE_FILTER_OPERATORS.has(operator)) {
    return value;
  }
  return normalizeFlowSurfaceDateValue(value, path);
}

export function normalizeFlowSurfaceFilterGroupValue(value: any, errorPrefix: string) {
  const normalized =
    value === null || (_.isPlainObject(value) && !Object.keys(value).length)
      ? _.cloneDeep(FLOW_SURFACE_EMPTY_FILTER_GROUP)
      : _.cloneDeep(value);

  try {
    assertFlowSurfaceFilterGroupShape(normalized);
    assertFlowSurfaceFilterGroupOperators(normalized, errorPrefix);
    normalizeFlowSurfaceFilterGroupDateValues(normalized, errorPrefix);
    transformFilter(normalized);
    return normalized;
  } catch (error) {
    if (error instanceof FlowSurfaceBadRequestError) {
      throw error;
    }
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

function assertFlowSurfaceFilterGroupOperators(filter: any, errorPrefix: string) {
  filter.items.forEach((item: any, index: number) => {
    const itemPath = `${errorPrefix}.items[${index}]`;
    if (_.isPlainObject(item) && 'logic' in item && 'items' in item) {
      assertFlowSurfaceFilterGroupOperators(item, itemPath);
      return;
    }
    assertFlowSurfaceFilterOperator(item.operator, `${itemPath}.operator`);
  });
}

function normalizeFlowSurfaceFilterGroupDateValues(filter: any, errorPrefix: string) {
  filter.items.forEach((item: any, index: number) => {
    const itemPath = `${errorPrefix}.items[${index}]`;
    if (_.isPlainObject(item) && 'logic' in item && 'items' in item) {
      normalizeFlowSurfaceFilterGroupDateValues(item, itemPath);
      return;
    }
    item.value = normalizeFlowSurfaceFilterDateValue(item.operator, item.value, `${itemPath}.value`);
  });
}

function normalizeFlowSurfaceDateValue(value: unknown, path: string): unknown {
  if (_.isNil(value) || value === '') {
    return value;
  }

  if (Array.isArray(value)) {
    const normalized = normalizeFlowSurfaceDateArrayValue(value, path);
    if (!hasTemplateDateValue(normalized)) {
      assertFlowSurfaceDateValueParsable(normalized, path);
    }
    return normalized;
  }

  const normalized = normalizeFlowSurfaceDateValuePart(value, path);
  if (!hasTemplateDateValue(normalized)) {
    assertFlowSurfaceDateValueParsable(normalized, path);
  }
  return normalized;
}

function normalizeFlowSurfaceDateArrayValue(value: unknown[], path: string) {
  if (value.length !== 2) {
    throwInvalidFlowSurfaceDateValue(path, value, {
      invalidReason: 'date range arrays must contain exactly start and end values',
    });
  }
  return value.map((item, index) => normalizeFlowSurfaceDateValuePart(item, `${path}[${index}]`));
}

function normalizeFlowSurfaceDateValuePart(value: unknown, path: string): unknown {
  if (_.isNil(value) || value === '' || isTemplateDateString(value) || value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const relative = normalizeRelativeDateShorthand(value, path);
    if (relative) {
      return relative;
    }
    assertFlowSurfaceDateValueParsable(value, path);
    return value;
  }

  if (_.isPlainObject(value)) {
    return normalizeRelativeDateDescriptor(value, path);
  }

  assertFlowSurfaceDateValueParsable(value, path);
  return value;
}

function normalizeRelativeDateShorthand(value: string, path: string) {
  const match = /^\s*([+-])(\d+)d\s*$/i.exec(value);
  if (!match) {
    return undefined;
  }
  return normalizeRelativeDateDescriptor(
    {
      type: match[1] === '-' ? 'past' : 'next',
      number: Number(match[2]),
      unit: 'day',
    },
    path,
  );
}

function normalizeRelativeDateDescriptor(value: Record<string, any>, path: string) {
  const rawType = value.type;
  const type = typeof rawType === 'string' ? rawType.trim() : '';
  if (!isTemplateDateString(rawType) && !FLOW_SURFACE_DATE_RANGE_TYPES.has(type)) {
    throwInvalidFlowSurfaceDateValue(path, value, {
      invalidReason: type ? `unsupported relative date type "${type}"` : 'relative date descriptor must include type',
    });
  }

  const normalized = {
    ...value,
    type: isTemplateDateString(rawType) ? rawType : type,
  };

  if (type === 'past' || type === 'next') {
    if (_.isUndefined(value.number)) {
      normalized.number = 1;
    } else if (!isTemplateDateString(value.number)) {
      const number = Number(value.number);
      if (!Number.isFinite(number) || number <= 0) {
        throwInvalidFlowSurfaceDateValue(path, value, {
          invalidReason: 'past/next relative date descriptor number must be greater than 0',
        });
      }
      normalized.number = number;
    }
    if (_.isUndefined(value.unit)) {
      normalized.unit = 'day';
    } else if (!isTemplateDateString(value.unit)) {
      const unit = typeof value.unit === 'string' ? value.unit.trim() : '';
      if (!FLOW_SURFACE_DATE_RANGE_UNITS.has(unit)) {
        throwInvalidFlowSurfaceDateValue(path, value, {
          invalidReason: `unsupported relative date unit "${unit}"`,
        });
      }
      normalized.unit = unit;
    }
  } else {
    if (!_.isUndefined(value.number) && !isTemplateDateString(value.number)) {
      const number = Number(value.number);
      if (!Number.isFinite(number) || number <= 0) {
        throwInvalidFlowSurfaceDateValue(path, value, {
          invalidReason: 'relative date descriptor number must be greater than 0',
        });
      }
      normalized.number = number;
    }
    if (!_.isUndefined(value.unit) && !isTemplateDateString(value.unit)) {
      const unit = typeof value.unit === 'string' ? value.unit.trim() : '';
      if (!FLOW_SURFACE_DATE_RANGE_UNITS.has(unit)) {
        throwInvalidFlowSurfaceDateValue(path, value, {
          invalidReason: `unsupported relative date unit "${unit}"`,
        });
      }
      normalized.unit = unit;
    }
  }

  if (!hasTemplateDateValue(normalized)) {
    try {
      getDayRangeByParams(normalized as Parameters<typeof getDayRangeByParams>[0]);
    } catch (error) {
      throwInvalidFlowSurfaceDateValue(path, value, {
        invalidReason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return normalized;
}

function isTemplateDateString(value: unknown): value is string {
  return typeof value === 'string' && /^\s*\{\{[\s\S]*\}\}\s*$/.test(value);
}

function hasTemplateDateValue(value: unknown): boolean {
  if (isTemplateDateString(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasTemplateDateValue(item));
  }
  if (_.isPlainObject(value)) {
    return Object.values(value).some((item) => hasTemplateDateValue(item));
  }
  return false;
}

function assertFlowSurfaceDateValueParsable(value: unknown, path: string) {
  try {
    const parsed = parseDate(value);
    if (parsed) {
      return;
    }
  } catch {
    // Fall through to the structured Flow Surfaces error below.
  }
  throwInvalidFlowSurfaceDateValue(path, value);
}

function throwInvalidFlowSurfaceDateValue(path: string, value: unknown, details: Record<string, any> = {}): never {
  throwBadRequest(`${path} must be a valid date filter value`, {
    path,
    ruleId: 'filter-group-date-value-invalid',
    details: {
      invalidValue: value,
      ...details,
      repairHint: FLOW_SURFACE_DATE_VALUE_REPAIR_HINT,
      repairExample: FLOW_SURFACE_DATE_VALUE_REPAIR_EXAMPLE,
    },
  });
}
