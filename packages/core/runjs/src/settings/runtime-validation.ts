/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSSettingsValidationMode = 'binding' | 'runtime';
export type RunJSSettingsObjectIssueOrder = 'client' | 'server';
export type RunJSSettingsScalarIssueMode = 'all' | 'first';

export type RunJSSettingsValidationIssueCode =
  | 'required'
  | 'type'
  | 'enum'
  | 'format'
  | 'minLength'
  | 'maxLength'
  | 'minimum'
  | 'maximum'
  | 'unknownProperty';

export type RunJSSettingsPathSegment = string | number;
export type RunJSSettingsPath = readonly RunJSSettingsPathSegment[];

export interface RunJSSettingsValidationIssueDetails {
  actualType?: string;
  expectedType?: string;
  format?: string;
  limit?: number;
}

export interface RunJSSettingsValidationIssue {
  code: RunJSSettingsValidationIssueCode;
  path: RunJSSettingsPath;
  details?: RunJSSettingsValidationIssueDetails;
}

export interface RunJSSettingsValidationResult {
  issues: RunJSSettingsValidationIssue[];
  missingRequiredPaths: RunJSSettingsPath[];
  normalizedValue: unknown;
}

export interface ValidateRunJSSettingsValueOptions {
  mode: RunJSSettingsValidationMode;
  objectIssueOrder?: RunJSSettingsObjectIssueOrder;
  scalarIssueMode?: RunJSSettingsScalarIssueMode;
  path?: RunJSSettingsPath;
  required?: boolean;
  schema: unknown;
  value: unknown;
}

export interface ValidateRunJSSettingsOptions {
  mode: RunJSSettingsValidationMode;
  objectIssueOrder?: RunJSSettingsObjectIssueOrder;
  scalarIssueMode?: RunJSSettingsScalarIssueMode;
  schema: unknown;
  settings: unknown;
}

export function validateRunJSSettingsValue(options: ValidateRunJSSettingsValueOptions): RunJSSettingsValidationResult {
  const issues: RunJSSettingsValidationIssue[] = [];
  const missingRequiredPaths: RunJSSettingsPath[] = [];
  const normalizedValue = normalizeRunJSSettingsValue(options.schema, options.value);

  collectRunJSSettingsIssues({
    issues,
    missingRequiredPaths,
    mode: options.mode,
    objectIssueOrder: options.objectIssueOrder || 'server',
    scalarIssueMode: options.scalarIssueMode || 'all',
    path: options.path ? [...options.path] : [],
    required: options.required === true,
    schema: options.schema,
    value: normalizedValue,
  });

  return { issues, missingRequiredPaths, normalizedValue };
}

export function validateRunJSSettings(options: ValidateRunJSSettingsOptions): RunJSSettingsValidationResult {
  const schema = getRunJSSettingsRootSchema(options.schema);
  const result = validateRunJSSettingsValue({
    mode: options.mode,
    objectIssueOrder: options.objectIssueOrder,
    scalarIssueMode: options.scalarIssueMode,
    required: true,
    schema,
    value: options.settings,
  });

  if (typeof result.normalizedValue !== 'undefined' && !isRecord(result.normalizedValue)) {
    return {
      issues: [
        {
          code: 'type',
          path: [],
          details: {
            actualType: getRunJSSettingsValueType(result.normalizedValue),
            expectedType: 'object',
          },
        },
      ],
      missingRequiredPaths: [],
      normalizedValue: result.normalizedValue,
    };
  }

  return result;
}

