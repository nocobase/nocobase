/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const ARRAY_VALUE_OPERATORS = new Set([
  '$match',
  '$notMatch',
  '$anyOf',
  '$noneOf',
  '$childIn',
  '$childNotIn',
  '$in',
  '$notIn',
]);

function isObjectWithType(value: unknown): value is { type: unknown } {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'type' in (value as any);
}

function isEmptyScalar(value: unknown) {
  if (value === null || typeof value === 'undefined') return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * Normalize filter value based on operator expected shape.
 *
 * - Multi-value operators: normalize scalar -> [value]
 * - $dateBetween: normalize scalar date -> [date, date]
 *
 * Note: For date variables (object with `type`), keep as-is because operators can resolve it to ranges.
 */
export function normalizeFilterValueByOperator(operator: string | undefined, rawValue: any) {
  if (!operator) return rawValue;

  // Date range: must be [start, end]
  if (operator === '$dateBetween') {
    if (rawValue === null || typeof rawValue === 'undefined') return rawValue;

    // Keep date variable objects (e.g. { type: 'today', ... }) as-is.
    if (isObjectWithType(rawValue)) return rawValue;

    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) return rawValue;

      const first = rawValue[0];
      const second = rawValue.length > 1 ? rawValue[1] : undefined;

      const firstEmpty = isEmptyScalar(first);
      const secondEmpty = isEmptyScalar(second);

      // [d] -> [d, d]
      if (rawValue.length === 1 && !firstEmpty) {
        return [first, first];
      }

      // [d, ''] / ['', d] -> [d, d]
      if (!firstEmpty && secondEmpty) {
        return [first, first];
      }
      if (firstEmpty && !secondEmpty) {
        return [second, second];
      }

      return rawValue;
    }

    // scalar -> [d, d]
    return [rawValue, rawValue];
  }

  // Operators that require array values
  if (ARRAY_VALUE_OPERATORS.has(operator)) {
    if (rawValue === null || typeof rawValue === 'undefined') return rawValue;
    if (Array.isArray(rawValue)) return rawValue;

    // empty string -> []
    if (typeof rawValue === 'string' && rawValue.trim() === '') {
      return [];
    }

    return [rawValue];
  }

  return rawValue;
}
