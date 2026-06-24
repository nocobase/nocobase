/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type {
  CollectionEnvelope,
  CollectionFieldEnvelope,
  DataSourceEnvelope,
  RunJSSettingsJSONValue,
  RunJSSettingField,
  RunJSSettingOptionValue,
  RunJSSettingsEnvelope,
  RunJSSettingsSchema,
} from './types';

const SAFE_KEY_RE = /^[A-Za-z0-9_-]+$/;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export class RunJSSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RunJSSettingsValidationError';
  }
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return _.isPlainObject(value);
}

export function isSafeRunJSSettingKey(key: string): boolean {
  return !!key && key.length <= 80 && SAFE_KEY_RE.test(key) && !DANGEROUS_KEYS.has(key);
}

export function assertSafeRunJSSettingKey(key: string, path = 'settings key') {
  if (!isSafeRunJSSettingKey(key)) {
    throw new RunJSSettingsValidationError(`${path} '${key}' is not a safe settings key`);
  }
}

export function isJSONValue(value: unknown, options: { maxDepth?: number } = {}): value is RunJSSettingsJSONValue {
  const maxDepth = options.maxDepth ?? 8;
  const visit = (input: unknown, depth: number): boolean => {
    if (depth > maxDepth) {
      return false;
    }
    if (input === null || typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
      return typeof input !== 'number' || Number.isFinite(input);
    }
    if (Array.isArray(input)) {
      return input.every((item) => visit(item, depth + 1));
    }
    if (!isPlainRecord(input)) {
      return false;
    }
    return Object.entries(input).every(([key, item]) => !DANGEROUS_KEYS.has(key) && visit(item, depth + 1));
  };
  return visit(value, 0);
}

export function assertJSONValue(value: unknown, path: string): asserts value is RunJSSettingsJSONValue {
  if (!isJSONValue(value)) {
    throw new RunJSSettingsValidationError(`${path} must be a safe JSON value`);
  }
}

function normalizeFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RunJSSettingsValidationError(`${path} must be a finite number`);
  }
  return value;
}

function normalizeString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new RunJSSettingsValidationError(`${path} must be a string`);
  }
  return value;
}

function normalizeBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new RunJSSettingsValidationError(`${path} must be a boolean`);
  }
  return value;
}

function normalizeOptionValue(value: unknown, path: string): RunJSSettingOptionValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value as null | string | boolean;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value as number;
  }
  if (typeof value === 'number') {
    throw new RunJSSettingsValidationError(`${path} must be a finite option value`);
  }
  throw new RunJSSettingsValidationError(`${path} must be a string, number, boolean, or null`);
}

function optionValues(field: RunJSSettingField): RunJSSettingOptionValue[] {
  return (field.options || []).map((option) => option.value);
}

function optionValueEquals(left: RunJSSettingOptionValue, right: RunJSSettingOptionValue) {
  return Object.is(left, right);
}

function assertSelectOptionValue(field: RunJSSettingField, value: RunJSSettingOptionValue, path: string) {
  if (!optionValues(field).some((candidate) => optionValueEquals(candidate, value))) {
    throw new RunJSSettingsValidationError(`${path} must match one of the declared options`);
  }
}

function activePropertyKeys(field: RunJSSettingField): string[] {
  return Object.keys(field.properties || {}).filter((key) => field.properties?.[key]?.visible !== false);
}

export function normalizeDateValue(value: unknown, path = 'date'): string {
  const normalized = normalizeString(value, path);
  if (!DATE_RE.test(normalized)) {
    throw new RunJSSettingsValidationError(`${path} must be a YYYY-MM-DD string`);
  }
  return normalized;
}

export function normalizeDateTimeValue(value: unknown, path = 'datetime'): string {
  const normalized = normalizeString(value, path);
  if (!DATETIME_RE.test(normalized) || Number.isNaN(Date.parse(normalized))) {
    throw new RunJSSettingsValidationError(`${path} must be an ISO 8601 string with timezone`);
  }
  return normalized;
}

export function normalizeColorValue(value: unknown, path = 'color'): string {
  const maybeColor = value as { toHexString?: unknown };
  if (isPlainRecord(value) && typeof maybeColor.toHexString === 'function') {
    return normalizeColorValue(maybeColor.toHexString(), path);
  }
  const normalized = normalizeString(value, path);
  if (!COLOR_RE.test(normalized)) {
    throw new RunJSSettingsValidationError(`${path} must be a #RRGGBB color string`);
  }
  return normalized.toUpperCase();
}

export function normalizeJsonValue(value: unknown, path = 'json'): RunJSSettingsJSONValue {
  assertJSONValue(value, path);
  return _.cloneDeep(value);
}

