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
import { type AnalyzedTemplate, type ResolvePathPolicy } from '../template/variable-expression';
import { JSONValue, resolveAnalyzedJsonTemplate } from '../template/resolver';
import { analyzeVariableTemplateSafely } from './allow-list';
import { planRecordBindings, type RecordBindingPlan } from './record-bindings';
import { variables } from './registry';
import { prefetchRecordsForResolve } from './utils';

export type ResolveBatchItem = {
  id?: string | number;
  template: JSONValue;
  contextParams?: Record<string, unknown>;
};

export type AnalyzedResolveBatchItem = ResolveBatchItem & {
  analysis: AnalyzedTemplate;
  bindingPlan: RecordBindingPlan;
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
  const result = analyzeVariableTemplateSafely(template);
  if (!result.ok) return template;
  const bindingPlan = createTrustedRecordBindingPlan(result.analysis, contextParams);
  return resolveAnalyzedVariablesTemplate(ctx, result.analysis, TRUSTED_RESOLVE_POLICY, bindingPlan);
}

function createTrustedRecordBindingPlan(analysis: AnalyzedTemplate, contextParams: Readonly<Record<string, unknown>>) {
  return planRecordBindings({
    contextParams,
    mode: 'trusted',
    usage: analysis.usage,
  });
}

export async function resolveAnalyzedVariablesTemplate(
  ctx: ResourcerContext,
  analysis: AnalyzedTemplate,
  policy: ResolvePathPolicy,
  bindingPlan: RecordBindingPlan,
) {
  await prefetchRecordsForResolve(ctx, bindingPlan.bindings);
  return resolveAnalyzedVariablesTemplateWithPrefetchedRecords(ctx, analysis, policy, bindingPlan);
}

async function resolveAnalyzedVariablesTemplateWithPrefetchedRecords(
  ctx: ResourcerContext,
  analysis: AnalyzedTemplate,
  policy: ResolvePathPolicy,
  bindingPlan: RecordBindingPlan,
) {
  const requestCtx = new HttpRequestContext(ctx);
  requestCtx.delegate(getGlobalContext(ctx));
  await variables.attachUsedVariablesFromPlan(requestCtx, ctx, analysis.usage, bindingPlan);
  return resolveAnalyzedJsonTemplate(analysis, requestCtx, policy);
}

export async function resolveVariablesBatch(ctx: ResourcerContext, items: ResolveBatchItem[]) {
  const analyzedItems: AnalyzedResolveBatchItem[] = [];
  const results: Array<{ id?: string | number; data: unknown } | undefined> = [];
  for (const [index, item] of items.entries()) {
    const result = analyzeVariableTemplateSafely(item?.template ?? {});
    if (!result.ok) {
      results[index] = { id: item?.id, data: item?.template ?? {} };
      continue;
    }
    analyzedItems.push({
      ...item,
      id: index,
      analysis: result.analysis,
      bindingPlan: createTrustedRecordBindingPlan(result.analysis, item.contextParams || {}),
      policy: TRUSTED_RESOLVE_POLICY,
    });
  }

  const resolvedItems = await resolveAnalyzedVariablesBatch(ctx, analyzedItems);
  for (const item of resolvedItems) {
    const index = Number(item.id);
    results[index] = { id: items[index]?.id, data: item.data };
  }
  return results.filter((item): item is { id?: string | number; data: unknown } => !!item);
}

export async function resolveAnalyzedVariablesBatch(ctx: ResourcerContext, items: AnalyzedResolveBatchItem[]) {
  await prefetchRecordsForResolve(
    ctx,
    items.flatMap((item) => item.bindingPlan.bindings),
  );

  const results: Array<{ id?: string | number; data: unknown }> = [];
  for (const item of items) {
    const data = await resolveAnalyzedVariablesTemplateWithPrefetchedRecords(
      ctx,
      item.analysis,
      item.policy,
      item.bindingPlan,
    );
    results.push({ id: item.id, data });
  }
  return results;
}
