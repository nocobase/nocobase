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
  type AnalyzeTemplateMode,
  type AnalyzedTemplate,
  type ResolvePathPolicy,
} from '../template/variable-expression';
import type { JSONValue } from '../template/resolver';
import {
  planRecordBindings,
  type RecordBindingPlannerMode,
  type RecordBindingPlan,
  type RecordBindingUsage,
} from './record-bindings';
import {
  createFlowModelVariableContract,
  type FlowModelVariableContract,
  type RecordSlotPolicies,
  type ResolveFlowModelFieldKind,
} from './record-slot-policy';
import {
  isSafeRecordBinding,
  sanitizeRegisteredVariableContextParams,
  type ValidateContextParamsResult,
  variables,
} from './registry';

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

type RecordSlotCollection = {
  fields?: { get?: (name: string) => RecordSlotCollectionField | undefined };
  getField?: (name: string) => RecordSlotCollectionField | undefined;
};

type RecordSlotCollectionField = {
  isAssociationField?: () => boolean;
  isRelationField?: () => boolean;
  targetCollection?: RecordSlotCollection | (() => RecordSlotCollection | undefined);
};

type AuthorizationResultBase = {
  contextParams: Readonly<Record<string, unknown>>;
  flowModelUid?: string;
  policy: ResolvePathPolicy;
  recordSlotPolicies: RecordSlotPolicies;
};

export type AuthorizationResult = AuthorizationResultBase &
  (
    | {
        allowed: true;
        analysis: AnalyzedTemplate;
        bindingPlan: RecordBindingPlan;
      }
    | {
        allowed: false;
        analysis?: AnalyzedTemplate;
      }
  );

export type TemplateAnalysisResult = { ok: true; analysis: AnalyzedTemplate } | { ok: false; errorType: string };

export function analyzeVariableTemplateSafely(
  template: unknown,
  options: Readonly<{ mode?: AnalyzeTemplateMode }> = {},
): TemplateAnalysisResult {
  let analysis: AnalyzedTemplate;
  try {
    analysis = analyzeVariableTemplate(template, options);
  } catch (error) {
    return { ok: false, errorType: error instanceof Error ? error.name : typeof error };
  }
  return { ok: true, analysis };
}

type FlowModelCacheValue = Promise<Record<string, unknown> | null> | Record<string, unknown> | null;
type FlowModelContractCacheValue = Promise<FlowModelVariableContract | null> | FlowModelVariableContract | null;

