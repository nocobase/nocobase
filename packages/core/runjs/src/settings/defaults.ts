/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSSettingsDefaultResult = {
  hasDefault: boolean;
  value: unknown;
};

export function extractRunJSSettingsDefault(schema: unknown): RunJSSettingsDefaultResult {
  if (!isRecord(schema)) {
    return { hasDefault: false, value: {} };
  }

  const propertyDefaults = extractPropertyDefaults(schema.properties);
  if (!Object.prototype.hasOwnProperty.call(schema, 'default')) {
    return Object.keys(propertyDefaults).length > 0
      ? { hasDefault: true, value: propertyDefaults }
      : { hasDefault: false, value: {} };
  }

  const explicitDefault = cloneJsonValue(schema.default);
  return {
    hasDefault: true,
    value: isRecord(explicitDefault) ? mergeDefaultRecords(propertyDefaults, explicitDefault) : explicitDefault,
  };
}

export function extractRunJSSettingsDefaults(schema: unknown): Record<string, unknown> {
  const result = extractRunJSSettingsDefault(schema);
  return isRecord(result.value) ? result.value : {};
}

function extractPropertyDefaults(properties: unknown): Record<string, unknown> {
  if (!isRecord(properties)) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, propertySchema] of Object.entries(properties)) {
    const childDefault = extractRunJSSettingsDefault(propertySchema);
    if (childDefault.hasDefault) {
      defaults[key] = childDefault.value;
    }
  }
  return defaults;
}

function mergeDefaultRecords(
  propertyDefaults: Record<string, unknown>,
  explicitDefault: Record<string, unknown>,
): Record<string, unknown> {
  const output = cloneJsonValue(propertyDefaults);
  for (const [key, value] of Object.entries(explicitDefault)) {
    output[key] =
      isRecord(output[key]) && isRecord(value) ? mergeDefaultRecords(output[key], value) : cloneJsonValue(value);
  }
  return output;
}

function cloneJsonValue<T>(value: T): T {
  if (typeof value === 'undefined') {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
