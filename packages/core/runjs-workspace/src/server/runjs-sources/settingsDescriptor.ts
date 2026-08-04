/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_SETTINGS_CONDITION_LIMITS,
  JS_TEMPLATE_SETTINGS_CONDITION_LOGICS,
  JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS,
  JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS,
  JS_TEMPLATE_SETTINGS_SCHEMA_TYPES,
  JS_TEMPLATE_X_COMPONENT_WHITELIST,
} from '@nocobase/js-template-sdk/schema';
import { extractRunJSSettingsDefault } from '@nocobase/runjs/settings';

import { sha256Hex } from '../../shared/hash';
import type { RunJSWorkspaceDiagnostic } from '../../shared/runjs-source-contracts';
import { RunJSWorkspaceSchemaValidator } from './settings-validator/schemaPolicy';
import type { RunJSWorkspaceSettingsCapabilities } from './settings-validator/types';

export interface RunJSWorkspaceSettingsDescriptor {
  key: string | null;
  schema: Record<string, unknown> | null;
  diagnostics: RunJSWorkspaceDiagnostic[];
}

const settingsCapabilities: RunJSWorkspaceSettingsCapabilities = {
  schemaSubset: {
    allowedTypes: JS_TEMPLATE_SETTINGS_SCHEMA_TYPES,
    allowedKeywords: JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS,
  },
  xComponentWhitelist: JS_TEMPLATE_X_COMPONENT_WHITELIST,
  conditions: {
    operators: JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS,
    logic: JS_TEMPLATE_SETTINGS_CONDITION_LOGICS,
    limits: JS_TEMPLATE_SETTINGS_CONDITION_LIMITS,
  },
  limits: {
    maxEntryDescriptorBytes: 128 * 1024,
    maxJsonBytes: 64 * 1024,
    maxSettingsSchemaDepth: 6,
  },
};
const settingsDescriptorValidator = new RunJSWorkspaceSchemaValidator(settingsCapabilities);

export function parseRunJSWorkspaceSettingsDescriptor(path: string, content: string): RunJSWorkspaceSettingsDescriptor {
  const diagnostics: RunJSWorkspaceDiagnostic[] = [];
  const descriptor = settingsDescriptorValidator.validateEntryDescriptor(
    {
      path,
      content,
      size: Buffer.byteLength(content, 'utf8'),
      language: 'json',
    },
    diagnostics,
    {},
  );
  const normalizedDiagnostics = sortDiagnostics(diagnostics);
  return {
    key: descriptor?.key || null,
    schema:
      descriptor && !normalizedDiagnostics.some((item) => item.severity === 'error') ? descriptor.settingsSchema : null,
    diagnostics: normalizedDiagnostics,
  };
}

export function buildRunJSWorkspaceSettingsHashes(settingsSchema: Record<string, unknown> | null): {
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
} {
  if (!settingsSchema) {
    return { settingsSchemaHash: null, settingsDefaultsHash: null };
  }
  return {
    settingsSchemaHash: sha256Hex(settingsSchemaSerialize(settingsSchema)),
    settingsDefaultsHash: sha256Hex(stableSerialize(extractRunJSSettingsDefault(settingsSchema).value)),
  };
}

function sortDiagnostics(diagnostics: RunJSWorkspaceDiagnostic[]): RunJSWorkspaceDiagnostic[] {
  return [...diagnostics].sort((left, right) => {
    return (
      (left.path || '').localeCompare(right.path || '') ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message)
    );
  });
}

function settingsSchemaSerialize(value: unknown, parentKey?: string): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => settingsSchemaSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    const keys = parentKey === 'properties' ? Object.keys(value) : Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${settingsSchemaSerialize(value[key], key)}`).join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