export function normalizeJsonTextValue(value: unknown, path = 'json'): RunJSSettingsJSONValue {
  let parsed: unknown;
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    throw new RunJSSettingsValidationError(`${path} must be valid JSON`);
  }
  return normalizeJsonValue(parsed, path);
}

export function normalizeDataSourceEnvelope(value: unknown, path = 'dataSource'): DataSourceEnvelope {
  if (!isPlainRecord(value) || value.$type !== 'dataSource' || typeof value.name !== 'string') {
    throw new RunJSSettingsValidationError(`${path} must be a dataSource envelope`);
  }
  const keys = Object.keys(value);
  if (keys.length !== 2 || !keys.includes('$type') || !keys.includes('name')) {
    throw new RunJSSettingsValidationError(`${path} contains unsupported dataSource envelope keys`);
  }
  return { $type: 'dataSource', name: value.name };
}

export function normalizeCollectionEnvelope(value: unknown, path = 'collection'): CollectionEnvelope {
  if (
    !isPlainRecord(value) ||
    value.$type !== 'collection' ||
    typeof value.dataSource !== 'string' ||
    typeof value.name !== 'string'
  ) {
    throw new RunJSSettingsValidationError(`${path} must be a collection envelope`);
  }
  const keys = Object.keys(value);
  if (keys.length !== 3 || !keys.includes('$type') || !keys.includes('dataSource') || !keys.includes('name')) {
    throw new RunJSSettingsValidationError(`${path} contains unsupported collection envelope keys`);
  }
  return { $type: 'collection', dataSource: value.dataSource, name: value.name };
}

export function normalizeCollectionFieldEnvelope(value: unknown, path = 'collectionField'): CollectionFieldEnvelope {
  if (
    !isPlainRecord(value) ||
    value.$type !== 'collectionField' ||
    typeof value.dataSource !== 'string' ||
    typeof value.collection !== 'string' ||
    typeof value.name !== 'string'
  ) {
    throw new RunJSSettingsValidationError(`${path} must be a collectionField envelope`);
  }
  const keys = Object.keys(value);
  if (
    keys.length !== 4 ||
    !keys.includes('$type') ||
    !keys.includes('dataSource') ||
    !keys.includes('collection') ||
    !keys.includes('name')
  ) {
    throw new RunJSSettingsValidationError(`${path} contains unsupported collectionField envelope keys`);
  }
  return {
    $type: 'collectionField',
    dataSource: value.dataSource,
    collection: value.collection,
    name: value.name,
  };
}

export function normalizeRunJSSettingsEnvelope(value: unknown, path = 'envelope'): RunJSSettingsEnvelope {
  if (!isPlainRecord(value) || typeof value.$type !== 'string') {
    throw new RunJSSettingsValidationError(`${path} must be a typed envelope`);
  }
  if (value.$type === 'dataSource') {
    return normalizeDataSourceEnvelope(value, path);
  }
  if (value.$type === 'collection') {
    return normalizeCollectionEnvelope(value, path);
  }
  if (value.$type === 'collectionField') {
    return normalizeCollectionFieldEnvelope(value, path);
  }
  throw new RunJSSettingsValidationError(`${path} has unsupported envelope type '${value.$type}'`);
}

export function normalizeSettingValueByFieldType(
  field: RunJSSettingField,
  value: unknown,
  path = 'value',
): RunJSSettingsJSONValue {
  if (typeof value === 'undefined') {
    return undefined as unknown as RunJSSettingsJSONValue;
  }
  switch (field.type) {
    case 'string':
    case 'text':
      return normalizeString(value, path);
    case 'number':
      return normalizeFiniteNumber(value, path);
    case 'boolean':
      return normalizeBoolean(value, path);
    case 'object': {
      if (!isPlainRecord(value)) {
        throw new RunJSSettingsValidationError(`${path} must be a plain object`);
      }
      const normalized: Record<string, RunJSSettingsJSONValue> = {};
      for (const key of activePropertyKeys(field)) {
        const property = field.properties?.[key];
        if (!property) {
          continue;
        }
        const candidate = Object.prototype.hasOwnProperty.call(value, key) ? value[key] : property.default;
        if (typeof candidate === 'undefined') {
          continue;
        }
        normalized[key] = normalizeSettingValueByFieldType(property, candidate, `${path}.${key}`);
      }
      return normalized;
    }
    case 'select': {
      const normalized = normalizeOptionValue(value, path);
      assertSelectOptionValue(field, normalized, path);
      return normalized;
    }
    case 'multiSelect': {
      if (!Array.isArray(value)) {
        throw new RunJSSettingsValidationError(`${path} must be an array`);
      }
      return value.map((item, index) => {
        const normalized = normalizeOptionValue(item, `${path}[${index}]`);
        assertSelectOptionValue(field, normalized, `${path}[${index}]`);
        return normalized;
      });
    }
    case 'date':
      return normalizeDateValue(value, path);
    case 'datetime':
      return normalizeDateTimeValue(value, path);
    case 'color':
      return normalizeColorValue(value, path);
    case 'json':
      return normalizeJsonValue(value, path);
    case 'dataSource':
      return normalizeDataSourceEnvelope(value, path);
    case 'collection':
      return normalizeCollectionEnvelope(value, path);
    case 'collectionField':
      return normalizeCollectionFieldEnvelope(value, path);
    default:
      throw new RunJSSettingsValidationError(`${path} uses unsupported field type`);
  }
}

