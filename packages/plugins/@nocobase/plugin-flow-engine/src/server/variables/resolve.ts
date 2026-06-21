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
import { JSONValue, resolveJsonTemplate } from '../template/resolver';
import { variables } from './registry';
import { prefetchRecordsForResolve } from './utils';

type ResolveBatchItem = {
  id?: string | number;
  template: JSONValue;
  contextParams?: Record<string, unknown>;
};

const GLOBAL_CONTEXT_KEY = Symbol.for('nocobase.flow-engine.variables.global-context');

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
  await prefetchRecordsForResolve(ctx, [{ template, contextParams }]);
  return resolveVariablesTemplateWithPrefetchedRecords(ctx, template, contextParams);
}

async function resolveVariablesTemplateWithPrefetchedRecords(
  ctx: ResourcerContext,
  template: JSONValue,
  contextParams: Record<string, unknown> = {},
) {
  const requestCtx = new HttpRequestContext(ctx);
  requestCtx.delegate(getGlobalContext(ctx));
  await variables.attachUsedVariables(requestCtx, ctx, template, contextParams);
  return resolveJsonTemplate(template, requestCtx);
}

export async function resolveVariablesBatch(ctx: ResourcerContext, items: ResolveBatchItem[]) {
  await prefetchRecordsForResolve(
    ctx,
    items.map((item) => ({
      template: item?.template ?? {},
      contextParams: (item?.contextParams || {}) as Record<string, unknown>,
    })),
  );

  const results: Array<{ id?: string | number; data: unknown }> = [];
  for (const item of items) {
    const data = await resolveVariablesTemplateWithPrefetchedRecords(
      ctx,
      item?.template ?? {},
      (item?.contextParams || {}) as Record<string, unknown>,
    );
    results.push({ id: item?.id, data });
  }
  return results;
}