export function clearVariableAllowListCache(app?: object) {
  // Kept as a stable invalidation hook for callers; allow-lists are request-local to avoid stale cross-request caches.
  return app;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isRecordParams(value: unknown): value is RecordParams {
  return (
    isObject(value) &&
    typeof value.collection === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'filterByTk') &&
    (typeof value.dataSourceKey === 'undefined' || typeof value.dataSourceKey === 'string') &&
    (typeof value.associationName === 'undefined' || typeof value.associationName === 'string') &&
    (typeof value.fields === 'undefined' ||
      (Array.isArray(value.fields) && value.fields.every((field) => typeof field === 'string'))) &&
    (typeof value.appends === 'undefined' ||
      (Array.isArray(value.appends) && value.appends.every((append) => typeof append === 'string')))
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

function getFlowModelParentId(model: Record<string, unknown>) {
  return typeof model.parentId === 'string' && model.parentId ? model.parentId : undefined;
}

function getFlowModelRepository(ctx: ResourcerContext) {
  return ctx.db.getCollection('flowModels').repository as FlowModelRepository;
}

async function getFlowModel(ctx: ResourcerContext, flowModelUid: string): Promise<Record<string, unknown> | null> {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveFlowModelCache';
  const cache =
    (state[cacheKey] as Map<string, FlowModelCacheValue> | undefined) || new Map<string, FlowModelCacheValue>();
  state[cacheKey] = cache;
  if (cache.has(flowModelUid)) return (await cache.get(flowModelUid)) || null;

  const load = (async () => {
    const model = await getFlowModelRepository(ctx).findModelById(flowModelUid, { includeAsyncNode: true });
    return isObject(model) ? model : null;
  })();
  cache.set(flowModelUid, load);
  const model = await load;
  cache.set(flowModelUid, model);
  return model;
}

function createFieldKindResolver(ctx: ResourcerContext): ResolveFlowModelFieldKind {
  return (dataSourceKey, collectionName, fieldPath) => {
    let collection = (
      dataSourceKey === 'main'
        ? ctx.db.getCollection(collectionName)
        : ctx.app.dataSourceManager.get(dataSourceKey)?.collectionManager?.getCollection?.(collectionName)
    ) as RecordSlotCollection | undefined;
    const segments = fieldPath.split('.').filter(Boolean);
    for (let index = 0; index < segments.length; index++) {
      const field = collection?.getField?.(segments[index]) ?? collection?.fields?.get?.(segments[index]);
      if (!field) return undefined;
      const association = field.isAssociationField?.() === true || field.isRelationField?.() === true;
      if (index === segments.length - 1) return association ? 'association' : 'field';
      if (!association || !field.targetCollection) return undefined;
      collection = typeof field.targetCollection === 'function' ? field.targetCollection() : field.targetCollection;
    }
    return undefined;
  };
}

async function getFlowModelVariableContract(
  ctx: ResourcerContext,
  flowModelUid: string,
): Promise<FlowModelVariableContract | null> {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveContractCache';
  const cache =
    (state[cacheKey] as Map<string, FlowModelContractCacheValue> | undefined) ||
    new Map<string, FlowModelContractCacheValue>();
  state[cacheKey] = cache;
  if (cache.has(flowModelUid)) return (await cache.get(flowModelUid)) || null;

  const load = (async () => {
    const model = await getFlowModel(ctx, flowModelUid);
    if (!model) return null;
    const result = analyzeVariableTemplateSafely(model, { mode: 'flow-model' });
    if (!result.ok) {
      return createFlowModelVariableContract(analyzeVariableTemplate({}, { mode: 'flow-model' }));
    }

    const ancestorModels: Record<string, unknown>[] = [];
    if (result.analysis.paths.some((path) => path.varName === 'formValues' || path.varName === 'item')) {
      const seen = new Set([flowModelUid]);
      let parentId = getFlowModelParentId(model);
      while (parentId && !seen.has(parentId)) {
        seen.add(parentId);
        const parent = await getFlowModel(ctx, parentId);
        if (!parent) break;
        ancestorModels.push(parent);
        parentId = getFlowModelParentId(parent);
      }
    }

    return createFlowModelVariableContract(result.analysis, {
      ancestorModels,
      flowModel: model,
      resolveFieldKind: createFieldKindResolver(ctx),
    });
  })();
  cache.set(flowModelUid, load);
  const contract = await load;
  cache.set(flowModelUid, contract);
  return contract;
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

  const roles = (await ctx.db.getRepository('roles').find({
    filter: { name: roleNames },
    fields: ['name', 'allowConfigure'],
  })) as RoleRecord[];
  return roles.some((role) =>
    typeof role?.get === 'function' ? role.get('allowConfigure') === true : role?.allowConfigure === true,
  );
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
  contextParams: Readonly<Record<string, unknown>>,
  policy: ResolvePathPolicy,
  recordSlotPolicies: RecordSlotPolicies,
  flowModelUid?: string,
): AuthorizationResult {
  return { allowed: false, analysis, contextParams, flowModelUid, policy, recordSlotPolicies };
}

function createRecordBindingPlan(
  contextParams: Readonly<Record<string, unknown>>,
  usage: RecordBindingUsage,
  mode: RecordBindingPlannerMode = 'strict',
  recordSlotPolicies?: RecordSlotPolicies,
): RecordBindingPlan {
  return planRecordBindings({ contextParams, mode, policies: recordSlotPolicies, usage });
}

function recordBindingPlanAllowed(plan: RecordBindingPlan) {
  return plan.rejections.length === 0 && plan.bindings.every(isSafeRecordBinding);
}

export async function authorizeVariablesResolve(
  ctx: ResourcerContext,
  options: {
    contextParams?: Record<string, unknown>;
    rd?: string | number;
    template: JSONValue;
  },
): Promise<AuthorizationResult> {
  let contextParams = sanitizeContextParams(options.contextParams || {});
  const flowModelUid = resolveFlowModelUidFromRequestRd(ctx, options.rd);
  const unrestrictedVariables = new Set<string>();
  let policy = createPolicy(false, new Set(), unrestrictedVariables);
  let recordSlotPolicies: RecordSlotPolicies = new Map();
  const result = analyzeVariableTemplateSafely(options.template, { mode: 'untrusted-request' });
  if (!result.ok) {
    contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
    return {
      allowed: false,
      contextParams: createRecordBindingPlan(contextParams, {}).contextParams,
      flowModelUid: flowModelUid || undefined,
      policy,
      recordSlotPolicies,
    };
  }
  const { analysis } = result;

  if (!analysis.supported) {
    contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
    return denied(
      analysis,
      createRecordBindingPlan(contextParams, analysis.usage).contextParams,
      policy,
      recordSlotPolicies,
      flowModelUid || undefined,
    );
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
      return denied(
        analysis,
        createRecordBindingPlan(contextParams, analysis.usage).contextParams,
        policy,
        recordSlotPolicies,
        flowModelUid || undefined,
      );
    }
    if (validation?.requireFlowModel === false) unrestrictedVariables.add(varName);
    else flowModelRequiredVars.add(varName);
  }

  contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
  let bindingPlan = createRecordBindingPlan(contextParams, analysis.usage);

  if (await currentRoleAllowsConfigure(ctx)) {
    policy = createPolicy(true, new Set(), unrestrictedVariables);
    bindingPlan = createRecordBindingPlan(contextParams, analysis.usage, 'trusted');
    return recordBindingPlanAllowed(bindingPlan)
      ? { allowed: true, analysis, bindingPlan, contextParams: bindingPlan.contextParams, policy, recordSlotPolicies }
      : denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies, flowModelUid || undefined);
  }

  if (flowModelRequiredVars.size > 0 && !flowModelUid) {
    return denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies);
  }

  const contract = flowModelUid ? await getFlowModelVariableContract(ctx, flowModelUid) : null;
  const allowedPaths = contract?.allowedPaths || null;
  recordSlotPolicies = contract?.recordSlots || new Map();
  policy = createPolicy(false, allowedPaths || new Set(), unrestrictedVariables);
  if (flowModelRequiredVars.size > 0 && !allowedPaths) {
    return denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies, flowModelUid || undefined);
  }

  for (const path of analysis.paths) {
    if (unrestrictedVariables.has(path.varName)) continue;
    if (!allowedPaths?.has(path.canonicalKey)) {
      return denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies, flowModelUid || undefined);
    }
  }

  bindingPlan = createRecordBindingPlan(contextParams, analysis.usage, 'strict', recordSlotPolicies);
  return recordBindingPlanAllowed(bindingPlan)
    ? {
        allowed: true,
        analysis,
        bindingPlan,
        contextParams: bindingPlan.contextParams,
        flowModelUid: flowModelUid || undefined,
        policy,
        recordSlotPolicies,
      }
    : denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies, flowModelUid || undefined);
}
