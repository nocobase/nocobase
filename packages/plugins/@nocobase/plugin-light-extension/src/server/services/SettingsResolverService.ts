/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';

import { LightExtensionError } from '../../shared/errors';

export interface LightExtensionRuntimeSettingsSource {
  id: string;
  settingsSchema: Record<string, unknown> | null;
  settingsDefaultsHash?: string | null;
}

export interface SettingsValidationIssue {
  path: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class SettingsResolverService {
  resolveRuntimeSettings(
    source: LightExtensionRuntimeSettingsSource,
    inputSettings: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    const defaults = this.getRuntimeDefaults(source);
    const settings = mergeSettings(defaults, inputSettings || {});
    const issues: SettingsValidationIssue[] = [];

    if (source.settingsSchema) {
      validateSettingsValue(source.settingsSchema, settings, '$', issues);
    } else {
      validateObjectSettings({ type: 'object', properties: {} }, settings, '$', issues);
    }

    if (issues.length) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SETTINGS_INVALID',
        'Light extension runtime settings are invalid',
        {
          details: {
            reasonCode: 'settings_invalid',
            entryId: source.id,
            settingsDefaultsHash: source.settingsDefaultsHash,
            issues,
          },
        },
      );
    }

    return settings;
  }

  getRuntimeDefaults(source: LightExtensionRuntimeSettingsSource): Record<string, unknown> {
    return extractRunJSSettingsDefaults(source.settingsSchema);
  }

  pruneUnknownSettings(
    source: LightExtensionRuntimeSettingsSource,
    inputSettings: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    const settings = isPlainRecord(inputSettings) ? inputSettings : {};
    if (!settingsSchemaHasProperties(source.settingsSchema)) {
      return {};
    }
    const pruned = pruneSettingsValue(source.settingsSchema, settings);
    return isPlainRecord(pruned) ? pruned : {};
  }
}

function mergeSettings(defaults: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const output = cloneRecord(defaults);

  for (const [key, value] of Object.entries(overrides)) {
    const currentValue = Object.prototype.hasOwnProperty.call(output, key) ? output[key] : undefined;
    if (isPlainRecord(currentValue) && isPlainRecord(value)) {
      defineOwnSetting(output, key, mergeSettings(currentValue, value));
    } else {
      defineOwnSetting(output, key, cloneJsonValue(value));
    }
  }

  return output;
}

function validateSettingsValue(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  const type = typeof schema.type === 'string' ? schema.type : undefined;
  const inferredType = type || inferSchemaType(schema);

  if (inferredType && !matchesSettingsType(value, inferredType)) {
    issues.push({
      path,
      code: 'settings_type_mismatch',
      message: `Expected ${inferredType} settings value`,
      details: {
        expectedType: inferredType,
        actualType: getSettingsValueType(value),
      },
    });
    return;
  }

  validateEnum(schema, value, path, issues);
  if (typeof value === 'string') {
    validateStringSettings(schema, value, path, issues);
    validateStringFormatSettings(schema, value, path, issues);
  }
  if (typeof value === 'number') {
    validateNumberSettings(schema, value, path, issues);
  }
  if (isPlainRecord(value)) {
    validateObjectSettings(schema, value, path, issues);
  }
  if (Array.isArray(value)) {
    validateArraySettings(schema, value, path, issues);
  }
}

function inferSchemaType(schema: Record<string, unknown>): string | undefined {
  if (isPlainRecord(schema.properties) || Array.isArray(schema.required)) {
    return 'object';
  }
  if (isPlainRecord(schema.items)) {
    return 'array';
  }

  return undefined;
}

function matchesSettingsType(value: unknown, type: string): boolean {
  if (type === 'object') {
    return isPlainRecord(value);
  }
  if (type === 'array') {
    return Array.isArray(value);
  }
  if (type === 'integer') {
    return Number.isInteger(value);
  }
  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  return typeof value === type;
}

function validateEnum(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (!Array.isArray(schema.enum)) {
    return;
  }

  const serializedValue = stableSerialize(value);
  if (!schema.enum.some((item) => stableSerialize(item) === serializedValue)) {
    issues.push({
      path,
      code: 'settings_enum_mismatch',
      message: 'Settings value is not in the allowed enum',
    });
  }
}

