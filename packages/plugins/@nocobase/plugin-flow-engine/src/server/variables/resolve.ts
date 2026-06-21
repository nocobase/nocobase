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
import { authorizeVariablesResolve } from './allow-list';
import { variables } from './registry';
import { prefetchRecordsForResolve } from './utils';

type ResolveBatchItem = {
  rd?: string;
  id?: string | number;
  template: JSONValue;
  contextParams?: Record<string, unknown>;
};

type ResolveVariablesOptions = {
  rd?: string;
  requireFlowModelUid?: boolean;
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
  options: ResolveVariablesOptions = {},
) {
  const authorization = await authorizeVariablesResolve(ctx, {
    contextParams,
    rd: options.rd,
    requireFlowModelUid: options.requireFlowModelUid,
    template,
  });
  if (!authorization.allowed) {
    return template;
  }
  await prefetchRecordsForResolve(ctx, [{ template, contextParams: authorization.contextParams }]);
  return resolveVariablesTemplateWithPrefetchedRecords(ctx, template, authorization.contextParams);
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

export async function resolveVariablesBatch(
  ctx: ResourcerContext,
  items: ResolveBatchItem[],
  options: Pick<ResolveVariablesOptions, 'requireFlowModelUid'> = {},
) {
  const authorizedItems: ResolveBatchItem[] = [];
  for (const item of items) {
    const template = item?.template ?? {};
    const authorization = await authorizeVariablesResolve(ctx, {
      contextParams: (item?.contextParams || {}) as Record<string, unknown>,
      rd: item?.rd,
      requireFlowModelUid: options.requireFlowModelUid,
      template,
    });
    authorizedItems.push({
      rd: item?.rd,
      id: item?.id,
      template,
      contextParams: authorization.allowed ? authorization.contextParams : undefined,
    });
  }

  await prefetchRecordsForResolve(
    ctx,
    authorizedItems
      .filter((item) => item.contextParams)
      .map((item) => ({
        template: item?.template ?? {},
        contextParams: (item?.contextParams || {}) as Record<string, unknown>,
      })),
  );

  const results: Array<{ id?: string | number; data: unknown }> = [];
  for (const item of authorizedItems) {
    if (!item.contextParams) {
      results.push({ id: item?.id, data: item?.template ?? {} });
      continue;
    }
    const data = await resolveVariablesTemplateWithPrefetchedRecords(
      ctx,
      item?.template ?? {},
      (item?.contextParams || {}) as Record<string, unknown>,
    );
    results.push({ id: item?.id, data });
  }
  return results;
}
