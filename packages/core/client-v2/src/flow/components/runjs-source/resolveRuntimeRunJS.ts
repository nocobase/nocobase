/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeRunJSValue } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry, type RunJSSourceResolverRegistryManager } from './RunJSSourceResolverRegistry';
import {
  INLINE_RUNJS_SOURCE_MODE,
  RunJSSourceResolverError,
  type ResolveRunJSSourceBindingInput,
  type ResolvedRuntimeRunJS,
  type RunJSSourceResolverResult,
  type RuntimeRunJSInput,
} from './types';

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

export async function resolveRunJSSourceBinding(
  input: ResolveRunJSSourceBindingInput,
  registry: RunJSSourceResolverRegistryManager = RunJSSourceResolverRegistry,
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
  registry: RunJSSourceResolverRegistryManager = RunJSSourceResolverRegistry,
): Promise<ResolvedRuntimeRunJS> {
  const sourceMode = normalizeSourceMode(input.sourceMode);
  if (sourceMode !== INLINE_RUNJS_SOURCE_MODE) {
    return resolveRunJSSourceBinding(
      {
        sourceMode,
        sourceBinding: input.sourceBinding,
        settings: input.settings,
        context: input.context,
      },
      registry,
    );
  }

  const runJs = normalizeRunJSValue({
    code: input.runJs?.code ?? '',
    version: input.runJs?.version,
  });
  return {
    code: runJs.code,
    version: runJs.version,
    sourceMode: INLINE_RUNJS_SOURCE_MODE,
    settings: normalizeSettings(input.settings),
    context: input.context,
  };
}
