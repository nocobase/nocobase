/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSRuntimeHost,
  RunJSSettingsValidationIssue,
  RunJSSettingsValidationResult,
} from '@nocobase/client-v2';

import {
  formatRunJSSettingsDotPath,
  getCanonicalRunJSSettings,
  getJsTemplateId,
  getJsTemplateSettingStepKey,
  isSettingsFieldVisible,
  normalizeJsTemplateSelection,
  normalizeJsTemplateSettings,
  normalizeRunJSSettingsSchemaType,
  setJsTemplateTopLevelSetting,
  validateRunJSSettings,
  validateRunJSSettingsValue,
  type RunJSSettingsCondition,
  type RunJSSettingsValidationIssue as SharedRunJSSettingsValidationIssue,
} from '@nocobase/runjs/settings';
import {
  createRunJSRuntimeContext,
  evaluateInlineRunJSValue,
  evaluateResolvedRunJSValue,
  getRunJSModelUse,
  resolveRunJSSourceBinding,
  resolveRuntimeRunJS,
} from './runtime';
import { readRunJSRuntimeError } from './runtimeError';

export const runJSRuntimeHost: RunJSRuntimeHost = {
  getCanonicalRunJSSettings,
  getJsTemplateId,
  getJsTemplateSettingStepKey,
  isSettingsFieldVisible: (condition, input) =>
    isSettingsFieldVisible(condition as RunJSSettingsCondition | undefined, input),
  normalizeJsTemplateSelection,
  normalizeJsTemplateSettings,
  setJsTemplateTopLevelSetting,
  normalizeSchemaType: normalizeRunJSSettingsSchemaType,
  validateSettingValue(options) {
    return toClientValidationResult(
      validateRunJSSettingsValue({
        schema: options.schema,
        value: options.value,
        required: options.required,
        mode: options.mode,
        objectIssueOrder: 'client',
        scalarIssueMode: 'first',
        path: options.path ? [options.path] : [],
      }),
    );
  },
  validateSettings(options) {
    return toClientValidationResult(
      validateRunJSSettings({ ...options, objectIssueOrder: 'client', scalarIssueMode: 'first' }),
    );
  },
  resolveSourceBinding: resolveRunJSSourceBinding,
  resolveRuntime: resolveRuntimeRunJS,
  createRuntimeContext: createRunJSRuntimeContext,
  evaluateResolvedValue: evaluateResolvedRunJSValue,
  evaluateInlineValue: evaluateInlineRunJSValue,
  getModelUse: getRunJSModelUse,
  readRuntimeError: readRunJSRuntimeError,
};

function toClientValidationResult(
  result: ReturnType<typeof validateRunJSSettingsValue>,
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
