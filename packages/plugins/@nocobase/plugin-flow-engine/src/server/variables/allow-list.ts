/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import {
  decodeJwtSessionPayload,
  extractUsedVariablePaths,
  getFlowModelRdSessionId,
  hasUnsupportedDynamicVariablePath,
  resolveFlowModelUidFromRd,
} from '@nocobase/utils';
import FlowModelRepository from '../repository';
import type { JSONValue } from '../template/resolver';

type RecordParams = {
  associationName?: string;
  collection: string;
  dataSourceKey?: string;
  filterByTk: unknown;
  sourceId?: unknown;
};

type VariableAllowList = {
  sourceKeysByContextVariableKey: Map<string, Set<string>>;
  variables: Set<string>;
};

type SourceRef = {
  collection: string;
  dataSourceKey: string;
};

const unsupportedVariableKey = '__unsupported_dynamic_variable_path__';

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

type AuthorizationResult = {
  allowed: boolean;
  contextParams: Record<string, unknown>;
  flowModelUid?: string;
};

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
  const sanitize = (input: unknown): unknown => {
    if (isRecordParams(input)) {
      const { associationName, collection, filterByTk, dataSourceKey, sourceId } = input;
      return { associationName, collection, filterByTk, dataSourceKey, sourceId };
    }
    if (Array.isArray(input)) return input.map((item) => sanitize(item));
    if (!isObject(input)) return input;

    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(input)) {
      output[key] = sanitize(child);
    }
    return output;
  };

  return sanitize(value) as Record<string, unknown>;
}

function normalizeVariablePath(path: string): string {
  return String(path || '')
    .replace(/\[(?:\d+)\]/g, '')
    .replace(/\[(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\]/g, (_m, g1, g2) => `.${(g1 || g2) as string}`)
    .replace(/\.\.+/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
}

function toVariableKey(varName: string, path?: string): string {
  const normalizedPath = normalizeVariablePath(path || '');
  return normalizedPath ? `${varName}.${normalizedPath}` : varName;
}

export function extractVariableKeys(template: JSONValue): Set<string> {
  const keys = new Set<string>();
  if (hasUnsupportedDynamicVariablePath(template)) {
    keys.add(unsupportedVariableKey);
  }

  const usage = extractUsedVariablePaths(template) || {};
  for (const [varName, paths] of Object.entries(usage)) {
    if (!paths.length) {
      keys.add(toVariableKey(varName));
      continue;
    }
    paths.forEach((path) => keys.add(toVariableKey(varName, path)));
  }
  return keys;
}

function toSourceKey(recordParams: Pick<RecordParams, 'collection' | 'dataSourceKey'>): string {
  return `${recordParams.dataSourceKey || 'main'}:${recordParams.collection}`;
}

function makeContextVariableKey(contextKey: string, variableKey: string) {
  return `${contextKey}\n${variableKey}`;
}

function addSourceKey(map: Map<string, Set<string>>, contextKey: string, variableKey: string, sourceKey: string) {
  if (!contextKey || !variableKey || !sourceKey) return;
  const key = makeContextVariableKey(contextKey, variableKey);
  let sources = map.get(key);
  if (!sources) {
    sources = new Set<string>();
    map.set(key, sources);
  }
  sources.add(sourceKey);
}

function normalizeContextKey(contextKey: string): string {
  return normalizeVariablePath(contextKey.replace(/(^|\.)\d+(?=\.|$)/g, '$1'));
}

function getCollectionField(ctx: ResourcerContext, source: SourceRef, fieldName: string) {
  try {
    const app = ctx.app as unknown as {
      dataSourceManager?: {
        get?: (key: string) => { collectionManager?: { getCollection?: (name: string) => unknown } };
      };
    };
    const collection =
      app.dataSourceManager?.get?.(source.dataSourceKey)?.collectionManager?.getCollection?.(source.collection) ||
      ctx.db.getCollection(source.collection);
    return (
      (
        collection as {
          fields?: { get?: (name: string) => { target?: string; options?: { target?: string } } };
          getField?: (name: string) => { target?: string; options?: { target?: string } };
        }
      )?.fields?.get?.(fieldName) ||
      (
        collection as {
          getField?: (name: string) => { target?: string; options?: { target?: string } };
        }
      )?.getField?.(fieldName)
    );
  } catch {
    return undefined;
  }
}

function resolveContextSource(ctx: ResourcerContext, ownerSource: SourceRef, contextParts: string[]): SourceRef | null {
  if (!contextParts.length) return null;

  const recordAnchorIndex = contextParts.findIndex(
    (part, index) => index > 0 && ['record', 'sourceRecord'].includes(part),
  );
  const associationPath = recordAnchorIndex >= 0 ? contextParts.slice(recordAnchorIndex + 1) : contextParts.slice(1);

  let currentSource = ownerSource;
  for (const segment of associationPath) {
    if (!segment || /^\d+$/.test(segment)) continue;
    const field = getCollectionField(ctx, currentSource, segment);
    const target = field?.target || field?.options?.target;
    if (!target) return null;
    currentSource = { collection: target, dataSourceKey: currentSource.dataSourceKey };
  }
  return currentSource;
}

function addVariableSourceBindings(
  ctx: ResourcerContext,
  sources: Map<string, Set<string>>,
  ownerSource: SourceRef,
  variableKey: string,
) {
  if (!variableKey || variableKey === unsupportedVariableKey) return;
  const parts = variableKey.split('.').filter(Boolean);
  for (let index = 1; index < parts.length; index += 1) {
    const contextKey = normalizeContextKey(parts.slice(0, index).join('.'));
    const source = resolveContextSource(ctx, ownerSource, contextKey.split('.').filter(Boolean));
    if (source) {
      addSourceKey(sources, contextKey, variableKey, toSourceKey(source));
    }
  }

  const exactContextKey = normalizeContextKey(variableKey);
  const exactSource = resolveContextSource(ctx, ownerSource, exactContextKey.split('.').filter(Boolean));
  if (exactSource) {
    addSourceKey(sources, exactContextKey, variableKey, toSourceKey(exactSource));
  }
}

function collectSourceKeysFromModel(ctx: ResourcerContext, model: unknown): Map<string, Set<string>> {
  const sources = new Map<string, Set<string>>();

  const addTemplateSources = (source: SourceRef | undefined, template: JSONValue) => {
    if (!source) return;
    extractVariableKeys(template).forEach((variableKey) =>
      addVariableSourceBindings(ctx, sources, source, variableKey),
    );
  };

  const getSourceFromNode = (node: Record<string, unknown>) => {
    const stepParams = node.stepParams;
    const resourceSettings =
      isObject(stepParams) && isObject(stepParams.resourceSettings) ? stepParams.resourceSettings : undefined;
    const init = isObject(resourceSettings?.init) ? resourceSettings.init : undefined;
    const collectionName = typeof init?.collectionName === 'string' ? init.collectionName : undefined;
    if (!collectionName) return undefined;
    return {
      collection: collectionName,
      dataSourceKey: typeof init?.dataSourceKey === 'string' ? init.dataSourceKey : 'main',
    };
  };

  const visit = (node: unknown, inheritedSource?: SourceRef) => {
    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, inheritedSource));
      return;
    }
    if (typeof node === 'string') {
      addTemplateSources(inheritedSource, node);
      return;
    }
    if (!isObject(node)) return;

    const source = getSourceFromNode(node) || inheritedSource;
    Object.values(node).forEach((child) => visit(child, source));
  };

  visit(model);
  return sources;
}

