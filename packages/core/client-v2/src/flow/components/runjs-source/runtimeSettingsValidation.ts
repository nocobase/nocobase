/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  formatRunJSSettingsDotPath,
  normalizeRunJSSettingsSchemaType,
  validateRunJSSettings as validateSharedRunJSSettings,
  validateRunJSSettingsValue as validateSharedRunJSSettingsValue,
  type RunJSSettingsValidationIssue as SharedRunJSSettingsValidationIssue,
} from '@nocobase/runjs/settings';

import type { RunJSSourceSettingsDescriptor } from './types';

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
  return normalizeRunJSSettingsSchemaType(schema);
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
  return toClientValidationResult(
    validateSharedRunJSSettingsValue({
      schema: options.schema,
      value: options.value,
      required: options.required,
      mode: options.mode,
      path: options.path ? [options.path] : [],
    }),
  );
}

export function validateRunJSSettings(options: {
  schema: JsonSchemaLike;
  settings: unknown;
  mode: RunJSSettingsValidationMode;
}): RunJSSettingsValidationResult {
  return toClientValidationResult(validateSharedRunJSSettings(options));
}

function toClientValidationResult(
  result: ReturnType<typeof validateSharedRunJSSettingsValue>,
): RunJSSettingsValidationResult {
  return {
    errors: result.issues.map((issue) => ({
      code: toClientIssueCode(issue),
      path: formatRunJSSettingsDotPath(issue.path),
    })),
    missingRequiredPaths: result.missingRequiredPaths.map(formatRunJSSettingsDotPath),
  };
}

function toClientIssueCode(issue: SharedRunJSSettingsValidationIssue): RunJSSettingsValidationIssue['code'] {
  if (issue.code === 'unknownProperty') {
    return 'unknown';
  }
  if (issue.code === 'required' || issue.code === 'type' || issue.code === 'enum') {
    return issue.code;
  }
  return 'constraint';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
