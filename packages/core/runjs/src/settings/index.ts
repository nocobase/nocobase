/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSSettingsRecord = Record<string, unknown>;

export * from './condition';
export * from './defaults';

export interface LightExtensionSettingsDescriptorLike {
  entryId: string;
  settingsSchemaHash: string | null;
  schema?: RunJSSettingsRecord | null;
  defaults?: RunJSSettingsRecord;
}

export interface NormalizeLightExtensionEntrySelectionInput {
  currentBinding?: unknown;
  currentSettings?: unknown;
  submittedSettings?: unknown;
  nextBinding: unknown;
  descriptor: LightExtensionSettingsDescriptorLike;
}

export function getLightExtensionEntryId(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }
  return toNonEmptyString(binding.entryId);
}

export function getCanonicalRunJSSettings(runJs: unknown): RunJSSettingsRecord {
  if (!isRecord(runJs) || !isRecord(runJs.settings)) {
    return {};
  }
  return cloneJsonValue(runJs.settings);
}

export function normalizeLightExtensionSettings(
  descriptor: Pick<LightExtensionSettingsDescriptorLike, 'schema' | 'defaults'>,
  settings: unknown,
): RunJSSettingsRecord {
  const defaults = isRecord(descriptor.defaults) ? descriptor.defaults : {};
  const current = isRecord(settings) ? settings : {};
  const properties = getSchemaProperties(descriptor.schema);

  if (!properties) {
    return mergeDefaults(defaults, current);
  }

  return Object.fromEntries(
    Object.entries(properties).flatMap(([propertyName, propertySchema]) => {
      const hasCurrent = Object.prototype.hasOwnProperty.call(current, propertyName);
      const hasDefault = Object.prototype.hasOwnProperty.call(defaults, propertyName);
      const hasSchemaDefault =
        isRecord(propertySchema) && Object.prototype.hasOwnProperty.call(propertySchema, 'default');

      if (!hasCurrent && !hasDefault && !hasSchemaDefault) {
        return [];
      }

      const defaultValue = hasDefault
        ? defaults[propertyName]
        : hasSchemaDefault
          ? (propertySchema as RunJSSettingsRecord).default
          : undefined;
      const value = hasCurrent ? mergeDefaultValue(defaultValue, current[propertyName]) : cloneJsonValue(defaultValue);
      return [[propertyName, value]];
    }),
  );
}

export function normalizeLightExtensionEntrySelection(
  input: NormalizeLightExtensionEntrySelectionInput,
): RunJSSettingsRecord {
  const currentEntryId = getLightExtensionEntryId(input.currentBinding);
  const nextEntryId = getLightExtensionEntryId(input.nextBinding) || input.descriptor.entryId;
  const retainedSettings =
    currentEntryId && currentEntryId === nextEntryId
      ? mergeSettings(input.currentSettings, input.submittedSettings)
      : {};
  return normalizeLightExtensionSettings(input.descriptor, retainedSettings);
}

export function setLightExtensionTopLevelSetting(
  settings: unknown,
  propertyName: string,
  value: unknown,
): RunJSSettingsRecord {
  return {
    ...(isRecord(settings) ? cloneJsonValue(settings) : {}),
    [propertyName]: cloneJsonValue(value),
  };
}

export function getLightExtensionSettingStepKey(entryId: string, propertyPath: string): string {
  const entryPart = sanitizeStepKeyPart(entryId);
  const pathPart = sanitizeStepKeyPart(propertyPath);
  return `lightExtensionSetting__${entryPart}__${pathPart}__${shortHash(`${entryId}:${propertyPath}`)}`;
}

export function cloneJsonValue<T>(value: T): T {
  if (typeof value === 'undefined') {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function getSchemaProperties(schema: unknown): RunJSSettingsRecord | null {
  return isRecord(schema) && isRecord(schema.properties) ? schema.properties : null;
}

function mergeDefaults(defaults: RunJSSettingsRecord, current: RunJSSettingsRecord): RunJSSettingsRecord {
  const result = cloneJsonValue(current);
  for (const [key, defaultValue] of Object.entries(defaults)) {
    result[key] = Object.prototype.hasOwnProperty.call(current, key)
      ? mergeDefaultValue(defaultValue, current[key])
      : cloneJsonValue(defaultValue);
  }
  return result;
}

function mergeSettings(base: unknown, submitted: unknown): RunJSSettingsRecord {
  return mergeDefaults(isRecord(base) ? base : {}, isRecord(submitted) ? submitted : {});
}

function mergeDefaultValue(defaultValue: unknown, currentValue: unknown): unknown {
  if (!isRecord(defaultValue) || !isRecord(currentValue)) {
    return cloneJsonValue(currentValue);
  }
  return mergeDefaults(defaultValue, currentValue);
}

function sanitizeStepKeyPart(value: string): string {
  const sanitized = value
    .replace(/[^a-zA-Z0-9_]/gu, '_')
    .replace(/_+/gu, '_')
    .replace(/^_+|_+$/gu, '');
  return (sanitized || 'value').slice(0, 40);
}

function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 8);
}

function isRecord(value: unknown): value is RunJSSettingsRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