export function normalizeSettingDraftValueByFieldType(
  field: RunJSSettingField,
  value: unknown,
  path = 'value',
  options: {
    hasPreviousValue?: boolean;
    previousValue?: unknown;
    hasDefaultValue?: boolean;
    defaultValue?: unknown;
  } = {},
): RunJSSettingsJSONValue {
  if (field.type === 'object') {
    if (!isPlainRecord(value)) {
      throw new RunJSSettingsValidationError(`${path} must be a plain object`);
    }
    const previousValue = isPlainRecord(options.previousValue) ? options.previousValue : {};
    const activeKeys = new Set(activePropertyKeys(field));
    const normalized: Record<string, RunJSSettingsJSONValue> = {};

    for (const [key, previousItem] of Object.entries(previousValue)) {
      assertSafeRunJSSettingKey(key);
      if (activeKeys.has(key)) {
        continue;
      }
      assertJSONValue(previousItem, `${path}.${key}`);
      normalized[key] = _.cloneDeep(previousItem);
    }

    for (const key of activePropertyKeys(field)) {
      const property = field.properties?.[key];
      if (!property) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(value, key) || typeof value[key] === 'undefined') {
        if (property.required) {
          throw new RunJSSettingsValidationError(`${path}.${key} is required`);
        }
        continue;
      }
      const hasPreviousValue = Object.prototype.hasOwnProperty.call(previousValue, key);
      normalized[key] = normalizeSettingDraftValueByFieldType(property, value[key], `${path}.${key}`, {
        hasPreviousValue,
        previousValue: hasPreviousValue ? previousValue[key] : undefined,
        hasDefaultValue: typeof property.default !== 'undefined',
        defaultValue: property.default,
      });
    }

    return normalized;
  }
  if (field.type !== 'json') {
    return normalizeSettingValueByFieldType(field, value, path);
  }
  if (typeof value === 'string') {
    if (options.hasPreviousValue && Object.is(value, options.previousValue)) {
      return normalizeJsonValue(value, path);
    }
    if (options.hasDefaultValue && Object.is(value, options.defaultValue)) {
      return normalizeJsonValue(value, path);
    }
    return normalizeJsonTextValue(value, path);
  }
  return normalizeJsonValue(value, path);
}

export function validateRunJSSettingsValues(
  schema: RunJSSettingsSchema,
  values: Record<string, unknown>,
): Record<string, RunJSSettingsJSONValue> {
  if (!isPlainRecord(values)) {
    throw new RunJSSettingsValidationError('settings values must be a plain object');
  }
  const normalized: Record<string, RunJSSettingsJSONValue> = {};
  for (const [key, value] of Object.entries(values)) {
    assertSafeRunJSSettingKey(key);
    const field = schema.fields[key];
    if (field && field.visible !== false) {
      normalized[key] = normalizeSettingValueByFieldType(field, value, `settings.${key}`);
      continue;
    }
    assertJSONValue(value, `settings.${key}`);
    normalized[key] = _.cloneDeep(value);
  }
  return normalized;
}

export function activeFieldKeys(schema: RunJSSettingsSchema): string[] {
  const ordered = schema.order?.filter((key) => schema.fields[key]) || Object.keys(schema.fields);
  const rest = Object.keys(schema.fields).filter((key) => !ordered.includes(key));
  return [...ordered, ...rest].filter((key) => schema.fields[key]?.visible !== false);
}

export function activeFieldKeysForItem(schema: RunJSSettingsSchema, itemKey: string): string[] {
  return schema.fields[itemKey]?.visible === false || !schema.fields[itemKey] ? [] : [itemKey];
}

