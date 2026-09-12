/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { operators as databaseOperators } from '@nocobase/database';
import { dayjs, getDayRangeByParams, transformFilter } from '@nocobase/utils';
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

export const FLOW_SURFACE_DATE_FILTER_OPERATORS = new Set([
  '$dateOn',
  '$dateNotOn',
  '$dateBefore',
  '$dateAfter',
  '$dateNotBefore',
  '$dateNotAfter',
  '$dateBetween',
]);

const FLOW_SURFACE_DATE_COMPARISON_OPERATORS = new Set(['$eq', '$ne', '$lt', '$lte', '$gt', '$gte', '$in', '$notIn']);

const FLOW_SURFACE_EMPTY_FILTER_OPERATORS = new Set(['$empty', '$notEmpty', '$exists', '$notExists']);

const FLOW_SURFACE_DATE_LIKE_TYPES = new Set([
  'date',
  'datetime',
  'dateonly',
  'datetimenotz',
  'unixtimestamp',
  'createdat',
  'updatedat',
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
const FLOW_SURFACE_RELATIVE_DATE_DESCRIPTOR_KEYS = new Set(['type', 'number', 'unit']);
const FLOW_SURFACE_EXACT_DATE_VALUE_FORMATS = ['YYYY-MM-DD', 'YYYY-MM', 'YYYY', 'YYYY[Q]Q', 'YYYY-[Q]Q'];

const FLOW_SURFACE_DATE_VALUE_REPAIR_HINT =
  'Date filter values must match the NocoBase filter UI contract: exact values like "2026-05-17", "2026-05", "2026", "2026-Q2", ranges like ["2026-05-01","2026-05-31"], or relative date descriptors like {"type":"past","number":14,"unit":"day"} and {"type":"thisWeek"}.';

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

const FLOW_SURFACE_DATE_CONDITION_REPAIR_HINT =
  'Date/DateTime condition values must be valid UI date values or safe context-path templates. Do not use template arithmetic such as {{$now - 14 * 24 * 60 * 60 * 1000}}; use date operators such as $dateBefore with a relative descriptor instead.';

const FLOW_SURFACE_DATE_CONDITION_REPAIR_EXAMPLE = {
  logic: '$and',
  items: [
    {
      path: 'lastFollowUpAt',
      operator: '$dateBefore',
      value: { type: 'past', number: 14, unit: 'day' },
    },
  ],
};

const FLOW_SURFACE_ISO_DATE_VALUE_RE =
  /^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const FLOW_SURFACE_KNOWN_FILTER_OPERATORS = buildFlowSurfaceKnownFilterOperators();

type FlowSurfaceRelativeDateDescriptor = Record<string, unknown> & {
  type: string;
  number?: unknown;
  unit?: unknown;
};

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

export function normalizeFlowSurfaceFilterDateValue(
  operator: unknown,
  value: unknown,
  path: string,
  options: {
    allowContextPathValue?: boolean;
  } = {},
) {
  if (typeof operator !== 'string' || !FLOW_SURFACE_DATE_FILTER_OPERATORS.has(operator)) {
    return value;
  }
  if (options.allowContextPathValue && isFlowSurfaceContextPathValueObject(value)) {
    return value;
  }
  return normalizeFlowSurfaceDateValue(value, path);
}

export function normalizeFlowSurfaceStrictFilterDateValue(
  operator: unknown,
  value: unknown,
  path: string,
  options: {
    allowContextPathValue?: boolean;
  } = {},
) {
  if (typeof operator !== 'string' || !FLOW_SURFACE_DATE_FILTER_OPERATORS.has(operator)) {
    return value;
  }
  if (_.isNil(value) || value === '') {
    throwInvalidFlowSurfaceDateValue(path, value, {
      invalidReason: 'date filter value is required',
    });
  }
  if (options.allowContextPathValue && isFlowSurfaceContextPathValueObject(value)) {
    return value;
  }
  return normalizeFlowSurfaceDateValue(value, path);
}

export function isFlowSurfaceDateLikeFieldMeta(value: { type?: unknown; interface?: unknown } | undefined | null) {
  const fieldType = String(value?.type || '')
    .trim()
    .toLowerCase();
  const fieldInterface = String(value?.interface || '')
    .trim()
    .toLowerCase();
  return FLOW_SURFACE_DATE_LIKE_TYPES.has(fieldType) || FLOW_SURFACE_DATE_LIKE_TYPES.has(fieldInterface);
}

export function normalizeFlowSurfaceDateConditionValue(
  operator: unknown,
  value: unknown,
  path: string,
  options: {
    fieldPath?: string;
    fieldType?: unknown;
    fieldInterface?: unknown;
    allowContextPathValue?: boolean;
  } = {},
) {
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : '';
  if (!normalizedOperator || FLOW_SURFACE_EMPTY_FILTER_OPERATORS.has(normalizedOperator)) {
    return value;
  }
  if (options.allowContextPathValue && isFlowSurfaceContextPathValueObject(value)) {
    return value;
  }
  if (FLOW_SURFACE_DATE_FILTER_OPERATORS.has(normalizedOperator)) {
    assertNoUnsafeFlowSurfaceDateTemplateValues(value, path, options);
    return normalizeFlowSurfaceStrictFilterDateValue(normalizedOperator, value, path);
  }
  if (!FLOW_SURFACE_DATE_COMPARISON_OPERATORS.has(normalizedOperator)) {
    return value;
  }
  return normalizeFlowSurfaceDateComparisonValue(normalizedOperator, value, path, options);
}

export function normalizeFlowSurfaceFilterGroupValue(
  value: any,
  errorPrefix: string,
  options: {
    strictDateValues?: boolean;
    allowContextPathValue?: boolean;
  } = {},
) {
  const normalized =
    value === null || (_.isPlainObject(value) && !Object.keys(value).length)
      ? _.cloneDeep(FLOW_SURFACE_EMPTY_FILTER_GROUP)
      : _.cloneDeep(value);

  try {
    assertFlowSurfaceFilterGroupShape(normalized);
    assertFlowSurfaceFilterGroupOperators(normalized, errorPrefix);
    normalizeFlowSurfaceFilterGroupDateValues(normalized, errorPrefix, options);
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

export function normalizeFlowSurfaceCompatibleFilterGroupValue(
  value: unknown,
  errorPrefix: string,
  options: {
    strictDateValues?: boolean;
    allowContextPathValue?: boolean;
  } = {},
) {
  const input =
    value === null || (_.isPlainObject(value) && !Object.keys(value).length)
      ? _.cloneDeep(FLOW_SURFACE_EMPTY_FILTER_GROUP)
      : _.cloneDeep(value);

  if (isFlowSurfaceFilterGroupLike(input)) {
    return normalizeFlowSurfaceFilterGroupValue(input, errorPrefix, options);
  }

  try {
    const converted = convertBackendQueryFilterToFlowSurfaceFilterGroup(input, errorPrefix);
    return normalizeFlowSurfaceFilterGroupValue(converted, errorPrefix, options);
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
  const unsupportedKeys = Object.keys(filter).filter((key) => key !== 'logic' && key !== 'items');
  if (unsupportedKeys.length) {
    throw new Error(`Invalid filter: filter group does not support: ${unsupportedKeys.join(', ')}`);
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

function isFlowSurfaceFilterGroupLike(value: unknown) {
  if (!_.isPlainObject(value)) {
    return false;
  }
  const filter = value as Record<string, unknown>;
  return 'logic' in filter && 'items' in filter;
}

function isBackendQueryLogicKey(key: string): key is '$and' | '$or' {
  return key === '$and' || key === '$or';
}

function convertBackendQueryFilterToFlowSurfaceFilterGroup(input: unknown, label: string) {
  if (!_.isPlainObject(input)) {
    throw new Error('Invalid filter: filter must be an object');
  }

  const keys = Object.keys(input);
  const logicKeys = keys.filter(isBackendQueryLogicKey);
  if (logicKeys.length > 1 || (logicKeys.length === 1 && keys.length > 1)) {
    throw new Error('cannot convert backend query filter with mixed logical and field conditions');
  }
  if (logicKeys.length === 1) {
    const logic = logicKeys[0];
    const operands = (input as Record<string, unknown>)[logic];
    if (!Array.isArray(operands)) {
      throw new Error(`${logic}: backend query filter operands must be an array`);
    }
    return {
      logic,
      items: operands.map((operand, index) => convertBackendQueryOperandToFlowSurfaceFilterItem(operand, label, index)),
    };
  }

  if (keys.some((key) => key.startsWith('$'))) {
    throw new Error('cannot convert backend query filter with unsupported logical operator');
  }

  return {
    logic: '$and',
    items: Object.entries(input).flatMap(([field, condition]) =>
      convertBackendFieldConditionToFlowSurfaceFilterItems(field, condition, label),
    ),
  };
}

function convertBackendQueryOperandToFlowSurfaceFilterItem(input: unknown, label: string, index: number) {
  if (isFlowSurfaceFilterGroupLike(input)) {
    throw new Error(`${label}.$operand[${index}]: cannot mix filter groups with backend query filters`);
  }
  const group = convertBackendQueryFilterToFlowSurfaceFilterGroup(input, `${label}.$operand[${index}]`);
  if (group.logic === '$and' && group.items.length === 1) {
    return group.items[0];
  }
  return group;
}

function convertBackendFieldConditionToFlowSurfaceFilterItems(field: string, condition: unknown, label: string): any[] {
  if (!field.trim() || field.startsWith('$')) {
    throw new Error(`cannot convert backend query filter field "${field}"`);
  }
  if (!_.isPlainObject(condition)) {
    throw new Error(`${field}: backend query filter condition must be an object`);
  }

  const keys = Object.keys(condition);
  if (!keys.length) {
    throw new Error(`${field}: backend query filter condition cannot be empty`);
  }

  const operatorKeys = keys.filter((key) => key.startsWith('$'));
  if (operatorKeys.length) {
    if (operatorKeys.length !== keys.length) {
      throw new Error(`${field}: cannot mix backend query operators with nested field conditions`);
    }
    return operatorKeys.map((operator) => {
      if (isBackendQueryLogicKey(operator)) {
        throw new Error(`${field}: cannot convert backend query filter operator "${operator}"`);
      }
      assertFlowSurfaceFilterOperator(operator, `${label}.${field}.${operator}`);
      return {
        path: field,
        operator,
        value: _.cloneDeep(_.get(condition, operator)),
      };
    });
  }

  return Object.entries(condition).flatMap(([nestedField, nestedCondition]) =>
    convertBackendFieldConditionToFlowSurfaceFilterItems(`${field}.${nestedField}`, nestedCondition, label),
  );
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

function normalizeFlowSurfaceFilterGroupDateValues(
  filter: any,
  errorPrefix: string,
  options: {
    strictDateValues?: boolean;
    allowContextPathValue?: boolean;
  },
) {
  filter.items.forEach((item: any, index: number) => {
    const itemPath = `${errorPrefix}.items[${index}]`;
    if (_.isPlainObject(item) && 'logic' in item && 'items' in item) {
      normalizeFlowSurfaceFilterGroupDateValues(item, itemPath, options);
      return;
    }
    item.value = options.strictDateValues
      ? normalizeFlowSurfaceStrictFilterDateValue(item.operator, item.value, `${itemPath}.value`, {
          allowContextPathValue: options.allowContextPathValue,
        })
      : normalizeFlowSurfaceFilterDateValue(item.operator, item.value, `${itemPath}.value`, {
          allowContextPathValue: options.allowContextPathValue,
        });
  });
}

function normalizeFlowSurfaceDateValue(value: unknown, path: string): unknown {
  if (_.isNil(value) || value === '') {
    return value;
  }

  if (Array.isArray(value)) {
    return normalizeFlowSurfaceDateArrayValue(value, path);
  }

  return normalizeFlowSurfaceDateValuePart(value, path);
}

function normalizeFlowSurfaceDateComparisonValue(
  operator: string,
  value: unknown,
  path: string,
  options: {
    fieldPath?: string;
    fieldType?: unknown;
    fieldInterface?: unknown;
    allowContextPathValue?: boolean;
  },
) {
  if (operator === '$in' || operator === '$notIn') {
    if (!Array.isArray(value)) {
      throwInvalidFlowSurfaceDateConditionValue(path, value, {
        ...options,
        operator,
        invalidReason: 'date comparison array operators require an array value',
      });
    }
    return value.map((item, index) =>
      normalizeFlowSurfaceDateComparisonValuePart(item, `${path}[${index}]`, {
        ...options,
        operator,
      }),
    );
  }
  return normalizeFlowSurfaceDateComparisonValuePart(value, path, {
    ...options,
    operator,
  });
}

function normalizeFlowSurfaceDateComparisonValuePart(
  value: unknown,
  path: string,
  options: {
    fieldPath?: string;
    fieldType?: unknown;
    fieldInterface?: unknown;
    allowContextPathValue?: boolean;
    operator?: string;
  },
) {
  if (_.isNil(value) || value === '') {
    throwInvalidFlowSurfaceDateConditionValue(path, value, {
      ...options,
      invalidReason: 'date comparison value is required; use $empty or $notEmpty for empty checks',
    });
  }
  if (options.allowContextPathValue && isFlowSurfaceContextPathValueObject(value)) {
    return value;
  }
  if (isTemplateDateString(value)) {
    if (isUnsafeFlowSurfaceDateTemplateString(value)) {
      throwInvalidFlowSurfaceDateConditionValue(path, value, {
        ...options,
        invalidReason:
          'date condition template strings must be simple context-path references; template arithmetic, $now, Date/dayjs/moment calls, and Invalid date are not supported',
      });
    }
    return value;
  }
  if (_.isDate(value)) {
    if (!Number.isNaN(value.getTime())) {
      return value;
    }
    throwInvalidFlowSurfaceDateConditionValue(path, value, {
      ...options,
      invalidReason: 'date condition value must be a valid Date',
    });
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (/invalid\s+date/i.test(normalized)) {
      throwInvalidFlowSurfaceDateConditionValue(path, value, {
        ...options,
        invalidReason: 'date condition value cannot be Invalid date',
      });
    }
    if (isFlowSurfaceIsoLikeDateValue(normalized)) {
      return normalized;
    }
    throwInvalidFlowSurfaceDateConditionValue(path, value, {
      ...options,
      invalidReason: 'date comparison strings must use concrete YYYY-MM-DD or ISO-like date/datetime strings',
    });
  }
  if (_.isPlainObject(value)) {
    throwInvalidFlowSurfaceDateConditionValue(path, value, {
      ...options,
      invalidReason:
        'relative date descriptors require date operators such as $dateBefore or $dateBetween instead of comparison operators',
    });
  }
  throwInvalidFlowSurfaceDateConditionValue(path, value, {
    ...options,
    invalidReason:
      'date condition value must be an exact date string, ISO datetime string, or safe context path template',
  });
}

function normalizeFlowSurfaceDateArrayValue(value: unknown[], path: string) {
  if (value.length !== 2) {
    throwInvalidFlowSurfaceDateValue(path, value, {
      invalidReason: 'date range arrays must contain exactly start and end values',
    });
  }
  return value.map((item, index) => normalizeFlowSurfaceExactDateValuePart(item, `${path}[${index}]`));
}

function normalizeFlowSurfaceDateValuePart(value: unknown, path: string): unknown {
  if (_.isNil(value) || value === '' || isTemplateDateString(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return normalizeFlowSurfaceExactDateValuePart(value, path);
  }

  if (_.isPlainObject(value)) {
    return normalizeRelativeDateDescriptor(value as Record<string, unknown>, path);
  }

  throwInvalidFlowSurfaceDateValue(path, value, {
    invalidReason: 'date filter value must be an exact date string, date range array, or relative date descriptor',
  });
}

function normalizeFlowSurfaceExactDateValuePart(value: unknown, path: string) {
  if (isTemplateDateString(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (isFlowSurfaceExactDateValue(normalized)) {
      return normalized;
    }
  }
  throwInvalidFlowSurfaceDateValue(path, value, {
    invalidReason: 'date filter strings must use UI exact date formats YYYY-MM-DD, YYYY-MM, YYYY, YYYYQn, or YYYY-Qn',
  });
}

function isFlowSurfaceExactDateValue(value: string) {
  return FLOW_SURFACE_EXACT_DATE_VALUE_FORMATS.some((format) => {
    const parsed = dayjs(value, format, true);
    return parsed.isValid() && parsed.format(format) === value;
  });
}

function isFlowSurfaceIsoLikeDateValue(value: string) {
  const match = FLOW_SURFACE_ISO_DATE_VALUE_RE.exec(value);
  if (!match) {
    return false;
  }
  const [year, month, day] = value
    .slice(0, 10)
    .split('-')
    .map((item) => Number(item));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return false;
  }
  const timeMatch = /[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?/.exec(value);
  if (!timeMatch) {
    return true;
  }
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] || 0);
  return hour <= 23 && minute <= 59 && second <= 59 && dayjs(value).isValid();
}

function normalizeRelativeDateDescriptor(value: Record<string, unknown>, path: string) {
  const invalidKeys = Object.keys(value).filter((key) => !FLOW_SURFACE_RELATIVE_DATE_DESCRIPTOR_KEYS.has(key));
  if (invalidKeys.length) {
    throwInvalidFlowSurfaceDateValue(path, value, {
      invalidReason: `relative date descriptor contains unsupported keys: ${invalidKeys.join(', ')}`,
    });
  }

  const rawType = value.type;
  const type = typeof rawType === 'string' ? rawType.trim() : '';
  if (!isTemplateDateString(rawType) && !FLOW_SURFACE_DATE_RANGE_TYPES.has(type)) {
    throwInvalidFlowSurfaceDateValue(path, value, {
      invalidReason: type ? `unsupported relative date type "${type}"` : 'relative date descriptor must include type',
    });
  }

  const normalized: FlowSurfaceRelativeDateDescriptor = {
    ...value,
    type: isTemplateDateString(rawType) ? rawType : type,
  };

  if (type === 'past' || type === 'next') {
    if (_.isUndefined(value.number)) {
      throwInvalidFlowSurfaceDateValue(path, value, {
        invalidReason: 'past/next relative date descriptor must include number',
      });
    } else if (!isTemplateDateString(value.number)) {
      if (typeof value.number !== 'number' || !Number.isFinite(value.number) || value.number <= 0) {
        throwInvalidFlowSurfaceDateValue(path, value, {
          invalidReason: 'past/next relative date descriptor number must be greater than 0',
        });
      }
      normalized.number = value.number;
    }
    if (_.isUndefined(value.unit)) {
      throwInvalidFlowSurfaceDateValue(path, value, {
        invalidReason: 'past/next relative date descriptor must include unit',
      });
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
    if (!_.isUndefined(value.number)) {
      throwInvalidFlowSurfaceDateValue(path, value, {
        invalidReason: `relative date descriptor type "${type}" must not include number`,
      });
    }
    if (!_.isUndefined(value.unit)) {
      throwInvalidFlowSurfaceDateValue(path, value, {
        invalidReason: `relative date descriptor type "${type}" must not include unit`,
      });
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

function isFlowSurfaceContextPathValueObject(value: unknown) {
  if (!_.isPlainObject(value) || (value as Record<string, unknown>).source !== 'path') {
    return false;
  }
  const path = (value as Record<string, unknown>).path;
  if (typeof path !== 'string') {
    return false;
  }
  const normalizedPath = path.trim();
  if (isTemplateDateString(normalizedPath)) {
    return !isUnsafeFlowSurfaceDateTemplateString(normalizedPath);
  }
  return isSimpleFlowSurfaceTemplateReference(normalizedPath);
}

function extractTemplateDateExpression(value: string) {
  return value
    .replace(/^\s*\{\{\s*/, '')
    .replace(/\s*\}\}\s*$/, '')
    .trim();
}

function isSimpleFlowSurfaceTemplateReference(expression: string) {
  const identifier = '[A-Za-z_$][A-Za-z0-9_$-]*';
  const segment = `(?:\\.${identifier}|\\[(?:\\d+|"[^"\\]]+"|'[^'\\]]+')\\])`;
  return new RegExp(`^${identifier}(?:${segment})*$`).test(expression.replace(/\s+/g, ''));
}

function isUnsafeFlowSurfaceDateTemplateString(value: string) {
  const expression = extractTemplateDateExpression(value);
  if (!expression) {
    return true;
  }
  if (/\$now\b/i.test(expression)) {
    return true;
  }
  if (/invalid\s+date/i.test(expression)) {
    return true;
  }
  if (/\bnew\s+Date\b|\bDate\s*\(|\bdayjs\s*\(|\bmoment\s*\(/.test(expression)) {
    return true;
  }
  if (isSimpleFlowSurfaceTemplateReference(expression)) {
    return false;
  }
  return /[+\-*/%()]|=>/.test(expression);
}

function assertNoUnsafeFlowSurfaceDateTemplateValues(
  value: unknown,
  path: string,
  options: {
    fieldPath?: string;
    fieldType?: unknown;
    fieldInterface?: unknown;
    operator?: string;
  } = {},
) {
  if (isTemplateDateString(value)) {
    if (isUnsafeFlowSurfaceDateTemplateString(value)) {
      throwInvalidFlowSurfaceDateConditionValue(path, value, {
        ...options,
        invalidReason:
          'date filter template strings must be simple context-path references; template arithmetic, $now, Date/dayjs/moment calls, and Invalid date are not supported',
      });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUnsafeFlowSurfaceDateTemplateValues(item, `${path}[${index}]`, options));
    return;
  }
  if (_.isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) =>
      assertNoUnsafeFlowSurfaceDateTemplateValues(item, `${path}.${key}`, options),
    );
  }
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

function throwInvalidFlowSurfaceDateConditionValue(
  path: string,
  value: unknown,
  details: Record<string, any> = {},
): never {
  throwBadRequest(`${path} must be a valid Date/DateTime condition value`, {
    path,
    ruleId: 'date-condition-value-invalid',
    details: {
      invalidValue: value,
      ...details,
      repairHint: FLOW_SURFACE_DATE_CONDITION_REPAIR_HINT,
      repairExample: FLOW_SURFACE_DATE_CONDITION_REPAIR_EXAMPLE,
    },
  });
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