export function normalizeRunJSSettingsValue(schema: unknown, value: unknown): unknown {
  if (!isRecord(schema)) {
    return cloneSettingsValue(value);
  }

  const hasExplicitDefault = hasOwn(schema, 'default');
  const explicitDefault = hasExplicitDefault ? cloneSettingsValue(schema.default) : undefined;
  let effectiveValue = value;

  if (typeof value === 'undefined') {
    effectiveValue = explicitDefault;
  } else if (isRecord(explicitDefault) && isRecord(value)) {
    effectiveValue = mergeSettingsRecords(explicitDefault, value);
  }

  const schemaTypes = getRunJSSettingsSchemaTypes(schema);
  const isObjectSchema = schemaTypes.includes('object');
  const isArraySchema = schemaTypes.includes('array');

  if (isArraySchema && Array.isArray(effectiveValue)) {
    const items = getOwnRecord(schema, 'items');
    return items
      ? effectiveValue.map((item) => normalizeRunJSSettingsValue(items, item))
      : cloneSettingsValue(effectiveValue);
  }

  if (!isObjectSchema) {
    return cloneSettingsValue(effectiveValue);
  }

  const properties = getOwnRecord(schema, 'properties');
  if (!properties) {
    return cloneSettingsValue(effectiveValue);
  }

  if (typeof effectiveValue !== 'undefined' && !isRecord(effectiveValue)) {
    return cloneSettingsValue(effectiveValue);
  }

  let output: Record<string, unknown> = {};
  let hasValue = false;

  for (const [key, childSchema] of Object.entries(properties)) {
    if (!isRecord(childSchema)) {
      continue;
    }
    const normalizedChildDefault = normalizeRunJSSettingsValue(childSchema, undefined);
    if (typeof normalizedChildDefault !== 'undefined') {
      defineOwnSetting(output, key, normalizedChildDefault);
      hasValue = true;
    }
  }

  if (isRecord(explicitDefault)) {
    output = mergeSettingsRecords(output, explicitDefault);
    hasValue = true;
  }
  if (isRecord(value)) {
    output = mergeSettingsRecords(output, value);
    hasValue = true;
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    if (!isRecord(childSchema) || !hasOwn(output, key)) {
      continue;
    }
    defineOwnSetting(output, key, normalizeRunJSSettingsValue(childSchema, output[key]));
  }

  return hasValue || typeof effectiveValue !== 'undefined' ? output : undefined;
}

export function normalizeRunJSSettingsSchemaType(schema: unknown): string | undefined {
  return getRunJSSettingsSchemaTypes(schema).find((type) => type !== 'null');
}

export function formatRunJSSettingsDotPath(path: RunJSSettingsPath): string {
  return path.map((segment) => String(segment)).join('.');
}

export function formatRunJSSettingsJsonPath(path: RunJSSettingsPath): string {
  return path.reduce<string>(
    (output, segment) => (typeof segment === 'number' ? `${output}[${segment}]` : `${output}.${segment}`),
    '$',
  );
}

