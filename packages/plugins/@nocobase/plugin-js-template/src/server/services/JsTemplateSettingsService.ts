/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  extractRunJSSettingsDefaults,
  formatRunJSSettingsJsonPath,
  pruneJsTemplateSettingsOverrides,
  validateRunJSSettings,
} from '@nocobase/runjs/settings';

import { JsTemplateError } from '../../shared/errors';

export interface JsTemplateRuntimeSettingsSource {
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

export class JsTemplateSettingsService {
  resolveRuntimeSettings(
    source: JsTemplateRuntimeSettingsSource,
    inputSettings: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    const settingsSchema =
      source.settingsSchema && Object.keys(source.settingsSchema).length
        ? source.settingsSchema
        : { type: 'object', properties: {} };
    const validation = validateRunJSSettings({
      schema: settingsSchema,
      settings: inputSettings || {},
      mode: 'runtime',
    });
    const issues = validation.issues.map(toServerSettingsValidationIssue);

    if (issues.length) {
      throw new JsTemplateError('JS_TEMPLATE_SETTINGS_INVALID', 'JS Template runtime settings are invalid', {
        details: {
          reasonCode: 'settings_invalid',
          templateId: source.id,
          settingsDefaultsHash: source.settingsDefaultsHash,
          issues,
        },
      });
    }

    return isPlainRecord(validation.normalizedValue) ? validation.normalizedValue : {};
  }

  getRuntimeDefaults(source: JsTemplateRuntimeSettingsSource): Record<string, unknown> {
    return extractRunJSSettingsDefaults(source.settingsSchema);
  }

  pruneUnknownSettings(
    source: JsTemplateRuntimeSettingsSource,
    inputSettings: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> {
    return pruneJsTemplateSettingsOverrides(source.settingsSchema, inputSettings);
  }
}

type RunJSSettingsValidationIssue = ReturnType<typeof validateRunJSSettings>['issues'][number];

function toServerSettingsValidationIssue(issue: RunJSSettingsValidationIssue): SettingsValidationIssue {
  const path = formatRunJSSettingsJsonPath(issue.path);
  const fieldName = String(issue.path[issue.path.length - 1] ?? '');

  switch (issue.code) {
    case 'required':
      return {
        path,
        code: 'settings_required',
        message: `Settings field "${fieldName}" is required`,
      };
    case 'type': {
      const expectedType = issue.details?.expectedType || 'unknown';
      const actualType = issue.details?.actualType || 'unknown';
      return {
        path,
        code: 'settings_type_mismatch',
        message: `Expected ${expectedType} settings value`,
        details: { expectedType, actualType },
      };
    }
    case 'enum':
      return {
        path,
        code: 'settings_enum_mismatch',
        message: 'Settings value is not in the allowed enum',
      };
    case 'format': {
      const format = issue.details?.format || '';
      return {
        path,
        code: 'settings_format',
        message: `Settings value must match ${format} format`,
        details: { format },
      };
    }
    case 'minLength':
      return {
        path,
        code: 'settings_min_length',
        message: `Settings value must contain at least ${issue.details?.limit} characters`,
      };
    case 'maxLength':
      return {
        path,
        code: 'settings_max_length',
        message: `Settings value must contain at most ${issue.details?.limit} characters`,
      };
    case 'minimum':
      return {
        path,
        code: 'settings_minimum',
        message: `Settings value must be greater than or equal to ${issue.details?.limit}`,
      };
    case 'maximum':
      return {
        path,
        code: 'settings_maximum',
        message: `Settings value must be less than or equal to ${issue.details?.limit}`,
      };
    case 'unknownProperty':
      return {
        path,
        code: 'settings_unknown_property',
        message: `Settings field "${fieldName}" is not defined by the runtime settings schema`,
      };
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
