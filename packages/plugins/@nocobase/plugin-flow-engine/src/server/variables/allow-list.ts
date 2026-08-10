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
import FlowModelRepository, { type FlowModelNodeSnapshot } from '../repository';
import {
  analyzeVariableTemplate,
  type AnalyzeTemplateMode,
  type AnalyzedTemplate,
  type ResolvePathPolicy,
} from '../template/variable-expression';
import type { JSONValue } from '../template/resolver';
import { planRecordBindings, type RecordBindingPlan, type RecordBindingUsage } from './record-bindings';
import {
  compileRecordSlotPolicies,
  createFlowModelVariableContract,
  type FlowModelVariableContract,
  type RecordSlotPolicies,
} from './record-slot-policy';
import {
  isSafeRecordBinding,
  sanitizeRegisteredVariableContextParams,
  type ValidateContextParamsResult,
  variables,
} from './registry';
import { prepareFlowModelVariableSource } from './runjs-variable-dependencies';

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

type FlowModelCacheValue = Promise<FlowModelNodeSnapshot | null> | FlowModelNodeSnapshot | null;
type FlowModelChildCacheValue = Promise<FlowModelNodeSnapshot | null> | FlowModelNodeSnapshot | null;
type FlowModelContractCacheValue = Promise<FlowModelVariableContract | null> | FlowModelVariableContract | null;
type FlowModelContractSource = 'node' | 'formAssignRules';

const MAX_FLOW_MODEL_ANCESTORS = 64;

