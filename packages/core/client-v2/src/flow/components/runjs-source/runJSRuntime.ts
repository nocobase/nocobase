/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '@nocobase/flow-engine';

import type { ResolvedRuntimeRunJS } from './types';
import type { RunJSSourceLocator } from '../runjs-studio';

export const RUNJS_OWNER_KIND = 'flowModel.runjsHost';

export type RunJSOwnerLocator = {
  kind: typeof RUNJS_OWNER_KIND;
  modelUid?: string;
  use?: string;
  hostPath?: string[];
  descriptor?: string;
};

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
  try {
    runtimeCtx.delegate(baseCtx);
  } catch {
    // Keep the runtime context usable in tests and degraded integrations.
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

function hasRunJSRuntimeExecutor(value: unknown): value is RunJSRuntimeExecutor {
  return Boolean(value) && typeof value === 'object' && typeof (value as RunJSRuntimeExecutor).runjs === 'function';
}

export async function reportRunJSRuntimeErrorBestEffort(input: {
  ctx: unknown;
  error: unknown;
  resolved?: ResolvedRuntimeRunJS;
  ownerLocator?: RunJSOwnerLocator;
}): Promise<void> {
  const reporter = getRuntimeErrorReporter(input.ctx);
  if (!reporter) {
    return;
  }

  const ownerLocator = input.ownerLocator || buildRunJSOwnerLocatorFromRuntimeContext(input.ctx);
  const ownerLocatorHash = await hashReferenceOwnerLocatorForRuntime(ownerLocator);
  const sourceBinding = input.resolved?.sourceBinding;
  const resolvedPublicationId = getNestedStringProperty(input.resolved?.context, ['lightExtension', 'publicationId']);

  try {
    await reporter({
      error: input.error,
      sourceMode: input.resolved?.sourceMode,
      sourceBinding,
      sourceMap: input.resolved?.sourceMap,
      settings: input.resolved?.settings,
      repoId: getStringProperty(sourceBinding, 'repoId'),
      entryId: getStringProperty(sourceBinding, 'entryId'),
      publicationId: resolvedPublicationId || getStringProperty(sourceBinding, 'publicationId'),
      ownerKind: RUNJS_OWNER_KIND,
      ownerLocator,
      ownerLocatorHash,
      path:
        getStringProperty(input.resolved?.sourceMap, 'entryPath') ||
        getNestedStringProperty(input.resolved?.context, ['lightExtension', 'entryPath']) ||
        getStringProperty(sourceBinding, 'entryPath'),
    });
  } catch {
    // RunJS execution must not fail because runtime error reporting is unavailable.
  }
}

export function buildRunJSOwnerLocator(input: {
  modelUid?: string;
  use?: string;
  hostPath?: Array<string | number>;
  descriptor?: string;
}): RunJSOwnerLocator {
  return {
    kind: RUNJS_OWNER_KIND,
    ...(toNonEmptyString(input.modelUid) ? { modelUid: toNonEmptyString(input.modelUid) } : {}),
    ...(toNonEmptyString(input.use) ? { use: toNonEmptyString(input.use) } : {}),
    ...(input.hostPath?.length ? { hostPath: input.hostPath.map(String) } : {}),
    ...(toNonEmptyString(input.descriptor) ? { descriptor: toNonEmptyString(input.descriptor) } : {}),
  };
}

export function buildRunJSOwnerLocatorFromSourceLocator(
  locator: RunJSSourceLocator | undefined,
  fallback: { modelUid?: string; use?: string; hostPath?: Array<string | number> } = {},
): RunJSOwnerLocator {
  const fromLocator = getRunJSHostPathFromSourceLocator(locator);
  const modelUid =
    locator && 'modelUid' in locator && typeof locator.modelUid === 'string' ? locator.modelUid : fallback.modelUid;
  return buildRunJSOwnerLocator({
    modelUid,
    use: fallback.use,
    hostPath: fromLocator.length ? fromLocator : fallback.hostPath,
  });
}

export function getRunJSHostPathFromSourceLocator(locator: RunJSSourceLocator | undefined): string[] {
  if (!locator) {
    return [];
  }
  if (locator.kind === 'flowModel.nestedRunJS') {
    return ['stepParams', locator.containerFlowKey, locator.containerStepKey, ...locator.valuePath.map(String)];
  }
  if (locator.kind === 'flowModel.step') {
    return ['stepParams', locator.flowKey, locator.stepKey, ...locator.paramPath.map(String)];
  }
  if (locator.kind === 'flowModel.flowRegistry.runjs') {
    return ['flowRegistry', locator.flowKey, locator.stepKey, ...locator.sourcePath.map(String)];
  }
  return [locator.kind];
}

function buildRunJSOwnerLocatorFromRuntimeContext(ctx: unknown): RunJSOwnerLocator {
  const model = getRecordProperty(ctx, 'model');
  return buildRunJSOwnerLocator({
    modelUid: getStringProperty(model, 'uid'),
    use: getModelUse(model),
  });
}

function getRuntimeErrorReporter(ctx: unknown): ((payload: Record<string, unknown>) => unknown) | null {
  const directReporter = getCallableProperty(ctx, 'reportRuntimeError');
  if (directReporter) {
    return directReporter;
  }
  const model = getRecordProperty(ctx, 'model');
  const modelContext = getRecordProperty(model, 'context');
  return getCallableProperty(modelContext, 'reportRuntimeError') || null;
}

async function hashReferenceOwnerLocatorForRuntime(ownerLocator: RunJSOwnerLocator): Promise<string> {
  const serialized = stableSerialize({
    kind: ownerLocator.kind,
    ...(ownerLocator.modelUid ? { modelUid: ownerLocator.modelUid } : {}),
    ...(ownerLocator.use ? { use: ownerLocator.use } : {}),
    ...(ownerLocator.hostPath?.length ? { hostPath: ownerLocator.hostPath } : {}),
  });
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof TextEncoder === 'undefined') {
    return `local:${shortHash(serialized)}`;
  }
  const bytes = new TextEncoder().encode(serialized);
  const digest = await subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`;
}

function getModelUse(model: unknown): string | undefined {
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

function getNestedStringProperty(value: unknown, path: string[]): string | undefined {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return toNonEmptyString(current);
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return isRecord(property) ? property : undefined;
}

function getCallableProperty(value: unknown, key: string): ((...args: unknown[]) => unknown) | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return typeof property === 'function' ? (property as (...args: unknown[]) => unknown) : undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function shortHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}
