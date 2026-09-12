/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isCtxDateExpression, isRunJSValue, isVariableExpression, serializeCtxDateValue } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import type { ExactDatePickerMode } from '../FieldAssignExactDatePicker';

const DATE_FIELD_INTERFACES = new Set([
  'date',
  'dateOnly',
  'datetime',
  'datetimeNoTz',
  'createdAt',
  'updatedAt',
  'unixTimestamp',
]);
const TZ_AWARE_DATE_INTERFACES = new Set(['datetime', 'createdAt', 'updatedAt', 'unixTimestamp']);
const DATE_ONLY_OUTPUT_FORMAT = 'YYYY-MM-DD';
const DATETIME_NO_TZ_OUTPUT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type DateFieldLike = {
  interface?: unknown;
  type?: unknown;
  getComponentProps?: () => unknown;
  uiSchema?: Record<string, unknown>;
};

export type DateVariableExactNormalizeMode = 'none' | 'date' | 'datetimeNoTz' | 'iso';

export type DateVariableComponentProps = {
  picker: ExactDatePickerMode;
  showTime: boolean;
  timeFormat: string;
  format: string;
  exactNormalizeMode: DateVariableExactNormalizeMode;
};

export const DEFAULT_DATE_VARIABLE_COMPONENT_PROPS: DateVariableComponentProps = {
  picker: 'date',
  showTime: false,
  timeFormat: 'HH:mm:ss',
  format: DATE_ONLY_OUTPUT_FORMAT,
  exactNormalizeMode: 'none',
};

export function getFieldInterface(field: DateFieldLike | null | undefined): string {
  return typeof field?.interface === 'string' ? field.interface : '';
}

function getFieldComponentProps(field: DateFieldLike | null | undefined): Record<string, unknown> {
  const fromGetter = typeof field?.getComponentProps === 'function' ? field.getComponentProps() : undefined;
  if (fromGetter && typeof fromGetter === 'object' && !Array.isArray(fromGetter)) {
    return fromGetter as Record<string, unknown>;
  }
  const fromSchema = field?.uiSchema?.['x-component-props'];
  return fromSchema && typeof fromSchema === 'object' && !Array.isArray(fromSchema)
    ? (fromSchema as Record<string, unknown>)
    : {};
}

function normalizeExactDatePickerMode(value: unknown): ExactDatePickerMode {
  if (value === 'year' || value === 'quarter' || value === 'month' || value === 'date') {
    return value;
  }
  return 'date';
}

function getDateVariableExactNormalizeMode(
  fieldInterface: string,
  field: DateFieldLike | null | undefined,
): DateVariableExactNormalizeMode {
  if (fieldInterface === 'date' || fieldInterface === 'dateOnly' || field?.type === 'dateOnly') return 'date';
  if (fieldInterface === 'datetimeNoTz') return 'datetimeNoTz';
  if (TZ_AWARE_DATE_INTERFACES.has(fieldInterface)) return 'iso';
  return 'none';
}

export function isDateLikeField(
  field: DateFieldLike | null | undefined,
  fallbackFieldName?: string,
  fallbackFieldInterface?: string,
): boolean {
  const fieldInterface = getFieldInterface(field) || fallbackFieldInterface || '';
  if (DATE_FIELD_INTERFACES.has(fieldInterface) || field?.type === 'dateOnly') return true;
  return fallbackFieldName === 'createdAt' || fallbackFieldName === 'updatedAt';
}

