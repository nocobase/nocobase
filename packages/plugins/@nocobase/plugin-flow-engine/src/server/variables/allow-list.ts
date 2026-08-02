/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { decodeJwtSessionPayload, getFlowModelRdSessionId, resolveFlowModelUidFromRd } from '@nocobase/utils';
import FlowModelRepository from '../repository';
import {
  analyzeVariableTemplate,
  type AnalyzedTemplate,
  type ResolvePathPolicy,
} from '../template/variable-expression';
import type { JSONValue } from '../template/resolver';
import { sanitizeRegisteredVariableContextParams, type ValidateContextParamsResult, variables } from './registry';

type RecordParams = {
  appends?: unknown;
  associationName?: string;
  collection: string;
  dataSourceKey?: string;
  fields?: unknown;
  filterByTk: unknown;
  sourceId?: unknown;
};

type RoleWithStrategy = {
  getStrategy?: () => { allowConfigure?: boolean } | null | undefined;
};

type AclWithRoles = {
  getRole?: (name: string) => RoleWithStrategy | undefined;
};

type RoleRecord = {
  allowConfigure?: unknown;
  get?: (key: string) => unknown;
};

export type AuthorizationResult = {
  allowed: boolean;
  analysis: AnalyzedTemplate;
  contextParams: Record<string, unknown>;
  flowModelUid?: string;
  policy: ResolvePathPolicy;
};

type FlowModelPathCacheValue = Promise<ReadonlySet<string> | null> | ReadonlySet<string> | null;

export function clearVariableAllowListCache(app?: object) {
  // Kept as a stable invalidation hook for callers; allow-lists are request-local to avoid stale cross-request caches.
  return app;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isRecordParams(value: unknown): value is RecordParams {
  return (
    isObject(value) && typeof value.collection === 'string' && Object.prototype.hasOwnProperty.call(value, 'filterByTk')
  );
}

export function hasRecordContextParams(value: unknown): boolean {
  if (isRecordParams(value)) return true;
  if (Array.isArray(value)) return value.some((item) => hasRecordContextParams(item));
  if (!isObject(value)) return false;
  return Object.values(value).some((item) => hasRecordContextParams(item));
}

export function sanitizeContextParams(value: Record<string, unknown> = {}): Record<string, unknown> {
  const sanitizeStringArray = (input: unknown) =>
    Array.isArray(input) && input.every((item) => typeof item === 'string') ? input : undefined;

  const sanitize = (input: unknown): unknown => {
    if (isRecordParams(input)) {
      const { associationName, collection, filterByTk, dataSourceKey, sourceId } = input;
      const fields = sanitizeStringArray(input.fields);
      const appends = sanitizeStringArray(input.appends);
      return {
        associationName,
        collection,
        filterByTk,
        dataSourceKey,
        sourceId,
        ...(fields ? { fields } : {}),
        ...(appends ? { appends } : {}),
      };
    }
    if (Array.isArray(input)) return input.map((item) => sanitize(item));
    if (!isObject(input)) return input;

    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(input)) output[key] = sanitize(child);
    return output;
  };

  return sanitize(value) as Record<string, unknown>;
}

function getRequestState(ctx: ResourcerContext): Record<string, unknown> {
  const request = ctx as ResourcerContext & { state?: Record<string, unknown> };
  if (!request.state) request.state = {};
  return request.state;
}

async function getFlowModelAllowedPaths(
  ctx: ResourcerContext,
  flowModelUid: string,
): Promise<ReadonlySet<string> | null> {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveAllowListCache';
  const cache =
    (state[cacheKey] as Map<string, FlowModelPathCacheValue> | undefined) || new Map<string, FlowModelPathCacheValue>();
  state[cacheKey] = cache;
  if (cache.has(flowModelUid)) return (await cache.get(flowModelUid)) || null;

  const load = (async () => {
    const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
    const model = await repository.findModelById(flowModelUid, { includeAsyncNode: true });
    if (!model) return null;
    const analysis = analyzeVariableTemplate(model, { mode: 'flow-model' });
    return new Set(analysis.paths.map((path) => path.canonicalKey));
  })();
  cache.set(flowModelUid, load);
  const allowedPaths = await load;
  cache.set(flowModelUid, allowedPaths);
  return allowedPaths;
}

function getCurrentRoleNames(ctx: ResourcerContext): string[] {
  const state = (ctx as ResourcerContext & { state?: { currentRole?: unknown; currentRoles?: unknown } }).state;
  const roleNames = new Set<string>();
  const currentRoles = state?.currentRoles;
  if (Array.isArray(currentRoles)) {
    currentRoles.forEach((roleName) => {
      if (typeof roleName === 'string' && roleName) roleNames.add(roleName);
    });
  }
  if (typeof state?.currentRole === 'string' && state.currentRole) roleNames.add(state.currentRole);
  return Array.from(roleNames);
}

async function readCurrentRoleAllowsConfigure(ctx: ResourcerContext): Promise<boolean> {
  const roleNames = getCurrentRoleNames(ctx);
  if (!roleNames.length) return false;
  if (roleNames.includes('root')) return true;

  const acl = (ctx.app as typeof ctx.app & { acl?: AclWithRoles }).acl;
  if (roleNames.some((roleName) => acl?.getRole?.(roleName)?.getStrategy?.()?.allowConfigure === true)) return true;

  try {
    const roles = (await ctx.db.getRepository('roles').find({
      filter: { name: roleNames },
      fields: ['name', 'allowConfigure'],
    })) as RoleRecord[];
    return roles.some((role) =>
      typeof role?.get === 'function' ? role.get('allowConfigure') === true : role?.allowConfigure === true,
    );
  } catch {
    return false;
  }
}