async function getVariableAllowList(ctx: ResourcerContext, flowModelUid: string): Promise<VariableAllowList | null> {
  const state = (ctx as ResourcerContext & { state?: Record<string, unknown> }).state;
  const cacheKey = '__variableResolveAllowListCache';
  const cache =
    (state?.[cacheKey] as Map<string, VariableAllowList> | undefined) || new Map<string, VariableAllowList>();
  if (state && !state[cacheKey]) {
    state[cacheKey] = cache;
  }
  const cached = cache.get(flowModelUid);
  if (cached) return cached;

  const repository = ctx.db.getCollection('flowModels').repository as FlowModelRepository;
  const model = await repository.findModelById(flowModelUid, { includeAsyncNode: true });
  if (!model) return null;

  const variables = extractVariableKeys(model as JSONValue);
  const allowList: VariableAllowList = {
    sourceKeysByContextVariableKey: collectSourceKeysFromModel(ctx, model),
    variables,
  };
  cache.set(flowModelUid, allowList);
  return allowList;
}

function getCurrentRoleNames(ctx: ResourcerContext): string[] {
  const state = (ctx as ResourcerContext & { state?: { currentRole?: unknown; currentRoles?: unknown } }).state;
  const roleNames = new Set<string>();
  const currentRoles = state?.currentRoles;
  if (Array.isArray(currentRoles)) {
    currentRoles.forEach((roleName) => {
      if (typeof roleName === 'string' && roleName) {
        roleNames.add(roleName);
      }
    });
  }

  const currentRole = state?.currentRole;
  if (typeof currentRole === 'string' && currentRole) {
    roleNames.add(currentRole);
  }

  return Array.from(roleNames);
}

