/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, normalizeRunJSValue, type RunJSValue } from '@nocobase/flow-engine';
import {
  INLINE_RUNJS_SOURCE_MODE,
  RunJSSourceResolverError,
  type ResolveRunJSSourceBindingInput,
  type ResolvedRuntimeRunJS,
  type RunJSSourceResolverRegistryHost,
  type RunJSSourceResolverResult,
  type RuntimeRunJSInput,
} from '@nocobase/client-v2';

import { RunJSSourceResolverRegistry } from './runJSRegistryHost';

type RunJSExecutionResult = {
  success?: boolean;
  value?: unknown;
  error?: unknown;
};

type RunJSRuntimeExecutor = {
  runjs: (
    code: string,
    variables?: Record<string, unknown>,
    options?: { version?: string },
  ) => Promise<RunJSExecutionResult | undefined>;
};

export async function resolveRunJSSourceBinding(
  input: ResolveRunJSSourceBindingInput,
  registry: RunJSSourceResolverRegistryHost = RunJSSourceResolverRegistry,
): Promise<ResolvedRuntimeRunJS> {
  const sourceMode = normalizeSourceMode(input.sourceMode);
  if (sourceMode === INLINE_RUNJS_SOURCE_MODE) {
    throw new RunJSSourceResolverError('Inline RunJS source does not require a source resolver', {
      code: 'RUNJS_SOURCE_MODE_REQUIRED',
      sourceMode,
    });
  }
  if (!input.sourceBinding || typeof input.sourceBinding !== 'object' || Array.isArray(input.sourceBinding)) {
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

  const normalizedInput = {
    ...input,
    sourceMode,
    sourceBinding: input.sourceBinding,
    settings: normalizeSettings(input.settings),
  };
  const result = await resolver.resolve(normalizedInput);
  return normalizeResolverResult(normalizedInput, result);
}

export async function resolveRuntimeRunJS(
  input: RuntimeRunJSInput,
  registry: RunJSSourceResolverRegistryHost = RunJSSourceResolverRegistry,
): Promise<ResolvedRuntimeRunJS> {
  const runJs = normalizeRunJSValue(input.runJs);
  const effectiveVersion = resolveEffectiveVersion(input.runJs?.code, input.runJs?.version);
  const sourceMode = normalizeSourceMode(input.sourceMode ?? runJs.sourceMode);
  const sourceBinding = input.sourceBinding ?? runJs.sourceBinding;
  const settings = input.settings ?? runJs.settings;
  if (sourceMode !== INLINE_RUNJS_SOURCE_MODE) {
    try {
      return await resolveRunJSSourceBinding(
        {
          sourceMode,
          sourceBinding,
          settings,
          context: input.context,
        },
        registry,
      );
    } catch (error) {
      if (!runJs.code.trim() || !canUseLastKnownGood(error)) {
        throw error;
      }
      return {
        code: runJs.code,
        version: effectiveVersion,
        sourceMode,
        ...(sourceBinding ? { sourceBinding } : {}),
        settings: normalizeSettings(settings),
        context: input.context,
      };
    }
  }

  return {
    code: runJs.code,
    version: effectiveVersion,
    sourceMode: INLINE_RUNJS_SOURCE_MODE,
    settings: normalizeSettings(settings),
    context: input.context,
  };
}

export function createRunJSRuntimeContext(baseCtx: unknown, resolved: ResolvedRuntimeRunJS): unknown {
  if (baseCtx && typeof baseCtx === 'object' && !(baseCtx instanceof FlowContext)) {
    const runtimeCtx: Record<string, unknown> = Object.create(baseCtx as object);
    runtimeCtx.settings = resolved.settings;
    runtimeCtx.runJsSource = {
      sourceMode: resolved.sourceMode,
      sourceBinding: resolved.sourceBinding,
      sourceMap: resolved.sourceMap,
      context: resolved.context,
    };
    return runtimeCtx;
  }

  const runtimeCtx = new FlowContext();
  if (baseCtx instanceof FlowContext) {
    try {
      runtimeCtx.delegate(baseCtx);
    } catch {
      // Keep the runtime context usable in tests and degraded integrations.
    }
  }
  runtimeCtx.defineProperty('settings', {
    value: resolved.settings,
  });
  runtimeCtx.defineProperty('runJsSource', {
    value: {
      sourceMode: resolved.sourceMode,
      sourceBinding: resolved.sourceBinding,
      sourceMap: resolved.sourceMap,
      context: resolved.context,
    },
  });
  return runtimeCtx;
}

export async function evaluateResolvedRunJSValue(input: {
  ctx: unknown;
  resolved: ResolvedRuntimeRunJS;
}): Promise<unknown> {
  const runtimeCtx = createRunJSRuntimeContext(input.ctx, input.resolved);
  if (!hasRunJSRuntimeExecutor(runtimeCtx)) {
    throw new Error('RunJS runtime context does not provide ctx.runjs');
  }
  const ret = await runtimeCtx.runjs(input.resolved.code, undefined, {
    version: input.resolved.version,
  });
  if (!ret?.success) {
    throw ret?.error || new Error('RunJS execution failed');
  }
  return ret.value;
}

export async function evaluateInlineRunJSValue(input: { ctx: unknown; runJs: RunJSValue }): Promise<unknown> {
  const runJs = normalizeRunJSValue(input.runJs);
  return evaluateResolvedRunJSValue({
    ctx: input.ctx,
    resolved: {
      code: runJs.code,
      version: runJs.version,
      sourceMode: INLINE_RUNJS_SOURCE_MODE,
      settings: runJs.settings || {},
    },
  });
}

export function getRunJSModelUse(model: unknown): string | undefined {
  return (
    getStringProperty(model, 'use') ||
    getStringProperty(getRecordProperty(model, '_options'), 'use') ||
    getStringProperty(getRecordProperty(model, 'options'), 'use') ||
    getStringProperty(getRecordProperty(model, 'createModelOptions'), 'use') ||
    toNonEmptyString((model as { constructor?: { name?: unknown } } | undefined)?.constructor?.name)
  );
}

function normalizeSourceMode(sourceMode: unknown): string {
  return typeof sourceMode === 'string' && sourceMode.trim() ? sourceMode.trim() : INLINE_RUNJS_SOURCE_MODE;
}

function normalizeSettings(settings: unknown): Record<string, unknown> {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? { ...(settings as Record<string, unknown>) }
    : {};
}

function normalizeVersion(version: unknown): string {
  return typeof version === 'string' && version ? version : 'v2';
}

function resolveEffectiveVersion(code: unknown, version: unknown): string {
  if (typeof version === 'string' && version) {
    return version;
  }
  return typeof code === 'string' && code.trim() ? 'v1' : 'v2';
}

function readResolverErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  if (typeof error.code === 'string') {
    return error.code;
  }
  const response = isRecord(error.response) ? error.response : undefined;
  const data = isRecord(response?.data) ? response.data : isRecord(error.data) ? error.data : undefined;
  const firstError = Array.isArray(data?.errors) ? data.errors[0] : undefined;
  return isRecord(firstError) && typeof firstError.code === 'string' ? firstError.code : undefined;
}

function readResolverErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  if (typeof error.status === 'number') {
    return error.status;
  }
  const response = isRecord(error.response) ? error.response : undefined;
  return typeof response?.status === 'number' ? response.status : undefined;
}

function canUseLastKnownGood(error: unknown): boolean {
  const code = readResolverErrorCode(error);
  if (code === 'RUNJS_SOURCE_RESOLVER_NOT_FOUND' || code === 'JS_TEMPLATE_RUNTIME_UNAVAILABLE') {
    return true;
  }
  if (code && /(DENIED|INVALID|FAILED|CONFLICT|OUTDATED|NOT_FOUND|REQUIRED)$/u.test(code)) {
    return false;
  }
  const status = readResolverErrorStatus(error);
  return status === 404 || status === 502 || status === 503 || status === 504;
}

function normalizeResolverResult(
  input: ResolveRunJSSourceBindingInput,
  result: RunJSSourceResolverResult,
): ResolvedRuntimeRunJS {
  if (typeof result?.code !== 'string') {
    throw new RunJSSourceResolverError(`RunJS source resolver '${input.sourceMode}' must return string code`, {
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: input.sourceMode,
    });
  }

  return {
    code: result.code,
    version: normalizeVersion(result.version),
    sourceMode: input.sourceMode,
    ...(input.sourceBinding ? { sourceBinding: input.sourceBinding } : {}),
    ...(typeof result.sourceMap === 'undefined' ? {} : { sourceMap: result.sourceMap }),
    settings: normalizeSettings(typeof result.settings === 'undefined' ? input.settings : result.settings),
    context: result.context ?? input.context,
  };
}

function hasRunJSRuntimeExecutor(value: unknown): value is RunJSRuntimeExecutor {
  return Boolean(value) && typeof value === 'object' && typeof (value as RunJSRuntimeExecutor).runjs === 'function';
}

function getStringProperty(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return toNonEmptyString(value[key]);
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return isRecord(property) ? property : undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