export function resolveDateVariableComponentProps(
  field: DateFieldLike | null | undefined,
  fieldInterface = getFieldInterface(field),
): DateVariableComponentProps {
  const componentProps = getFieldComponentProps(field);
  const picker = normalizeExactDatePickerMode(componentProps.picker);
  const isDateOnly = fieldInterface === 'date' || fieldInterface === 'dateOnly' || field?.type === 'dateOnly';
  const inferredShowTime = ['datetime', 'datetimeNoTz', 'createdAt', 'updatedAt', 'unixTimestamp'].includes(
    fieldInterface,
  );
  const showTime = isDateOnly
    ? false
    : typeof componentProps.showTime === 'boolean'
      ? componentProps.showTime
      : inferredShowTime;
  const configuredFormat = typeof componentProps.format === 'string' ? componentProps.format : '';
  const dateFormat =
    typeof componentProps.dateFormat === 'string' && componentProps.dateFormat
      ? componentProps.dateFormat
      : configuredFormat.split(' ')[0] || DATE_ONLY_OUTPUT_FORMAT;
  const timeFormat =
    typeof componentProps.timeFormat === 'string' && componentProps.timeFormat ? componentProps.timeFormat : 'HH:mm:ss';
  const format = isDateOnly ? dateFormat : configuredFormat || (showTime ? `${dateFormat} ${timeFormat}` : dateFormat);

  return {
    picker,
    showTime,
    timeFormat,
    format,
    exactNormalizeMode: getDateVariableExactNormalizeMode(fieldInterface, field),
  };
}

function parseDateByFormat(value: string, format: string): dayjs.Dayjs | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  if (hasTimezone) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) return parsed;
  }

  if (format) {
    const strict = dayjs(raw, format, true);
    if (strict.isValid()) return strict;
  }

  const fallback = dayjs(raw);
  if (fallback.isValid()) return fallback;

  if (format) {
    const loose = dayjs(raw, format);
    if (loose.isValid()) return loose;
  }

  return null;
}

function parseDateFromRawValue(value: unknown, format: string): dayjs.Dayjs | null {
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) {
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate : null;
  }
  return typeof value === 'string' ? parseDateByFormat(value, format) : null;
}

function normalizeExactDateValue(
  value: unknown,
  options: Pick<DateVariableComponentProps, 'format' | 'showTime' | 'exactNormalizeMode'>,
): unknown {
  const parsed = parseDateFromRawValue(value, options.format);
  if (!parsed?.isValid()) return value;

  switch (options.exactNormalizeMode) {
    case 'date':
      return parsed.format(DATE_ONLY_OUTPUT_FORMAT);
    case 'datetimeNoTz':
      return parsed.format(options.showTime ? DATETIME_NO_TZ_OUTPUT_FORMAT : DATE_ONLY_OUTPUT_FORMAT);
    case 'iso':
      return parsed.toISOString();
    default:
      return value;
  }
}

export function normalizeDateVariableExactValue(
  rawValue: unknown,
  options: Pick<DateVariableComponentProps, 'format' | 'showTime' | 'exactNormalizeMode'>,
): unknown {
  if (options.exactNormalizeMode === 'none') return rawValue;
  if (typeof rawValue === 'string' || dayjs.isDayjs(rawValue) || rawValue instanceof Date) {
    return normalizeExactDateValue(rawValue, options);
  }
  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => {
      if (typeof item === 'string' || dayjs.isDayjs(item) || item instanceof Date) {
        return normalizeExactDateValue(item, options);
      }
      return item;
    });
  }
  return rawValue;
}

export function toExactPickerDisplayValue(
  rawValue: unknown,
  options: { format: string; isRange: boolean },
): dayjs.Dayjs | [dayjs.Dayjs, dayjs.Dayjs] | null {
  if (options.isRange) {
    if (!Array.isArray(rawValue)) return null;
    const left = parseDateFromRawValue(rawValue[0], options.format);
    const right = parseDateFromRawValue(rawValue[1], options.format);
    return left && right ? [left, right] : null;
  }
  return parseDateFromRawValue(rawValue, options.format);
}

/** Compatibility helper retained for existing callers and tests. */
export function normalizeDateVariableOutput(rawValue: unknown, options: DateVariableComponentProps): unknown {
  if (rawValue === null || isRunJSValue(rawValue)) return rawValue;
  if (typeof rawValue === 'string' && isVariableExpression(rawValue) && !isCtxDateExpression(rawValue)) {
    return rawValue;
  }
  if (rawValue === '' || typeof rawValue === 'undefined') return '';

  const normalized = normalizeDateVariableExactValue(rawValue, options);
  return serializeCtxDateValue(normalized) || normalized;
}