async function currentRoleAllowsConfigure(ctx: ResourcerContext): Promise<boolean> {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveRoleAllowsConfigure';
  const cached = state[cacheKey];
  if (typeof cached === 'boolean') return cached;
  if (cached instanceof Promise) return await cached;

  const pending = readCurrentRoleAllowsConfigure(ctx);
  state[cacheKey] = pending;
  const allowed = await pending;
  state[cacheKey] = allowed;
  return allowed;
}

function getRequestBearerToken(ctx: ResourcerContext): string {
  const contextWithBearerToken = ctx as ResourcerContext & { getBearerToken?: () => string | undefined };
  const token = contextWithBearerToken.getBearerToken?.();
  if (token) return token;

  const authorization =
    typeof ctx.get === 'function' ? ctx.get('authorization') || ctx.get('Authorization') : undefined;
  if (typeof authorization !== 'string') return '';
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1] || '';
}

function getCurrentRequestRdSessionId(ctx: ResourcerContext): string {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveRdSessionId';
  const cached = state[cacheKey];
  if (typeof cached === 'string') return cached;

  const sessionId = getFlowModelRdSessionId(decodeJwtSessionPayload(getRequestBearerToken(ctx)));
  state[cacheKey] = sessionId;
  return sessionId;
}

function resolveFlowModelUidFromRequestRd(ctx: ResourcerContext, rd?: string | number): string {
  if (typeof rd !== 'string' || !rd) return '';
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveRdUidCache';
  const cache = (state[cacheKey] as Map<string, string> | undefined) || new Map<string, string>();
  state[cacheKey] = cache;
  if (cache.has(rd)) return cache.get(rd) || '';

  const flowModelUid = resolveFlowModelUidFromRd(rd, getCurrentRequestRdSessionId(ctx)) || '';
  cache.set(rd, flowModelUid);
  return flowModelUid;
}

function createPolicy(
  allowAll = false,
  allowedPaths: ReadonlySet<string> = new Set(),
  unrestrictedVariables: ReadonlySet<string> = new Set(),
): ResolvePathPolicy {
  return { allowAll, allowedPaths, unrestrictedVariables };
}

function denied(
  analysis: AnalyzedTemplate,
  contextParams: Record<string, unknown>,
  policy: ResolvePathPolicy,
  flowModelUid?: string,
): AuthorizationResult {
  return { allowed: false, analysis, contextParams, flowModelUid, policy };
}

export async function authorizeVariablesResolve(
  ctx: ResourcerContext,
  options: {
    contextParams?: Record<string, unknown>;
    rd?: string | number;
    template: JSONValue;
  },
): Promise<AuthorizationResult> {
  const analysis = analyzeVariableTemplate(options.template);
  let contextParams = sanitizeContextParams(options.contextParams || {});
  const flowModelUid = resolveFlowModelUidFromRequestRd(ctx, options.rd);
  const unrestrictedVariables = new Set<string>();
  let policy = createPolicy(false, new Set(), unrestrictedVariables);

  if (!analysis.supported) {
    contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
    return denied(analysis, contextParams, policy, flowModelUid || undefined);
  }

  const flowModelRequiredVars = new Set<string>();
  for (const [varName, usedPaths] of Object.entries(analysis.usage)) {
    const def = variables.get(varName);
    const validation: ValidateContextParamsResult =
      (await def?.validateContextParams?.({
        contextParams,
        flowModelUid: flowModelUid || undefined,
        koaCtx: ctx,
        usage: usedPaths,
        varName,
      })) || {};

    contextParams = sanitizeContextParams(validation?.contextParams || contextParams);
    if (validation?.allowed === false) {
      contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
      return denied(analysis, contextParams, policy, flowModelUid || undefined);
    }
    if (validation?.requireFlowModel === false) unrestrictedVariables.add(varName);
    else flowModelRequiredVars.add(varName);
  }

  contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));

  if (await currentRoleAllowsConfigure(ctx)) {
    policy = createPolicy(true, new Set(), unrestrictedVariables);
    return { allowed: true, analysis, contextParams, policy };
  }

  if (flowModelRequiredVars.size > 0 && !flowModelUid) return denied(analysis, contextParams, policy);

  const allowedPaths = flowModelUid ? await getFlowModelAllowedPaths(ctx, flowModelUid) : null;
  policy = createPolicy(false, allowedPaths || new Set(), unrestrictedVariables);
  if (flowModelRequiredVars.size > 0 && !allowedPaths) {
    return denied(analysis, contextParams, policy, flowModelUid || undefined);
  }

  for (const path of analysis.paths) {
    if (unrestrictedVariables.has(path.varName)) continue;
    if (!allowedPaths?.has(path.canonicalKey)) {
      return denied(analysis, contextParams, policy, flowModelUid || undefined);
    }
  }

  return { allowed: true, analysis, contextParams, flowModelUid: flowModelUid || undefined, policy };
}
