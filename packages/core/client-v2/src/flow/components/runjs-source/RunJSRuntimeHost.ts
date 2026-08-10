/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSValue } from '@nocobase/flow-engine';

import type { RunJSSourceResolverRegistryHost } from './RunJSSourceResolverRegistry';
import type { ResolveRunJSSourceBindingInput, ResolvedRuntimeRunJS, RuntimeRunJSInput } from './types';

export type RunJSSettingsRecord = Record<string, unknown>;

export interface RunJSSettingsDescriptorLike {
  entryId: string;
  settingsSchemaHash: string | null;
  schema?: RunJSSettingsRecord | null;
  defaults?: RunJSSettingsRecord;
}

export interface NormalizeJsTemplateSelectionInput {
  currentBinding?: unknown;
  currentSettings?: unknown;
  submittedSettings?: unknown;
  nextBinding: unknown;
  descriptor: RunJSSettingsDescriptorLike;
}

export type RunJSSettingsValidationMode = 'binding' | 'runtime';

export type RunJSSettingsValidationIssue = {
  code: 'required' | 'type' | 'enum' | 'constraint' | 'unknown';
  path: string;
};

export type RunJSSettingsValidationResult = {
  errors: RunJSSettingsValidationIssue[];
  missingRequiredPaths: string[];
};

export type RunJSRuntimeError = {
  code?: string;
  status?: number;
  reasonCode?: string;
  message?: string;
  details?: Record<string, unknown>;
  paths?: string[];
};

export interface RunJSRuntimeHost {
  getCanonicalRunJSSettings(runJs: unknown): RunJSSettingsRecord;
  getJsTemplateId(binding: unknown): string | undefined;
  getJsTemplateSettingStepKey(entryId: string, propertyPath: string): string;
  isSettingsFieldVisible(
    condition: unknown,
    input: { defaults?: RunJSSettingsRecord; settings?: RunJSSettingsRecord },
  ): boolean;
  normalizeJsTemplateSelection(input: NormalizeJsTemplateSelectionInput): RunJSSettingsRecord;
  normalizeJsTemplateSettings(
    descriptor: Pick<RunJSSettingsDescriptorLike, 'schema' | 'defaults'>,
    settings: unknown,
  ): RunJSSettingsRecord;
  setJsTemplateTopLevelSetting(settings: unknown, propertyName: string, value: unknown): RunJSSettingsRecord;
  normalizeSchemaType(schema: RunJSSettingsRecord): string | undefined;
  validateSettingValue(options: {
    schema: RunJSSettingsRecord;
    value: unknown;
    required: boolean;
    mode: RunJSSettingsValidationMode;
    path?: string;
  }): RunJSSettingsValidationResult;
  validateSettings(options: {
    schema: RunJSSettingsRecord;
    settings: unknown;
    mode: RunJSSettingsValidationMode;
  }): RunJSSettingsValidationResult;
  resolveSourceBinding(
    input: ResolveRunJSSourceBindingInput,
    registry?: RunJSSourceResolverRegistryHost,
  ): Promise<ResolvedRuntimeRunJS>;
  resolveRuntime(input: RuntimeRunJSInput, registry?: RunJSSourceResolverRegistryHost): Promise<ResolvedRuntimeRunJS>;
  createRuntimeContext(baseCtx: unknown, resolved: ResolvedRuntimeRunJS): unknown;
  evaluateResolvedValue(input: { ctx: unknown; resolved: ResolvedRuntimeRunJS }): Promise<unknown>;
  evaluateInlineValue(input: { ctx: unknown; runJs: RunJSValue }): Promise<unknown>;
  getModelUse(model: unknown): string | undefined;
  readRuntimeError(error: unknown): RunJSRuntimeError;
}

const hosts: RunJSRuntimeHost[] = [];

export function registerRunJSRuntimeHost(host: RunJSRuntimeHost): () => void {
  hosts.push(host);
  let registered = true;
  return () => {
    if (!registered) {
      return;
    }
    registered = false;
    const index = hosts.lastIndexOf(host);
    if (index >= 0) {
      hosts.splice(index, 1);
    }
  };
}

export function getRunJSRuntimeHost(): RunJSRuntimeHost {
  const host = hosts.at(-1);
  if (!host) {
    throw new Error('RunJS client runtime is not installed');
  }
  return host;
}

export function clearRunJSRuntimeHosts(): void {
  hosts.length = 0;
}

export const getCanonicalRunJSSettings: RunJSRuntimeHost['getCanonicalRunJSSettings'] = (...args) =>
  getRunJSRuntimeHost().getCanonicalRunJSSettings(...args);

export const getJsTemplateId: RunJSRuntimeHost['getJsTemplateId'] = (...args) =>
  getRunJSRuntimeHost().getJsTemplateId(...args);

export const getJsTemplateSettingStepKey: RunJSRuntimeHost['getJsTemplateSettingStepKey'] = (...args) =>
  getRunJSRuntimeHost().getJsTemplateSettingStepKey(...args);

export const isSettingsFieldVisible: RunJSRuntimeHost['isSettingsFieldVisible'] = (...args) =>
  getRunJSRuntimeHost().isSettingsFieldVisible(...args);

export const normalizeJsTemplateSelection: RunJSRuntimeHost['normalizeJsTemplateSelection'] = (...args) =>
  getRunJSRuntimeHost().normalizeJsTemplateSelection(...args);

export const normalizeJsTemplateSettings: RunJSRuntimeHost['normalizeJsTemplateSettings'] = (...args) =>
  getRunJSRuntimeHost().normalizeJsTemplateSettings(...args);

export const setJsTemplateTopLevelSetting: RunJSRuntimeHost['setJsTemplateTopLevelSetting'] = (...args) =>
  getRunJSRuntimeHost().setJsTemplateTopLevelSetting(...args);
