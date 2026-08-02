/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { GlobalContext, HttpRequestContext } from '../template/contexts';
import {
  analyzeVariableTemplate,
  type AnalyzedTemplate,
  type ResolvePathPolicy,
} from '../template/variable-expression';
import { JSONValue, resolveAnalyzedJsonTemplate } from '../template/resolver';
import { variables } from './registry';
import { prefetchRecordsForResolve } from './utils';

export type ResolveBatchItem = {
  id?: string | number;
  template: JSONValue;
  contextParams?: Record<string, unknown>;
};

export type AnalyzedResolveBatchItem = ResolveBatchItem & {
  analysis: AnalyzedTemplate;
  policy: ResolvePathPolicy;
};

const GLOBAL_CONTEXT_KEY = Symbol.for('nocobase.flow-engine.variables.global-context');
const TRUSTED_RESOLVE_POLICY: ResolvePathPolicy = {
  allowAll: true,
  allowedPaths: new Set(),
  unrestrictedVariables: new Set(),
};

function getGlobalContext(ctx: ResourcerContext) {
  const app = ctx.app as typeof ctx.app & { [GLOBAL_CONTEXT_KEY]?: GlobalContext };
  if (!app[GLOBAL_CONTEXT_KEY]) {
    app[GLOBAL_CONTEXT_KEY] = new GlobalContext(app.environment?.getVariables?.());
  }
  return app[GLOBAL_CONTEXT_KEY] as GlobalContext;
}

export async function resolveVariablesTemplate(
  ctx: ResourcerContext,
  template: JSONValue,
  contextParams: Record<string, unknown> = {},
) {
  const analysis = analyzeVariableTemplate(template);
  return resolveAnalyzedVariablesTemplate(ctx, analysis, TRUSTED_RESOLVE_POLICY, contextParams);
}

export async function resolveAnalyzedVariablesTemplate(
  ctx: ResourcerContext,
  analysis: AnalyzedTemplate,
  policy: ResolvePathPolicy,
  contextParams: Record<string, unknown> = {},
) {
  await prefetchRecordsForResolve(ctx, [{ usage: analysis.usage, contextParams }]);
  return resolveAnalyzedVariablesTemplateWithPrefetchedRecords(ctx, analysis, policy, contextParams);
}

async function resolveAnalyzedVariablesTemplateWithPrefetchedRecords(
  ctx: ResourcerContext,
  analysis: AnalyzedTemplate,
  policy: ResolvePathPolicy,
  contextParams: Record<string, unknown>,
) {
  const requestCtx = new HttpRequestContext(ctx);
  requestCtx.delegate(getGlobalContext(ctx));
  await variables.attachUsedVariablesFromUsage(requestCtx, ctx, analysis.usage, contextParams);
  return resolveAnalyzedJsonTemplate(analysis, requestCtx, policy);
}

export async function resolveVariablesBatch(ctx: ResourcerContext, items: ResolveBatchItem[]) {
  return resolveAnalyzedVariablesBatch(
    ctx,
    items.map((item) => ({
      ...item,
      analysis: analyzeVariableTemplate(item?.template ?? {}),
      policy: TRUSTED_RESOLVE_POLICY,
    })),
  );
}

export async function resolveAnalyzedVariablesBatch(ctx: ResourcerContext, items: AnalyzedResolveBatchItem[]) {
  await prefetchRecordsForResolve(
    ctx,
    items.map((item) => ({
      usage: item.analysis.usage,
      contextParams: item.contextParams || {},
    })),
  );

  const results: Array<{ id?: string | number; data: unknown }> = [];
  for (const item of items) {
    const data = await resolveAnalyzedVariablesTemplateWithPrefetchedRecords(
      ctx,
      item.analysis,
      item.policy,
      item.contextParams || {},
    );
    results.push({ id: item.id, data });
  }
  return results;
}
