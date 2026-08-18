/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getRunJSRuntimeHost } from './RunJSRuntimeHost';
import type {
  RunJSSettingsValidationIssue,
  RunJSSettingsValidationMode,
  RunJSSettingsValidationResult,
} from './RunJSRuntimeHost';
import type { RunJSSourceSettingsDescriptor } from './types';

export type JsonSchemaLike = Record<string, unknown>;

export type { RunJSSettingsValidationIssue, RunJSSettingsValidationMode, RunJSSettingsValidationResult };

export function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  return getRunJSRuntimeHost().normalizeSchemaType(schema);
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
  return getRunJSRuntimeHost().validateSettingValue(options);
}

export function validateRunJSSettings(options: {
  schema: JsonSchemaLike;
  settings: unknown;
  mode: RunJSSettingsValidationMode;
}): RunJSSettingsValidationResult {
  return getRunJSRuntimeHost().validateSettings(options);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
