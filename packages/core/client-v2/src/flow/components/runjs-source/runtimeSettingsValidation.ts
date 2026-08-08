/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceSettingsDescriptor } from './types';
import { extractRunJSSettingsDefault } from '@nocobase/runjs/settings';

export type JsonSchemaLike = Record<string, unknown>;

export type RunJSSettingsValidationMode = 'binding' | 'runtime';

export type RunJSSettingsValidationIssue = {
  code: 'required' | 'type' | 'enum' | 'constraint' | 'unknown';
  path: string;
};

export type RunJSSettingsValidationResult = {
  errors: RunJSSettingsValidationIssue[];
  missingRequiredPaths: string[];
};

export function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  const schemaType = schema.type;
  if (Array.isArray(schemaType)) {
    return schemaType.find((item): item is string => typeof item === 'string' && item !== 'null');
  }
  if (typeof schemaType === 'string') {
    return schemaType;
  }
  if (isRecord(schema.properties) || Array.isArray(schema.required)) {
    return 'object';
  }
  if (isRecord(schema.items)) {
    return 'array';
  }
  return undefined;
}

export function getSettingsSchemaProperties(schema: unknown): Record<string, JsonSchemaLike> {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(schema.properties).filter(([, childSchema]) => isRecord(childSchema)),
  ) as Record<string, JsonSchemaLike>;
}

export function getSettingsSchemaRequired(schema: unknown): Set<string> {
  if (!isRecord(schema) || !Array.isArray(schema.required)) {
    return new Set();
  }
  return new Set(schema.required.filter((item): item is string => typeof item === 'string'));
}

export function getSchemaTitle(schema: JsonSchemaLike, fallback: string): string {
  return toNonEmptyString(schema.title) || fallback;
}

export function isSettingValueValid(schema: JsonSchemaLike, value: unknown, required: boolean): boolean {
  return (
    validateRunJSSettingValue({
      schema,
      value,
      required,
      mode: 'runtime',
    }).errors.length === 0
  );
}

export function validateRunJSSettingValue(options: {
  schema: JsonSchemaLike;
  value: unknown;
  required: boolean;
  mode: RunJSSettingsValidationMode;
  path?: string;
}): RunJSSettingsValidationResult {
  const errors: RunJSSettingsValidationIssue[] = [];
  const missingRequiredPaths: string[] = [];
  collectSettingValueIssues({
    ...options,
    path: options.path || '',
    errors,
    missingRequiredPaths,
  });
  return { errors, missingRequiredPaths };
}

export function validateRunJSSettings(options: {
  schema: JsonSchemaLike;
  settings: unknown;
  mode: RunJSSettingsValidationMode;
}): RunJSSettingsValidationResult {
  if (!isRecord(options.settings)) {
    return {
      errors: [{ code: 'type', path: '' }],
      missingRequiredPaths: [],
    };
  }
  return validateRunJSSettingValue({
    schema: options.schema,
    value: options.settings,
    required: true,
    mode: options.mode,
  });
}

