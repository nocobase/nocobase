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
  RunJSSettingField,
  RunJSSettingFieldType,
  RunJSSettingOption,
  RunJSSettingOptionValue,
  RunJSSettingsSchema,
} from './types';
import {
  assertSafeRunJSSettingKey,
  isPlainRecord,
  normalizeCollectionEnvelope,
  normalizeDataSourceEnvelope,
  normalizeSettingValueByFieldType,
  RunJSSettingsValidationError,
} from './values';

const SUPPORTED_FIELD_TYPES = new Set<RunJSSettingFieldType>([
  'string',
  'text',
  'number',
  'boolean',
  'object',
  'select',
  'multiSelect',
  'date',
  'datetime',
  'color',
  'dataSource',
  'collection',
  'collectionField',
  'json',
]);

const SCHEMA_SHAPE_KEY = '__runjsSettingsSchemaShape';
const DIRECT_SCHEMA_META_KEYS = new Set(['version', 'title', 'description', 'order']);

type SchemaShape = 'direct' | 'legacy';

type RunJSSettingsSchemaWithShape = RunJSSettingsSchema & {
  [SCHEMA_SHAPE_KEY]?: SchemaShape;
};

function markSchemaShape(schema: RunJSSettingsSchema, shape: SchemaShape): RunJSSettingsSchema {
  Object.defineProperty(schema, SCHEMA_SHAPE_KEY, {
    value: shape,
    enumerable: false,
    configurable: true,
  });
  return schema;
}

export function isDirectRunJSSettingsSchema(schema: RunJSSettingsSchema | undefined): boolean {
  return (schema as RunJSSettingsSchemaWithShape | undefined)?.[SCHEMA_SHAPE_KEY] === 'direct';
}

function normalizeBooleanFlag(value: unknown, path: string): boolean | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw new RunJSSettingsValidationError(`${path} must be a boolean`);
  }
  return value;
}

function normalizeNumberOption(value: unknown, path: string): number | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RunJSSettingsValidationError(`${path} must be a finite number`);
  }
  return value;
}

function normalizeStringOption(value: unknown, path: string): string | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new RunJSSettingsValidationError(`${path} must be a string`);
  }
  return value;
}

function normalizeOptions(field: Record<string, unknown>, path: string): RunJSSettingOption[] | undefined {
  if (typeof field.options === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(field.options)) {
    throw new RunJSSettingsValidationError(`${path}.options must be an array`);
  }
  return field.options.map((option, index) => {
    if (!isPlainRecord(option)) {
      throw new RunJSSettingsValidationError(`${path}.options[${index}] must be a plain object`);
    }
    const label = option.label;
    const value = option.value;
    if (typeof label !== 'string') {
      throw new RunJSSettingsValidationError(`${path}.options[${index}].label must be a string`);
    }
    let normalizedValue: RunJSSettingOptionValue;
    if (value === null || typeof value === 'string' || typeof value === 'boolean') {
      normalizedValue = value as null | string | boolean;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      normalizedValue = value as number;
    } else if (typeof value === 'number') {
      throw new RunJSSettingsValidationError(`${path}.options[${index}].value must be a finite number`);
    } else {
      throw new RunJSSettingsValidationError(
        `${path}.options[${index}].value must be a string, number, boolean, or null`,
      );
    }
    return { label, value: normalizedValue };
  });
}

function normalizeReferenceString(value: unknown, path: string) {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value === 'string') {
    if (!value.startsWith('$') || value.length === 1) {
      throw new RunJSSettingsValidationError(`${path} string references must use '$fieldName'`);
    }
    assertSafeRunJSSettingKey(value.slice(1), path);
    return value as `$${string}`;
  }
  return undefined;
}

function normalizeDataSourceReference(value: unknown, path: string) {
  const reference = normalizeReferenceString(value, path);
  return reference || (typeof value === 'undefined' ? undefined : normalizeDataSourceEnvelope(value, path));
}

function normalizeCollectionReference(value: unknown, path: string) {
  const reference = normalizeReferenceString(value, path);
  return reference || (typeof value === 'undefined' ? undefined : normalizeCollectionEnvelope(value, path));
}

function isFieldDefinition(value: unknown): value is Record<string, unknown> {
  return (
    isPlainRecord(value) &&
    typeof value.type === 'string' &&
    SUPPORTED_FIELD_TYPES.has(value.type as RunJSSettingFieldType)
  );
}

function normalizeSchemaVersion(value: unknown): 1 | undefined {
  if (isFieldDefinition(value)) {
    return undefined;
  }
  return value as 1 | undefined;
}

function normalizeProperties(
  rawProperties: unknown,
  path: string,
  maxFields: number,
): Record<string, RunJSSettingField> {
  if (!isPlainRecord(rawProperties)) {
    throw new RunJSSettingsValidationError(`${path} must be a plain object`);
  }
  const entries = Object.entries(rawProperties);
  if (entries.length > maxFields) {
    throw new RunJSSettingsValidationError(`${path} supports at most ${maxFields} fields`);
  }
  const properties: Record<string, RunJSSettingField> = {};
  for (const [key, field] of entries) {
    assertSafeRunJSSettingKey(key, path);
    properties[key] = normalizeField(field, key, `${path}.${key}`);
  }
  return properties;
}

