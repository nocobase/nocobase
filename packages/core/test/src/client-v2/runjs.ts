/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/// <reference types="vitest/globals" />

import {
  INLINE_RUNJS_SOURCE_MODE,
  registerRunJSRegistryHost,
  registerRunJSRuntimeHost,
  RunJSSourceResolverError,
  type ResolvedRuntimeRunJS,
  type RunJSEditorProvider,
  type RunJSRegistryHost,
  type RunJSRuntimeHost,
  type RunJSSettingsDescriptorProvider,
  type RunJSSettingsValidationIssue,
  type RunJSSettingsValidationResult,
  type RunJSSourceResolver,
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

type Contribution = { key: string; priority?: number };
type RunJSExecutionContext = {
  runjs: (
    code: string,
    variables?: Record<string, unknown>,
    options?: { version?: string },
  ) => Promise<{ success?: boolean; value?: unknown; error?: unknown } | undefined>;
};

const editors = new Map<string, RunJSEditorProvider>();
const settingsDescriptors = new Map<string, RunJSSettingsDescriptorProvider>();
const sourceResolvers = new Map<string, RunJSSourceResolver>();

const registryHost: RunJSRegistryHost = {
  editors: createContributionRegistry(editors),
  settingsDescriptors: {
    ...createContributionRegistry(settingsDescriptors),
    async getSettingsDescriptor(input) {
      for (const provider of getContributions(settingsDescriptors)) {
        if (provider.canHandle?.(input) ?? true) {
          const descriptor = await provider.getSettingsDescriptor(input);
          if (descriptor) {
            return descriptor;
          }
        }
      }
      return undefined;
    },
  },
  sourceResolvers: {
    registerResolver(resolver) {
      const sourceMode = normalizeSourceMode(resolver.sourceMode);
      sourceResolvers.set(sourceMode, { ...resolver, sourceMode });
      return () => sourceResolvers.delete(sourceMode);
    },
    getResolver(sourceMode) {
      return sourceResolvers.get(normalizeSourceMode(sourceMode)) || null;
    },
    getResolvers() {
      return Array.from(sourceResolvers.values());
    },
    clear() {
      sourceResolvers.clear();
    },
  },
};

const runtimeHost: RunJSRuntimeHost = {
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
        ...options,
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
  async resolveSourceBinding(input, registry = registryHost.sourceResolvers) {
    const sourceMode = normalizeSourceMode(input.sourceMode);
    if (!isRecord(input.sourceBinding)) {
      throw new RunJSSourceResolverError(`RunJS source '${sourceMode}' requires sourceBinding`, {
        code: 'RUNJS_SOURCE_BINDING_REQUIRED',
        sourceMode,
      });
    }
    const resolver = registry.getResolver(sourceMode);
    if (!resolver) {
      throw new RunJSSourceResolverError(`RunJS source resolver is not registered for sourceMode '${sourceMode}'`, {
        code: 'RUNJS_SOURCE_RESOLVER_NOT_FOUND',
        sourceMode,
      });
    }
    const settings = toRecord(input.settings);
    const result = await resolver.resolve({ ...input, sourceMode, settings });
    if (typeof result.code !== 'string') {
      throw new RunJSSourceResolverError(`RunJS source resolver '${sourceMode}' must return string code`, {
        code: 'RUNJS_SOURCE_CODE_REQUIRED',
        sourceMode,
      });
    }
    return {
      code: result.code,
      version: result.version || 'v2',
      sourceMode,
      sourceBinding: input.sourceBinding,
      settings: toRecord(result.settings ?? settings),
      context: result.context ?? input.context,
      ...(result.sourceMap === undefined ? {} : { sourceMap: result.sourceMap }),
    };
  },
  async resolveRuntime(input, registry = registryHost.sourceResolvers) {
    const runJs: Record<string, unknown> = isRecord(input.runJs) ? input.runJs : {};
    const sourceMode = normalizeSourceMode(input.sourceMode ?? runJs.sourceMode);
    const sourceBinding = input.sourceBinding ?? getRecord(runJs, 'sourceBinding');
    const settings = toRecord(input.settings ?? runJs.settings);
    if (sourceMode !== INLINE_RUNJS_SOURCE_MODE) {
      return runtimeHost.resolveSourceBinding(
        { sourceMode, sourceBinding, settings, context: input.context },
        registry,
      );
    }
    const code = typeof runJs.code === 'string' ? runJs.code : '';
    return {
      code,
      version: typeof runJs.version === 'string' && runJs.version ? runJs.version : code.trim() ? 'v1' : 'v2',
      sourceMode,
      settings,
      context: input.context,
    };
  },
  createRuntimeContext(baseCtx, resolved) {
    const context: Record<string, unknown> = isRecord(baseCtx) ? Object.create(baseCtx) : {};
    context.settings = resolved.settings;
    context.runJsSource = {
      sourceMode: resolved.sourceMode,
      sourceBinding: resolved.sourceBinding,
      sourceMap: resolved.sourceMap,
      context: resolved.context,
    };
    return context;
  },
  async evaluateResolvedValue({ ctx, resolved }) {
    const context = runtimeHost.createRuntimeContext(ctx, resolved);
    if (!isRunJSExecutionContext(context)) {
      throw new Error('RunJS runtime context does not provide ctx.runjs');
    }
    const result = await context.runjs(resolved.code, undefined, { version: resolved.version });
    if (!result?.success) {
      throw result?.error || new Error('RunJS execution failed');
    }
    return result.value;
  },
  evaluateInlineValue({ ctx, runJs }) {
    const value: Record<string, unknown> = isRecord(runJs) ? runJs : {};
    const code = typeof value.code === 'string' ? value.code : '';
    const resolved: ResolvedRuntimeRunJS = {
      code,
      version: typeof value.version === 'string' && value.version ? value.version : code.trim() ? 'v1' : 'v2',
      sourceMode: INLINE_RUNJS_SOURCE_MODE,
      settings: toRecord(value.settings),
    };
    return runtimeHost.evaluateResolvedValue({ ctx, resolved });
  },
  getModelUse(model) {
    for (const candidate of [
      model,
      getRecord(model, '_options'),
      getRecord(model, 'options'),
      getRecord(model, 'createModelOptions'),
    ]) {
      const use = getString(candidate, 'use');
      if (use) {
        return use;
      }
    }
    return toString((model as { constructor?: { name?: unknown } } | undefined)?.constructor?.name);
  },
  readRuntimeError(error) {
    if (!isRecord(error)) {
      return typeof error === 'string' ? { message: error } : {};
    }
    const response = getRecord(error, 'response');
    const data = getRecord(response, 'data');
    const serverError = Array.isArray(data?.errors) && isRecord(data.errors[0]) ? data.errors[0] : undefined;
    const details = getRecord(serverError, 'details') || getRecord(error, 'details');
    const code = getString(serverError, 'code') || getString(error, 'code');
    const message = getString(serverError, 'message') || getString(error, 'message');
    const status = getNumber(serverError, 'status') ?? getNumber(response, 'status') ?? getNumber(error, 'status');
    const reasonCode = getString(details, 'reasonCode');
    return {
      ...(code ? { code } : {}),
      ...(message ? { message } : {}),
      ...(status === undefined ? {} : { status }),
      ...(reasonCode ? { reasonCode } : {}),
      ...(details ? { details } : {}),
    };
  },
};

export interface SetupRunJSTestHostsOptions {
  registryHost?: RunJSRegistryHost;
  runtimeHost?: Partial<RunJSRuntimeHost>;
}

export function createRunJSTestRuntimeHost(overrides: Partial<RunJSRuntimeHost> = {}): RunJSRuntimeHost {
  return { ...runtimeHost, ...overrides };
}

export function setupRunJSTestHosts(options: SetupRunJSTestHostsOptions = {}): void {
  let disposeHosts: (() => void) | undefined;
  beforeAll(() => {
    const disposeRegistry = registerRunJSRegistryHost(options.registryHost || registryHost);
    const disposeRuntime = registerRunJSRuntimeHost(createRunJSTestRuntimeHost(options.runtimeHost));
    disposeHosts = () => {
      disposeRuntime();
      disposeRegistry();
    };
  });
  afterAll(() => {
    disposeHosts?.();
    disposeHosts = undefined;
    editors.clear();
    settingsDescriptors.clear();
    sourceResolvers.clear();
  });
}

function createContributionRegistry<T extends Contribution>(values: Map<string, T>) {
  return {
    registerProvider(provider: T) {
      values.set(provider.key, provider);
      return () => values.delete(provider.key);
    },
    getProviders() {
      return getContributions(values);
    },
    clear() {
      values.clear();
    },
  };
}

function getContributions<T extends Contribution>(values: Map<string, T>): T[] {
  return Array.from(values.values()).sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));
}

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
  return issue.code === 'required' || issue.code === 'type' || issue.code === 'enum' ? issue.code : 'constraint';
}

function normalizeSourceMode(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : INLINE_RUNJS_SOURCE_MODE;
}

function isRunJSExecutionContext(value: unknown): value is RunJSExecutionContext {
  return isRecord(value) && typeof value.runjs === 'function';
}

function getRecord(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const candidate = value[key];
  return isRecord(candidate) ? candidate : undefined;
}

function getString(value: unknown, key: string): string | undefined {
  return isRecord(value) ? toString(value[key]) : undefined;
}

function getNumber(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const candidate = value[key];
  return typeof candidate === 'number' ? candidate : undefined;
}

function toString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? { ...value } : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