function validateStringSettings(
  schema: Record<string, unknown>,
  value: string,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
    issues.push({
      path,
      code: 'settings_min_length',
      message: `Settings value must contain at least ${schema.minLength} characters`,
    });
  }
  if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
    issues.push({
      path,
      code: 'settings_max_length',
      message: `Settings value must contain at most ${schema.maxLength} characters`,
    });
  }
}

function validateStringFormatSettings(
  schema: Record<string, unknown>,
  value: string,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (typeof schema.format !== 'string') {
    return;
  }

  const formatValidators: Record<string, (value: string) => boolean> = {
    date: (item) => /^\d{4}-\d{2}-\d{2}$/.test(item) && !Number.isNaN(Date.parse(`${item}T00:00:00.000Z`)),
    'date-time': (item) => !Number.isNaN(Date.parse(item)),
    email: (item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item),
    time: (item) => /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(item),
    uri: isValidUrl,
    url: isValidUrl,
  };
  const validate = formatValidators[schema.format];
  if (validate && !validate(value)) {
    issues.push({
      path,
      code: 'settings_format',
      message: `Settings value must match ${schema.format} format`,
      details: {
        format: schema.format,
      },
    });
  }
}

function validateNumberSettings(
  schema: Record<string, unknown>,
  value: number,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (typeof schema.minimum === 'number' && value < schema.minimum) {
    issues.push({
      path,
      code: 'settings_minimum',
      message: `Settings value must be greater than or equal to ${schema.minimum}`,
    });
  }
  if (typeof schema.maximum === 'number' && value > schema.maximum) {
    issues.push({
      path,
      code: 'settings_maximum',
      message: `Settings value must be less than or equal to ${schema.maximum}`,
    });
  }
}

function validateObjectSettings(
  schema: Record<string, unknown>,
  value: Record<string, unknown>,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (typeof key === 'string' && !Object.prototype.hasOwnProperty.call(value, key)) {
        issues.push({
          path: `${path}.${key}`,
          code: 'settings_required',
          message: `Settings field "${key}" is required`,
        });
      }
    }
  }

  const properties = isPlainRecord(schema.properties) ? schema.properties : {};

  for (const key of Object.keys(value)) {
    if (!Object.prototype.hasOwnProperty.call(properties, key)) {
      issues.push({
        path: `${path}.${key}`,
        code: 'settings_unknown_property',
        message: `Settings field "${key}" is not defined by the runtime settings schema`,
      });
    }
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    if (!Object.prototype.hasOwnProperty.call(value, key) || !isPlainRecord(childSchema)) {
      continue;
    }

    validateSettingsValue(childSchema, value[key], `${path}.${key}`, issues);
  }
}

function validateArraySettings(
  schema: Record<string, unknown>,
  value: unknown[],
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (!isPlainRecord(schema.items)) {
    return;
  }

  value.forEach((item, index) => {
    validateSettingsValue(schema.items as Record<string, unknown>, item, `${path}[${index}]`, issues);
  });
}

function pruneSettingsValue(schema: unknown, value: unknown): unknown {
  if (Array.isArray(value)) {
    const itemsSchema = isPlainRecord(schema) ? schema.items : undefined;
    return isPlainRecord(itemsSchema)
      ? value.map((item) => pruneSettingsValue(itemsSchema, item))
      : cloneJsonValue(value);
  }

  if (!settingsSchemaHasProperties(schema) || !isPlainRecord(value)) {
    return cloneJsonValue(value);
  }

  const properties = (schema as Record<string, unknown>).properties as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => Object.prototype.hasOwnProperty.call(value, key))
      .map(([key, childSchema]) => [key, pruneSettingsValue(childSchema, value[key])])
      .filter(([, childValue]) => typeof childValue !== 'undefined'),
  );
}

function settingsSchemaHasProperties(schema: unknown): schema is Record<string, unknown> & {
  properties: Record<string, unknown>;
} {
  return isPlainRecord(schema) && isPlainRecord(schema.properties);
}

function getSettingsValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  if (Number.isInteger(value)) {
    return 'integer';
  }

  return typeof value;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function defineOwnSetting(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.hostname);
  } catch {
    return false;
  }
}