function collectRunJSSettingsIssues(options: {
  issues: RunJSSettingsValidationIssue[];
  missingRequiredPaths: RunJSSettingsPath[];
  mode: RunJSSettingsValidationMode;
  objectIssueOrder: RunJSSettingsObjectIssueOrder;
  scalarIssueMode: RunJSSettingsScalarIssueMode;
  path: RunJSSettingsPath;
  required: boolean;
  schema: unknown;
  value: unknown;
}): void {
  const { issues, missingRequiredPaths, mode, objectIssueOrder, scalarIssueMode, path, required, schema, value } =
    options;

  if (required && typeof value === 'undefined') {
    missingRequiredPaths.push([...path]);
    if (mode === 'runtime') {
      issues.push({ code: 'required', path: [...path] });
    }
    return;
  }
  if (typeof value === 'undefined' || !isRecord(schema)) {
    return;
  }

  const schemaTypes = getRunJSSettingsSchemaTypes(schema);
  if (schemaTypes.length > 0 && !schemaTypes.some((type) => matchesRunJSSettingsType(value, type))) {
    issues.push({
      code: 'type',
      path: [...path],
      details: {
        actualType: getRunJSSettingsValueType(value),
        expectedType: schemaTypes.join(' | '),
      },
    });
    return;
  }

  const enumValues = getOwnArray(schema, 'enum');
  if (enumValues && !enumValues.some((item) => settingsValuesEqual(item, value))) {
    issues.push({ code: 'enum', path: [...path] });
    if (scalarIssueMode === 'first') {
      return;
    }
  }

  if (typeof value === 'string') {
    const stringIssues = getRunJSSettingsStringIssues(schema, value, path);
    issues.push(...(scalarIssueMode === 'first' ? stringIssues.slice(0, 1) : stringIssues));
    if (scalarIssueMode === 'first' && stringIssues.length > 0) {
      return;
    }
  }

  if (typeof value === 'number') {
    const numberIssues = getRunJSSettingsNumberIssues(schema, value, path);
    issues.push(...(scalarIssueMode === 'first' ? numberIssues.slice(0, 1) : numberIssues));
    if (scalarIssueMode === 'first' && numberIssues.length > 0) {
      return;
    }
  }

  if (Array.isArray(value)) {
    const items = getOwnRecord(schema, 'items');
    if (!items) {
      return;
    }
    value.forEach((item, index) => {
      collectRunJSSettingsIssues({
        issues,
        missingRequiredPaths,
        mode,
        objectIssueOrder,
        scalarIssueMode,
        path: appendRunJSSettingsPath(path, index),
        required: false,
        schema: items,
        value: item,
      });
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (
    schemaTypes.length === 0 &&
    enumValues &&
    !getOwnRecord(schema, 'properties') &&
    !getOwnArray(schema, 'required')
  ) {
    return;
  }

  const propertyEntries = Object.entries(getOwnRecord(schema, 'properties') || {}).filter(
    (entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]),
  );
  const knownProperties = new Set(propertyEntries.map(([key]) => key));
  const requiredProperties = Array.from(
    new Set((getOwnArray(schema, 'required') || []).filter((item): item is string => typeof item === 'string')),
  );
  const requiredPropertySet = new Set(requiredProperties);

  const collectUnknownProperties = () => {
    for (const key of Object.keys(value)) {
      if (!knownProperties.has(key)) {
        issues.push({ code: 'unknownProperty', path: appendRunJSSettingsPath(path, key) });
      }
    }
  };

  if (objectIssueOrder === 'client') {
    collectUnknownProperties();
    for (const [key, childSchema] of propertyEntries) {
      collectRunJSSettingsIssues({
        issues,
        missingRequiredPaths,
        mode,
        objectIssueOrder,
        scalarIssueMode,
        path: appendRunJSSettingsPath(path, key),
        required: requiredPropertySet.has(key),
        schema: childSchema,
        value: hasOwn(value, key) ? value[key] : undefined,
      });
    }
    return;
  }

  for (const key of requiredProperties) {
    if (hasOwn(value, key) && typeof value[key] !== 'undefined') {
      continue;
    }
    collectRunJSSettingsIssues({
      issues,
      missingRequiredPaths,
      mode,
      objectIssueOrder,
      scalarIssueMode,
      path: appendRunJSSettingsPath(path, key),
      required: true,
      schema: {},
      value: undefined,
    });
  }
  collectUnknownProperties();

  for (const [key, childSchema] of propertyEntries) {
    if (!hasOwn(value, key)) {
      continue;
    }
    collectRunJSSettingsIssues({
      issues,
      missingRequiredPaths,
      mode,
      objectIssueOrder,
      scalarIssueMode,
      path: appendRunJSSettingsPath(path, key),
      required: false,
      schema: childSchema,
      value: value[key],
    });
  }
}

function getRunJSSettingsStringIssues(
  schema: Record<string, unknown>,
  value: string,
  path: RunJSSettingsPath,
): RunJSSettingsValidationIssue[] {
  const issues: RunJSSettingsValidationIssue[] = [];
  const minLength = getOwnNumber(schema, 'minLength');
  if (typeof minLength === 'number' && value.length < minLength) {
    issues.push({ code: 'minLength', details: { limit: minLength }, path: [...path] });
  }

  const maxLength = getOwnNumber(schema, 'maxLength');
  if (typeof maxLength === 'number' && value.length > maxLength) {
    issues.push({ code: 'maxLength', details: { limit: maxLength }, path: [...path] });
  }

  const format = getOwnNonEmptyString(schema, 'format');
  if (format && !isValidRunJSSettingsStringFormat(format, value)) {
    issues.push({ code: 'format', details: { format }, path: [...path] });
  }

  return issues;
}

function getRunJSSettingsNumberIssues(
  schema: Record<string, unknown>,
  value: number,
  path: RunJSSettingsPath,
): RunJSSettingsValidationIssue[] {
  const issues: RunJSSettingsValidationIssue[] = [];
  const minimum = getOwnNumber(schema, 'minimum');
  if (typeof minimum === 'number' && value < minimum) {
    issues.push({ code: 'minimum', details: { limit: minimum }, path: [...path] });
  }

  const maximum = getOwnNumber(schema, 'maximum');
  if (typeof maximum === 'number' && value > maximum) {
    issues.push({ code: 'maximum', details: { limit: maximum }, path: [...path] });
  }

  return issues;
}

function getRunJSSettingsSchemaTypes(schema: unknown): string[] {
  if (!isRecord(schema)) {
    return [];
  }

  const typeValue = hasOwn(schema, 'type') ? schema.type : undefined;
  if (typeof typeValue === 'string') {
    return [typeValue];
  }
  if (Array.isArray(typeValue)) {
    return Array.from(new Set(typeValue.filter((item): item is string => typeof item === 'string')));
  }
  if (getOwnRecord(schema, 'properties') || getOwnArray(schema, 'required')) {
    return ['object'];
  }
  if (getOwnRecord(schema, 'items')) {
    return ['array'];
  }
  return [];
}

function getRunJSSettingsRootSchema(schema: unknown): Record<string, unknown> {
  if (!isRecord(schema)) {
    return { type: 'object', properties: {} };
  }
  if (getRunJSSettingsSchemaTypes(schema).length > 0) {
    return schema;
  }

  const rootSchema = cloneSettingsValue(schema);
  defineOwnSetting(rootSchema, 'type', 'object');
  if (!getOwnRecord(rootSchema, 'properties')) {
    defineOwnSetting(rootSchema, 'properties', {});
  }
  return rootSchema;
}

function matchesRunJSSettingsType(value: unknown, type: string): boolean {
  if (type === 'null') {
    return value === null;
  }
  if (type === 'object') {
    return isRecord(value);
  }
  if (type === 'array') {
    return Array.isArray(value);
  }
  if (type === 'integer') {
    return typeof value === 'number' && Number.isInteger(value);
  }
  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }
  return typeof value === type;
}

function getRunJSSettingsValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return 'integer';
  }
  return typeof value;
}