export function clearVariableAllowListCache(app?: object) {
  // Kept as a stable invalidation hook for callers; allow-lists are request-local to avoid stale cross-request caches.
  return app;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readFormAssignRulesVariableSource(node: FlowModelNodeSnapshot): unknown | undefined {
  const stepParams = isObject(node.options.stepParams) ? node.options.stepParams : null;
  const formModelSettings = stepParams && isObject(stepParams.formModelSettings) ? stepParams.formModelSettings : null;
  return formModelSettings && Object.prototype.hasOwnProperty.call(formModelSettings, 'assignRules')
    ? formModelSettings.assignRules
    : undefined;
}

function hasFlowModelUse(node: FlowModelNodeSnapshot) {
  const use = node.options.use;
  return typeof use === 'string' && !!use.trim();
}

function matchesVariableContractType(node: FlowModelNodeSnapshot, type: string): boolean | undefined {
  const marker = node.options.variableContractType;
  if (typeof marker === 'undefined') return undefined;
  return isObject(marker) && marker.type === type && marker.use === node.options.use;
}

function isFormGridNode(node: FlowModelNodeSnapshot) {
  const use = node.options.use;
  const markerMatches = matchesVariableContractType(node, 'formGrid');
  return (
    node.subKey === 'grid' &&
    hasFlowModelUse(node) &&
    (markerMatches === true ||
      (typeof markerMatches === 'undefined' && typeof use === 'string' && use.endsWith('GridModel')))
  );
}

function getReferenceFormUseTemplate(node: FlowModelNodeSnapshot) {
  const stepParams = isObject(node.options.stepParams) ? node.options.stepParams : null;
  const referenceSettings = stepParams && isObject(stepParams.referenceSettings) ? stepParams.referenceSettings : null;
  return referenceSettings && isObject(referenceSettings.useTemplate) ? referenceSettings.useTemplate : null;
}

function isReferenceFormGridNode(node: FlowModelNodeSnapshot) {
  const use = node.options.use;
  return isFormGridNode(node) && typeof use === 'string' && use.endsWith('ReferenceFormGridModel');
}

function getReferenceFormGridTargetUid(node: FlowModelNodeSnapshot) {
  const useTemplate = getReferenceFormUseTemplate(node);
  const templateUid = useTemplate && typeof useTemplate.templateUid === 'string' ? useTemplate.templateUid.trim() : '';
  if (!useTemplate || !templateUid) return '';
  const targetPath = typeof useTemplate.targetPath === 'string' ? useTemplate.targetPath.trim() : '';
  if (targetPath && targetPath !== 'subModels.grid') return '';
  return typeof useTemplate.targetUid === 'string' ? useTemplate.targetUid.trim() : '';
}

function isFormAssignRulesOwnerNode(node: FlowModelNodeSnapshot) {
  const use = node.options.use;
  const markerMatches = matchesVariableContractType(node, 'form');
  return (
    hasFlowModelUse(node) &&
    (markerMatches === true ||
      (typeof markerMatches === 'undefined' &&
        typeof use === 'string' &&
        (use.endsWith('FormModel') || use.endsWith('FormBlockModel'))))
  );
}

function isFormAssignRulesContractPair(formNode: FlowModelNodeSnapshot, gridNode: FlowModelNodeSnapshot) {
  return isFormAssignRulesOwnerNode(formNode) && isFormGridNode(gridNode) && gridNode.parentId === formNode.uid;
}

function isFormAssignRulesRunJsValuePath(pathTail: readonly string[]) {
  return pathTail.length === 3 && pathTail[0] === 'value' && /^\d+$/.test(pathTail[1]) && pathTail[2] === 'value';
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

function getFlowModelRepository(ctx: ResourcerContext) {
  return ctx.db.getCollection('flowModels').repository as FlowModelRepository;
}

async function getFlowModelNode(ctx: ResourcerContext, flowModelUid: string): Promise<FlowModelNodeSnapshot | null> {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveFlowModelCache';
  const cache =
    (state[cacheKey] as Map<string, FlowModelCacheValue> | undefined) || new Map<string, FlowModelCacheValue>();
  state[cacheKey] = cache;
  if (cache.has(flowModelUid)) return (await cache.get(flowModelUid)) || null;

  const load = getFlowModelRepository(ctx).findModelNodeSnapshotById(flowModelUid);
  cache.set(flowModelUid, load);
  const model = await load;
  cache.set(flowModelUid, model);
  return model;
}

async function getFlowModelChildNode(ctx: ResourcerContext, parentUid: string, subKey: string) {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveFlowModelChildCache';
  const cache =
    (state[cacheKey] as Map<string, FlowModelChildCacheValue> | undefined) ||
    new Map<string, FlowModelChildCacheValue>();
  state[cacheKey] = cache;
  const childCacheKey = JSON.stringify([parentUid, subKey]);
  if (cache.has(childCacheKey)) return (await cache.get(childCacheKey)) || null;

  const load = getFlowModelRepository(ctx).findModelNodeSnapshotByParentId(parentUid, { subKey });
  cache.set(childCacheKey, load);
  const child = await load;
  cache.set(childCacheKey, child);
  return child;
}

async function loadFlowModelAncestors(ctx: ResourcerContext, currentNode: FlowModelNodeSnapshot) {
  const ancestors: FlowModelNodeSnapshot[] = [];
  const seen = new Set([currentNode.uid]);
  let parentId = currentNode.parentId;
  while (parentId) {
    if (seen.has(parentId) || ancestors.length >= MAX_FLOW_MODEL_ANCESTORS) {
      throw new Error('Invalid FlowModel ancestor chain');
    }
    seen.add(parentId);
    const parent = await getFlowModelNode(ctx, parentId);
    if (!parent) throw new Error('Missing FlowModel ancestor');
    ancestors.push(parent);
    parentId = parent.parentId;
  }
  return Object.freeze(ancestors);
}

async function loadFlowModelAncestorUids(ctx: ResourcerContext, currentNode: FlowModelNodeSnapshot) {
  try {
    return new Set((await loadFlowModelAncestors(ctx, currentNode)).map((ancestor) => ancestor.uid));
  } catch {
    return null;
  }
}

async function resolveFormAssignRulesVariableSource(ctx: ResourcerContext, contractNode: FlowModelNodeSnapshot) {
  const fromGrid = readFormAssignRulesVariableSource(contractNode);
  if (typeof fromGrid !== 'undefined') return fromGrid;
  if (!contractNode.parentId) return undefined;

  const formNode = await getFlowModelNode(ctx, contractNode.parentId);
  return formNode && isFormAssignRulesContractPair(formNode, contractNode)
    ? readFormAssignRulesVariableSource(formNode)
    : undefined;
}

function createRecordSlotCompilerOptions(ctx: ResourcerContext, currentNode?: FlowModelNodeSnapshot) {
  let ancestors: Promise<readonly FlowModelNodeSnapshot[]> | undefined;
  return {
    app: ctx.app,
    ctx,
    currentNode,
    getCollection: (dataSourceKey: string, collection: string) =>
      dataSourceKey === 'main'
        ? ctx.db.getCollection(collection)
        : ctx.app.dataSourceManager.get(dataSourceKey)?.collectionManager?.getCollection?.(collection),
    loadAncestors: currentNode
      ? () => {
          ancestors ||= loadFlowModelAncestors(ctx, currentNode);
          return ancestors;
        }
      : undefined,
  };
}

async function getFlowModelVariableContract(
  ctx: ResourcerContext,
  contractNode: FlowModelNodeSnapshot,
  runtimeNode: FlowModelNodeSnapshot,
  source: FlowModelContractSource,
): Promise<FlowModelVariableContract | null> {
  const state = getRequestState(ctx);
  const cacheKey = '__variableResolveContractCache';
  const cache =
    (state[cacheKey] as Map<string, FlowModelContractCacheValue> | undefined) ||
    new Map<string, FlowModelContractCacheValue>();
  state[cacheKey] = cache;
  const contractCacheKey = JSON.stringify([source, contractNode.uid, runtimeNode.uid]);
  if (cache.has(contractCacheKey)) return (await cache.get(contractCacheKey)) || null;

  const load = createFlowModelVariableContractFromNode(ctx, contractNode, runtimeNode, source);
  cache.set(contractCacheKey, load);
  const contract = await load;
  cache.set(contractCacheKey, contract);
  return contract;
}

async function createFlowModelVariableContractFromNode(
  ctx: ResourcerContext,
  contractNode: FlowModelNodeSnapshot,
  runtimeNode: FlowModelNodeSnapshot,
  source: FlowModelContractSource,
) {
  const variableSource =
    source === 'formAssignRules'
      ? (await resolveFormAssignRulesVariableSource(ctx, contractNode)) ?? {}
      : contractNode.options;
  const prepared = prepareFlowModelVariableSource(
    variableSource,
    source === 'formAssignRules' ? { isRunJsValuePath: isFormAssignRulesRunJsValuePath } : undefined,
  );
  const contractSource = prepared.ok
    ? prepared.runJsTemplates.length
      ? [prepared.templateSource, ...prepared.runJsTemplates]
      : prepared.templateSource
    : {};
  const result = analyzeVariableTemplateSafely(contractSource, { mode: 'flow-model' });
  const analysis = result.ok ? result.analysis : analyzeVariableTemplate({}, { mode: 'flow-model' });
  return await createFlowModelVariableContract(analysis, createRecordSlotCompilerOptions(ctx, runtimeNode));
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

export async function resolveFlowModelNodeFromRequestRd(ctx: ResourcerContext, rd?: string | number) {
  const flowModelUid = resolveFlowModelUidFromRequestRd(ctx, rd);
  return flowModelUid ? getFlowModelNode(ctx, flowModelUid) : null;
}

async function resolveFormAssignRulesContractNode(
  ctx: ResourcerContext,
  runtimeNode: FlowModelNodeSnapshot,
  contractModelUid: string,
) {
  const contractNode = await getFlowModelNode(ctx, contractModelUid);
  if (!contractNode || !contractNode.parentId || !isFormGridNode(contractNode)) return null;

  const formNode = await getFlowModelNode(ctx, contractNode.parentId);
  if (!formNode || !isFormAssignRulesContractPair(formNode, contractNode)) return null;

  if (isReferenceFormGridNode(contractNode)) {
    const targetUid = getReferenceFormGridTargetUid(contractNode);
    if (!targetUid) return null;
    const targetFormNode = await getFlowModelNode(ctx, targetUid);
    if (!targetFormNode) return null;
    const targetGridNode = await getFlowModelChildNode(ctx, targetFormNode.uid, 'grid');
    if (
      !targetGridNode ||
      !isFormAssignRulesContractPair(targetFormNode, targetGridNode) ||
      isReferenceFormGridNode(targetGridNode)
    ) {
      return null;
    }
    const targetVariableSource = await resolveFormAssignRulesVariableSource(ctx, targetGridNode);
    let contractSourceNode = targetGridNode;
    if (typeof targetVariableSource === 'undefined') {
      if (typeof readFormAssignRulesVariableSource(formNode) === 'undefined') return null;
      contractSourceNode = formNode;
    }

    const directlyRelated =
      runtimeNode.uid === contractNode.uid ||
      runtimeNode.uid === formNode.uid ||
      runtimeNode.uid === targetGridNode.uid ||
      runtimeNode.uid === targetFormNode.uid;
    if (directlyRelated) return contractSourceNode;

    const ancestorUids = await loadFlowModelAncestorUids(ctx, runtimeNode);
    return ancestorUids?.has(contractNode.uid) === true || ancestorUids?.has(targetGridNode.uid) === true
      ? contractSourceNode
      : null;
  }

  if (typeof (await resolveFormAssignRulesVariableSource(ctx, contractNode)) === 'undefined') return null;
  if (runtimeNode.uid === contractNode.uid || runtimeNode.uid === formNode.uid) return contractNode;

  const ancestorUids = await loadFlowModelAncestorUids(ctx, runtimeNode);
  return ancestorUids?.has(contractNode.uid) === true ? contractNode : null;
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

async function createRecordBindingPlan(
  ctx: ResourcerContext,
  contextParams: Readonly<Record<string, unknown>>,
  usage: RecordBindingUsage,
  recordSlotPolicies?: RecordSlotPolicies,
): Promise<RecordBindingPlan> {
  return await planRecordBindings({ contextParams, koaCtx: ctx, policies: recordSlotPolicies, usage });
}

function recordBindingPlanAllowed(plan: RecordBindingPlan) {
  return plan.rejections.length === 0 && plan.bindings.every(isSafeRecordBinding);
}

export async function authorizeVariablesResolve(
  ctx: ResourcerContext,
  options: {
    contractRd?: string | number;
    contextParams?: Record<string, unknown>;
    rd?: string | number;
    template: JSONValue;
  },
): Promise<AuthorizationResult> {
  let contextParams = sanitizeContextParams(options.contextParams || {});
  const flowModelUid = resolveFlowModelUidFromRequestRd(ctx, options.rd);
  const hasContractRd = typeof options.contractRd !== 'undefined';
  const contractModelUid = hasContractRd ? resolveFlowModelUidFromRequestRd(ctx, options.contractRd) : flowModelUid;
  const unrestrictedVariables = new Set<string>();
  let policy = createPolicy(false, new Set(), unrestrictedVariables);
  let recordSlotPolicies: RecordSlotPolicies = new Map();
  const result = analyzeVariableTemplateSafely(options.template, { mode: 'untrusted-request' });
  if (!result.ok) {
    contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
    return {
      allowed: false,
      contextParams: (await createRecordBindingPlan(ctx, contextParams, {})).contextParams,
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
      (await createRecordBindingPlan(ctx, contextParams, analysis.usage)).contextParams,
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
        (await createRecordBindingPlan(ctx, contextParams, analysis.usage)).contextParams,
        policy,
        recordSlotPolicies,
        flowModelUid || undefined,
      );
    }
    if (validation?.requireFlowModel === false) unrestrictedVariables.add(varName);
    else flowModelRequiredVars.add(varName);
  }

  contextParams = sanitizeContextParams(sanitizeRegisteredVariableContextParams(contextParams));
  let bindingPlan = await createRecordBindingPlan(ctx, contextParams, analysis.usage);
  const configureRole = await currentRoleAllowsConfigure(ctx);
  const currentNode = flowModelUid ? await getFlowModelNode(ctx, flowModelUid) : null;

  if (configureRole) {
    policy = createPolicy(true, new Set(), unrestrictedVariables);
    recordSlotPolicies = await compileRecordSlotPolicies(
      analysis,
      createRecordSlotCompilerOptions(ctx, currentNode || undefined),
    );
    bindingPlan = await createRecordBindingPlan(ctx, contextParams, analysis.usage, recordSlotPolicies);
    return recordBindingPlanAllowed(bindingPlan)
      ? {
          allowed: true,
          analysis,
          bindingPlan,
          contextParams: bindingPlan.contextParams,
          ...(currentNode ? { flowModelUid: currentNode.uid } : {}),
          policy,
          recordSlotPolicies,
        }
      : denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies, flowModelUid || undefined);
  }

  if (flowModelRequiredVars.size > 0 && !flowModelUid) {
    return denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies);
  }

  let contractNode = currentNode;
  let contractSource: FlowModelContractSource = 'node';
  if (hasContractRd) {
    contractNode =
      currentNode && contractModelUid
        ? await resolveFormAssignRulesContractNode(ctx, currentNode, contractModelUid)
        : null;
    contractSource = 'formAssignRules';
    if (!contractNode) {
      return denied(analysis, bindingPlan.contextParams, policy, recordSlotPolicies, flowModelUid || undefined);
    }
  }

  const contract =
    contractNode && currentNode
      ? await getFlowModelVariableContract(ctx, contractNode, currentNode, contractSource)
      : null;
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

  if (unrestrictedVariables.size) {
    const requestPolicies = await compileRecordSlotPolicies(
      analysis,
      createRecordSlotCompilerOptions(ctx, currentNode || undefined),
    );
    const mergedPolicies = new Map(recordSlotPolicies);
    for (const path of analysis.paths) {
      if (!unrestrictedVariables.has(path.varName)) continue;
      const requestPolicy = requestPolicies.get(path.canonicalKey);
      if (requestPolicy) mergedPolicies.set(path.canonicalKey, requestPolicy);
    }
    recordSlotPolicies = mergedPolicies;
  }
  bindingPlan = await createRecordBindingPlan(ctx, contextParams, analysis.usage, recordSlotPolicies);
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