function normalizeField(rawField: unknown, key: string, path = `fields.${key}`): RunJSSettingField {
  if (!isPlainRecord(rawField)) {
    throw new RunJSSettingsValidationError(`${path} must be a plain object`);
  }
  const type = rawField.type;
  if (typeof type !== 'string' || !SUPPORTED_FIELD_TYPES.has(type as RunJSSettingFieldType)) {
    throw new RunJSSettingsValidationError(`${path}.type '${String(type)}' is not supported`);
  }
  const field: RunJSSettingField = {
    type: type as RunJSSettingFieldType,
    title: normalizeStringOption(rawField.title, `${path}.title`),
    description: normalizeStringOption(rawField.description, `${path}.description`),
    required: normalizeBooleanFlag(rawField.required, `${path}.required`),
    visible: normalizeBooleanFlag(rawField.visible, `${path}.visible`),
    disabled: normalizeBooleanFlag(rawField.disabled, `${path}.disabled`),
    placeholder: normalizeStringOption(rawField.placeholder, `${path}.placeholder`),
    options: normalizeOptions(rawField, path),
    min: normalizeNumberOption(rawField.min, `${path}.min`),
    max: normalizeNumberOption(rawField.max, `${path}.max`),
    step: normalizeNumberOption(rawField.step, `${path}.step`),
    ui: normalizeStringOption(rawField.ui, `${path}.ui`),
    dataSource: normalizeDataSourceReference(rawField.dataSource, `${path}.dataSource`),
    collection: normalizeCollectionReference(rawField.collection, `${path}.collection`),
    fieldTypes: Array.isArray(rawField.fieldTypes)
      ? rawField.fieldTypes.filter((item) => typeof item === 'string')
      : undefined,
    properties: type === 'object' ? normalizeProperties(rawField.properties, `${path}.properties`, 100) : undefined,
  };

  if ((field.type === 'select' || field.type === 'multiSelect') && !field.options?.length) {
    throw new RunJSSettingsValidationError(`${path}.options is required for ${field.type}`);
  }
  if (field.type === 'collectionField' && !field.collection) {
    throw new RunJSSettingsValidationError(`${path}.collection is required for collectionField`);
  }
  if (typeof rawField.default !== 'undefined') {
    field.default = normalizeSettingValueByFieldType(field, rawField.default, `${path}.default`);
  }
  return _.pickBy(field, (value) => typeof value !== 'undefined') as RunJSSettingField;
}

function normalizeLegacySchema(input: Record<string, unknown>): RunJSSettingsSchema {
  if (!isPlainRecord(input.fields)) {
    throw new RunJSSettingsValidationError('settings schema fields must be a plain object');
  }
  const fields = normalizeProperties(input.fields, 'fields', 100);
  const order = Array.isArray(input.order)
    ? input.order.filter((key): key is string => typeof key === 'string' && !!fields[key])
    : undefined;
  return markSchemaShape(
    _.pickBy(
      {
        version: normalizeSchemaVersion(input.version),
        title: typeof input.title === 'string' ? input.title : undefined,
        description: typeof input.description === 'string' ? input.description : undefined,
        fields,
        order,
      },
      (value) => typeof value !== 'undefined',
    ) as RunJSSettingsSchema,
    'legacy',
  );
}

function normalizeDirectSchema(input: Record<string, unknown>): RunJSSettingsSchema {
  const fields: Record<string, RunJSSettingField> = {};
  for (const [key, field] of Object.entries(input)) {
    if (DIRECT_SCHEMA_META_KEYS.has(key) && !isFieldDefinition(field)) {
      continue;
    }
    assertSafeRunJSSettingKey(key, 'settings');
    fields[key] = normalizeField(field, key, `settings.${key}`);
  }
  if (Object.keys(fields).length === 0) {
    throw new RunJSSettingsValidationError('settings schema must include at least one setting');
  }
  const order = Array.isArray(input.order)
    ? input.order.filter((key): key is string => typeof key === 'string' && !!fields[key])
    : undefined;
  return markSchemaShape(
    _.pickBy(
      {
        version: normalizeSchemaVersion(input.version),
        title: typeof input.title === 'string' ? input.title : undefined,
        description: typeof input.description === 'string' ? input.description : undefined,
        fields,
        order,
      },
      (value) => typeof value !== 'undefined',
    ) as RunJSSettingsSchema,
    'direct',
  );
}

export function normalizeRunJSSettingsSchema(input: unknown): RunJSSettingsSchema {
  if (!isPlainRecord(input)) {
    throw new RunJSSettingsValidationError('settings schema must be a plain object');
  }
  const version = input.version;
  if (!isFieldDefinition(version) && typeof version !== 'undefined' && version !== 1) {
    throw new RunJSSettingsValidationError('settings schema version must be 1');
  }
  if (isPlainRecord(input.fields) && !isFieldDefinition(input.fields)) {
    return normalizeLegacySchema(input);
  }
  return normalizeDirectSchema(input);
}