export function pickRunJSSettingsSchemaFields(schema: RunJSSettingsSchema, fieldKeys: string[]): RunJSSettingsSchema {
  const fields: RunJSSettingsSchema['fields'] = {};
  const orderedKeys = fieldKeys.filter((key) => schema.fields[key]);
  orderedKeys.forEach((key) => {
    fields[key] = schema.fields[key];
  });
  const nextSchema: RunJSSettingsSchema = { fields };
  if (typeof schema.version !== 'undefined') {
    nextSchema.version = schema.version;
  }
  if (typeof schema.title !== 'undefined') {
    nextSchema.title = schema.title;
  }
  if (typeof schema.description !== 'undefined') {
    nextSchema.description = schema.description;
  }
  if (orderedKeys.length > 0) {
    nextSchema.order = orderedKeys;
  }
  return nextSchema;
}

export function applyDefaults(
  schema: RunJSSettingsSchema,
  values: Record<string, unknown> = {},
): Record<string, RunJSSettingsJSONValue> {
  const config: Record<string, RunJSSettingsJSONValue> = {};
  for (const key of activeFieldKeys(schema)) {
    const field = schema.fields[key];
    const candidate = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : field.default;
    if (field.type === 'object' && typeof candidate === 'undefined') {
      const normalized = normalizeSettingValueByFieldType(field, {}, `settings.${key}`);
      if (isPlainRecord(normalized) && Object.keys(normalized).length > 0) {
        config[key] = normalized;
      }
      continue;
    }
    if (typeof candidate === 'undefined') {
      continue;
    }
    try {
      config[key] = normalizeSettingValueByFieldType(field, candidate, `settings.${key}`);
    } catch {
      if (typeof field.default !== 'undefined') {
        config[key] = normalizeSettingValueByFieldType(field, field.default, `settings.${key}.default`);
      }
    }
  }
  return config;
}

export function stripInactiveUnknownForRuntime(
  schema: RunJSSettingsSchema,
  values: Record<string, unknown> = {},
): Record<string, RunJSSettingsJSONValue> {
  return applyDefaults(schema, values);
}

export function classifyValues(
  schema: RunJSSettingsSchema,
  previousParams: Record<string, unknown> = {},
  draftParams: Record<string, unknown> = {},
) {
  const active = new Set(activeFieldKeys(schema));
  const inactive = new Set(Object.keys(schema.fields).filter((key) => schema.fields[key]?.visible === false));
  const allKeys = new Set([...Object.keys(previousParams), ...Object.keys(draftParams)]);
  const result = {
    active: {} as Record<string, unknown>,
    inactive: {} as Record<string, unknown>,
    unknown: {} as Record<string, unknown>,
  };
  for (const key of allKeys) {
    const source = Object.prototype.hasOwnProperty.call(draftParams, key) ? draftParams : previousParams;
    if (active.has(key)) {
      result.active[key] = source[key];
    } else if (inactive.has(key)) {
      result.inactive[key] = source[key];
    } else {
      result.unknown[key] = source[key];
    }
  }
  return result;
}

export function mergeActiveValuesPreserveInactiveUnknown(options: {
  schema: RunJSSettingsSchema;
  previousParams?: Record<string, unknown>;
  draftParams?: Record<string, unknown>;
  unset?: string[];
}): Record<string, RunJSSettingsJSONValue> {
  const previousParams = options.previousParams || {};
  const draftParams = options.draftParams || {};
  const activeKeys = new Set(activeFieldKeys(options.schema));
  const finalParams: Record<string, RunJSSettingsJSONValue> = {};
  for (const [key, value] of Object.entries(previousParams)) {
    assertSafeRunJSSettingKey(key);
    if (activeKeys.has(key)) {
      continue;
    }
    assertJSONValue(value, `settings.${key}`);
    finalParams[key] = _.cloneDeep(value);
  }
  const unsetKeys = new Set(options.unset || []);

  for (const key of unsetKeys) {
    assertSafeRunJSSettingKey(key);
    delete finalParams[key];
  }

  for (const key of activeFieldKeys(options.schema)) {
    const field = options.schema.fields[key];
    if (!Object.prototype.hasOwnProperty.call(draftParams, key) || typeof draftParams[key] === 'undefined') {
      if (field.required) {
        throw new RunJSSettingsValidationError(`settings.${key} is required`);
      }
      delete finalParams[key];
      continue;
    }
    const hasPreviousValue = Object.prototype.hasOwnProperty.call(previousParams, key);
    const hasDefaultValue = typeof field.default !== 'undefined';
    finalParams[key] = normalizeSettingDraftValueByFieldType(field, draftParams[key], `settings.${key}`, {
      hasPreviousValue,
      previousValue: hasPreviousValue ? previousParams[key] : undefined,
      hasDefaultValue,
      defaultValue: field.default,
    });
  }

  return finalParams;
}
