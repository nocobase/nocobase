/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, normalizeRunJSValue, type RunJSValue } from '@nocobase/flow-engine';

import type { ResolvedRuntimeRunJS } from './types';
import { INLINE_RUNJS_SOURCE_MODE } from './types';

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

function hasRunJSRuntimeExecutor(value: unknown): value is RunJSRuntimeExecutor {
  return Boolean(value) && typeof value === 'object' && typeof (value as RunJSRuntimeExecutor).runjs === 'function';
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