async function currentRoleAllowsConfigure(ctx: ResourcerContext): Promise<boolean> {
  const roleNames = getCurrentRoleNames(ctx);
  if (!roleNames.length) return false;
  if (roleNames.includes('root')) return true;

  const acl = (ctx.app as typeof ctx.app & { acl?: AclWithRoles }).acl;
  if (roleNames.some((roleName) => acl?.getRole?.(roleName)?.getStrategy?.()?.allowConfigure === true)) {
    return true;
  }

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

function collectRecordParamEntries(
  value: unknown,
  path: string[] = [],
  output: Array<{ contextKey: string; params: RecordParams }> = [],
): Array<{ contextKey: string; params: RecordParams }> {
  if (isRecordParams(value)) {
    output.push({ contextKey: path.join('.'), params: value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRecordParamEntries(item, [...path, String(index)], output));
    return output;
  }
  if (!isObject(value)) return output;

  for (const [key, child] of Object.entries(value)) {
    collectRecordParamEntries(child, [...path, key], output);
  }
  return output;
}

function getRequestedKeysForContext(requestedKeys: Set<string>, contextKey: string): string[] {
  const normalizedContextKey = normalizeContextKey(contextKey);
  const candidates = new Set([contextKey, normalizedContextKey].filter(Boolean));
  return [...requestedKeys].filter((key) =>
    [...candidates].some((candidate) => key === candidate || key.startsWith(`${candidate}.`)),
  );
}

function getRequestBearerToken(ctx: ResourcerContext): string {
  const contextWithBearerToken = ctx as ResourcerContext & { getBearerToken?: () => string | undefined };
  const token = contextWithBearerToken.getBearerToken?.();
  if (token) return token;

  const authorization =
    typeof ctx.get === 'function' ? ctx.get('authorization') || ctx.get('Authorization') : undefined;
  if (typeof authorization !== 'string') return '';
  const matched = authorization.match(/^Bearer\s+(.+)$/i);
  return matched?.[1] || '';
}

function getCurrentRequestRdSessionId(ctx: ResourcerContext): string {
  const state = (ctx as ResourcerContext & { state?: Record<string, unknown> }).state;
  const cacheKey = '__variableResolveRdSessionId';
  if (typeof state?.[cacheKey] === 'string') {
    return state[cacheKey] as string;
  }

  const sessionId = getFlowModelRdSessionId(decodeJwtSessionPayload(getRequestBearerToken(ctx)));
  if (state) {
    state[cacheKey] = sessionId;
  }
  return sessionId;
}

function resolveFlowModelUidFromRequestRd(ctx: ResourcerContext, rd?: string | number): string {
  if (typeof rd !== 'string' || !rd) return '';
  const state = (ctx as ResourcerContext & { state?: Record<string, unknown> }).state;
  const cacheKey = '__variableResolveRdUidCache';
  const cache = (state?.[cacheKey] as Map<string, string> | undefined) || new Map<string, string>();
  if (state && !state[cacheKey]) {
    state[cacheKey] = cache;
  }
  if (cache.has(rd)) return cache.get(rd) || '';

  const flowModelUid = resolveFlowModelUidFromRd(rd, getCurrentRequestRdSessionId(ctx)) || '';
  cache.set(rd, flowModelUid);
  return flowModelUid;
}

export async function authorizeVariablesResolve(
  ctx: ResourcerContext,
  options: {
    contextParams?: Record<string, unknown>;
    rd?: string | number;
    requireFlowModelUid?: boolean;
    template: JSONValue;
  },
): Promise<AuthorizationResult> {
  const contextParams = options.contextParams || {};
  const sanitizedContextParams = sanitizeContextParams(contextParams);
  const flowModelUid = resolveFlowModelUidFromRequestRd(ctx, options.rd);
  const requestedKeys = extractVariableKeys(options.template);

  if (requestedKeys.has(unsupportedVariableKey)) {
    ctx.throw(403, {
      code: 'VARIABLE_NOT_ALLOWED',
      message: 'Dynamic variable paths are not allowed in public variable resolution',
    });
  }

  if (await currentRoleAllowsConfigure(ctx)) {
    return { allowed: true, contextParams: sanitizedContextParams, flowModelUid };
  }

  if (!flowModelUid) {
    return { allowed: options.requireFlowModelUid === false, contextParams: sanitizedContextParams };
  }

  const allowList = await getVariableAllowList(ctx, flowModelUid);
  if (!allowList) {
    return { allowed: false, contextParams: sanitizedContextParams, flowModelUid };
  }

  for (const key of requestedKeys) {
    if (!allowList.variables.has(key)) {
      return { allowed: false, contextParams: sanitizedContextParams, flowModelUid };
    }
  }

  for (const { contextKey, params } of collectRecordParamEntries(sanitizedContextParams)) {
    const relevantKeys = getRequestedKeysForContext(requestedKeys, contextKey);
    if (!relevantKeys.length) {
      continue;
    }

    const sourceKey = toSourceKey(params);
    const normalizedContextKey = normalizeContextKey(contextKey);
    for (const key of relevantKeys) {
      const allowedSources = allowList.sourceKeysByContextVariableKey.get(
        makeContextVariableKey(normalizedContextKey, key),
      );
      if (!allowedSources) {
        continue;
      }
      if (!allowedSources.has(sourceKey)) {
        return { allowed: false, contextParams: sanitizedContextParams, flowModelUid };
      }
    }
  }

  return { allowed: true, contextParams: sanitizedContextParams, flowModelUid };
}