function isValidRunJSSettingsStringFormat(format: string, value: string): boolean {
  if (format === 'date') {
    return /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
  }
  if (format === 'date-time') {
    return !Number.isNaN(Date.parse(value));
  }
  if (format === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
  }
  if (format === 'time') {
    return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/u.test(value);
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

function settingsValuesEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => settingsValuesEqual(item, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) => key === rightKeys[index] && hasOwn(right, key) && settingsValuesEqual(left[key], right[key]),
    )
  );
}

function appendRunJSSettingsPath(path: RunJSSettingsPath, segment: RunJSSettingsPathSegment): RunJSSettingsPath {
  return [...path, segment];
}

function mergeSettingsRecords(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(defaults)) {
    defineOwnSetting(output, key, cloneSettingsValue(value));
  }
  for (const [key, value] of Object.entries(overrides)) {
    const defaultValue = hasOwn(output, key) ? output[key] : undefined;
    defineOwnSetting(
      output,
      key,
      isRecord(defaultValue) && isRecord(value) ? mergeSettingsRecords(defaultValue, value) : cloneSettingsValue(value),
    );
  }
  return output;
}

function cloneSettingsValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSettingsValue(item)) as T;
  }
  if (!isRecord(value)) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(value)) {
    defineOwnSetting(output, key, cloneSettingsValue(childValue));
  }
  return output as T;
}

function defineOwnSetting(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function getOwnArray(record: Record<string, unknown>, key: string): unknown[] | undefined {
  const value = hasOwn(record, key) ? record[key] : undefined;
  return Array.isArray(value) ? value : undefined;
}

function getOwnNonEmptyString(record: Record<string, unknown>, key: string): string | undefined {
  const value = hasOwn(record, key) ? record[key] : undefined;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getOwnNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = hasOwn(record, key) ? record[key] : undefined;
  return typeof value === 'number' ? value : undefined;
}

function getOwnRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = hasOwn(record, key) ? record[key] : undefined;
  return isRecord(value) ? value : undefined;
}

function hasOwn(record: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