function collectSettingValueIssues(options: {
  schema: JsonSchemaLike;
  value: unknown;
  required: boolean;
  mode: RunJSSettingsValidationMode;
  path: string;
  errors: RunJSSettingsValidationIssue[];
  missingRequiredPaths: string[];
}): void {
  const { schema, required, mode, path, errors, missingRequiredPaths } = options;
  const type = normalizeSchemaType(schema);
  const schemaDefault = extractRunJSSettingsDefault(schema);
  const effectiveValue = options.value === undefined && schemaDefault.hasDefault ? schemaDefault.value : options.value;

  if (required && effectiveValue === undefined) {
    missingRequiredPaths.push(path);
    if (mode === 'runtime') {
      errors.push({ code: 'required', path });
    }
    return;
  }
  if (effectiveValue === undefined) {
    return;
  }

  if (type === 'string' && typeof effectiveValue !== 'string') {
    errors.push({ code: 'type', path });
    return;
  }
  if ((type === 'number' || type === 'integer') && typeof effectiveValue !== 'number') {
    errors.push({ code: 'type', path });
    return;
  }
  if (type === 'integer' && typeof effectiveValue === 'number' && !Number.isInteger(effectiveValue)) {
    errors.push({ code: 'type', path });
    return;
  }
  if (type === 'boolean' && typeof effectiveValue !== 'boolean') {
    errors.push({ code: 'type', path });
    return;
  }
  if (type === 'array' && !Array.isArray(effectiveValue)) {
    errors.push({ code: 'type', path });
    return;
  }
  if (type === 'object' && !isRecord(effectiveValue)) {
    errors.push({ code: 'type', path });
    return;
  }

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null;
  if (enumValues && !enumValues.some((item) => stableSerialize(item) === stableSerialize(effectiveValue))) {
    errors.push({ code: 'enum', path });
    return;
  }

  if (typeof effectiveValue === 'string') {
    const minLength = typeof schema.minLength === 'number' ? schema.minLength : undefined;
    const maxLength = typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
    if (typeof minLength === 'number' && effectiveValue.length < minLength) {
      errors.push({ code: 'constraint', path });
      return;
    }
    if (typeof maxLength === 'number' && effectiveValue.length > maxLength) {
      errors.push({ code: 'constraint', path });
      return;
    }
    if (!isValidSettingStringFormat(toNonEmptyString(schema.format), effectiveValue)) {
      errors.push({ code: 'constraint', path });
      return;
    }
  }

  if (typeof effectiveValue === 'number') {
    const minimum = typeof schema.minimum === 'number' ? schema.minimum : undefined;
    const maximum = typeof schema.maximum === 'number' ? schema.maximum : undefined;
    if (typeof minimum === 'number' && effectiveValue < minimum) {
      errors.push({ code: 'constraint', path });
      return;
    }
    if (typeof maximum === 'number' && effectiveValue > maximum) {
      errors.push({ code: 'constraint', path });
      return;
    }
  }

  if (Array.isArray(effectiveValue) && isRecord(schema.items)) {
    effectiveValue.forEach((item, index) => {
      collectSettingValueIssues({
        schema: schema.items as JsonSchemaLike,
        value: item,
        required: false,
        mode,
        path: appendPath(path, String(index)),
        errors,
        missingRequiredPaths,
      });
    });
  }

  if (type !== 'object' || !isRecord(effectiveValue)) {
    return;
  }

  const properties = getSettingsSchemaProperties(schema);
  const requiredFields = getSettingsSchemaRequired(schema);
  for (const key of Object.keys(effectiveValue)) {
    if (!Object.prototype.hasOwnProperty.call(properties, key)) {
      errors.push({ code: 'unknown', path: appendPath(path, key) });
    }
  }
  for (const [childName, childSchema] of Object.entries(properties)) {
    const childValue = Object.prototype.hasOwnProperty.call(effectiveValue, childName)
      ? effectiveValue[childName]
      : undefined;
    collectSettingValueIssues({
      schema: childSchema,
      value: childValue,
      required: requiredFields.has(childName),
      mode,
      path: appendPath(path, childName),
      errors,
      missingRequiredPaths,
    });
  }
}

function appendPath(parent: string, child: string): string {
  return parent ? `${parent}.${child}` : child;
}

function isValidSettingStringFormat(format: string | undefined, value: string): boolean {
  if (!format) {
    return true;
  }
  if (format === 'date') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
  }
  if (format === 'date-time') {
    return !Number.isNaN(Date.parse(value));
  }
  if (format === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (format === 'time') {
    return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(value);
  }
  if (format === 'uri' || format === 'url') {
    try {
      const url = new URL(value);
      return Boolean(url.protocol && url.hostname);
    } catch {
      return false;
    }
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}
