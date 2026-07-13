/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceSettingsDescriptor } from './types';

export type JsonSchemaLike = Record<string, unknown>;

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
  const type = normalizeSchemaType(schema);

  if (required && value === undefined) {
    return false;
  }

  if (value === undefined) {
    return true;
  }

  if (type === 'string' && typeof value !== 'string') {
    return false;
  }
  if ((type === 'number' || type === 'integer') && typeof value !== 'number') {
    return false;
  }
  if (type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
    return false;
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    return false;
  }
  if (type === 'array' && !Array.isArray(value)) {
    return false;
  }
  if (type === 'object' && !isRecord(value)) {
    return false;
  }
  if (type === 'object' && isRecord(value) && !isObjectSettingValueValid(schema, value)) {
    return false;
  }

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null;
  if (enumValues && !enumValues.some((item) => stableSerialize(item) === stableSerialize(value))) {
    return false;
  }

  if (typeof value === 'string') {
    const minLength = typeof schema.minLength === 'number' ? schema.minLength : undefined;
    const maxLength = typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
    if (typeof minLength === 'number' && value.length < minLength) {
      return false;
    }
    if (typeof maxLength === 'number' && value.length > maxLength) {
      return false;
    }
    if (!isValidSettingStringFormat(toNonEmptyString(schema.format), value)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    const minimum = typeof schema.minimum === 'number' ? schema.minimum : undefined;
    const maximum = typeof schema.maximum === 'number' ? schema.maximum : undefined;
    if (typeof minimum === 'number' && value < minimum) {
      return false;
    }
    if (typeof maximum === 'number' && value > maximum) {
      return false;
    }
  }

  if (Array.isArray(value) && isRecord(schema.items)) {
    return value.every((item) => {
      if (normalizeSchemaType(schema.items as JsonSchemaLike) === 'object') {
        if (!isRecord(item)) {
          return false;
        }
        return isObjectSettingValueValid(schema.items as JsonSchemaLike, item);
      }
      return isSettingValueValid(schema.items as JsonSchemaLike, item, false);
    });
  }

  return true;
}

function isObjectSettingValueValid(schema: JsonSchemaLike, value: Record<string, unknown>): boolean {
  const properties = getSettingsSchemaProperties(schema);
  const requiredFields = getSettingsSchemaRequired(schema);
  return Object.entries(properties).every(([childName, childSchema]) => {
    const childValue = Object.prototype.hasOwnProperty.call(value, childName) ? value[childName] : undefined;
    return isSettingValueValid(childSchema, childValue, requiredFields.has(childName));
  });
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
