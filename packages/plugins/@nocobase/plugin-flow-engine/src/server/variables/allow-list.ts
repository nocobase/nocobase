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

type CtxReference = {
  direct: boolean;
  methodCall: boolean;
  path?: string;
  unsupportedDynamicPath: boolean;
  varName: string;
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

function isIdentifierStart(char: string | undefined) {
  return !!char && /[a-zA-Z_$]/.test(char);
}

function isIdentifierPart(char: string | undefined) {
  return !!char && /[a-zA-Z0-9_$]/.test(char);
}

function skipSpaces(input: string, index: number) {
  let next = index;
  while (/\s/.test(input[next] || '')) next += 1;
  return next;
}

function skipPostfix(input: string, index: number) {
  let next = skipSpaces(input, index);
  while (input[next] === '!') {
    next = skipSpaces(input, next + 1);
  }
  return next;
}

function previousNonSpaceIndex(input: string, index: number) {
  let next = index;
  while (next >= 0 && /\s/.test(input[next] || '')) next -= 1;
  return next;
}

function isGroupedCtxReference(input: string, start: number) {
  const openParenIndex = previousNonSpaceIndex(input, start - 1);
  if (input[openParenIndex] !== '(') return false;

  const beforeOpenParenIndex = previousNonSpaceIndex(input, openParenIndex - 1);
  if (beforeOpenParenIndex < 0) return true;

  const beforeOpenParen = input[beforeOpenParenIndex];
  return !isIdentifierPart(beforeOpenParen) && beforeOpenParen !== ')' && beforeOpenParen !== ']';
}

function hasGroupedContinuation(input: string, index: number) {
  const closeParenIndex = skipSpaces(input, index);
  if (input[closeParenIndex] !== ')') return false;

  const continuationIndex = skipSpaces(input, closeParenIndex + 1);
  return (
    input[continuationIndex] === '.' || input[continuationIndex] === '[' || input.startsWith('?.', continuationIndex)
  );
}

function readIdentifier(input: string, index: number): { next: number; value: string } | null {
  if (!isIdentifierStart(input[index])) return null;
  let next = index + 1;
  while (isIdentifierPart(input[next])) next += 1;
  return { value: input.slice(index, next), next };
}

function readNumber(input: string, index: number): { next: number; value: string } | null {
  const match = input.slice(index).match(/^\d+/);
  return match ? { value: match[0], next: index + match[0].length } : null;
}

function readQuotedProperty(input: string, index: number): { next: number; value: string } | null {
  const quote = input[index];
  if (quote !== '"' && quote !== "'") return null;
  let next = index + 1;
  let value = '';
  while (next < input.length) {
    const char = input[next];
    if (char === '\\') {
      value += input.slice(next, next + 2);
      next += 2;
      continue;
    }
    if (char === quote) {
      return { value, next: next + 1 };
    }
    value += char;
    next += 1;
  }
  return null;
}

function readBracketAccess(input: string, index: number) {
  let next = skipSpaces(input, index + 1);
  const quoted = readQuotedProperty(input, next);
  if (quoted) {
    next = skipSpaces(input, quoted.next);
    if (input[next] !== ']') return { dynamic: true as const };
    return { dynamic: false as const, kind: 'property' as const, next: next + 1, value: quoted.value };
  }

  const number = readNumber(input, next);
  if (number) {
    next = skipSpaces(input, number.next);
    if (input[next] !== ']') return { dynamic: true as const };
    return { dynamic: false as const, kind: 'index' as const, next: next + 1, value: number.value };
  }

  return { dynamic: true as const };
}

function appendPathSegment(segments: string[], kind: 'property' | 'index', value: string) {
  if (kind === 'property') {
    segments.push(value);
    return;
  }
  if (segments.length) {
    segments[segments.length - 1] = `${segments[segments.length - 1]}[${value}]`;
    return;
  }
  segments.push(`[${value}]`);
}

function readAccess(input: string, index: number) {
  const next = skipPostfix(input, index);
  if (input[next] === '[') {
    return readBracketAccess(input, next);
  }
  if (input.startsWith('?.', next)) {
    const propertyStart = skipSpaces(input, next + 2);
    if (input[propertyStart] === '[') {
      return readBracketAccess(input, propertyStart);
    }
    const identifier = readIdentifier(input, propertyStart) || readNumber(input, propertyStart);
    return identifier
      ? { dynamic: false as const, kind: 'property' as const, next: identifier.next, value: identifier.value }
      : null;
  }
  if (input[next] === '.') {
    const propertyStart = skipSpaces(input, next + 1);
    const identifier = readIdentifier(input, propertyStart) || readNumber(input, propertyStart);
    return identifier
      ? { dynamic: false as const, kind: 'property' as const, next: identifier.next, value: identifier.value }
      : null;
  }
  return null;
}

function parseCtxReference(input: string, start: number): { next: number; reference: CtxReference } | null {
  if (input.slice(start, start + 3) !== 'ctx') return null;
  if (isIdentifierPart(input[start - 1]) || isIdentifierPart(input[start + 3])) return null;

  if (isGroupedCtxReference(input, start)) {
    return {
      next: start + 3,
      reference: {
        direct: false,
        methodCall: false,
        unsupportedDynamicPath: true,
        varName: '',
      },
    };
  }

  const rootAccess = readAccess(input, start + 3);
  if (!rootAccess) return null;
  if (rootAccess.dynamic) {
    return {
      next: start + 3,
      reference: {
        direct: false,
        methodCall: false,
        unsupportedDynamicPath: true,
        varName: '',
      },
    };
  }
  if (rootAccess.kind !== 'property') {
    return null;
  }

  const segments: string[] = [];
  let next = rootAccess.next;
  let methodCall = false;
  let unsupportedDynamicPath = false;

  while (next < input.length) {
    const accessStart = skipPostfix(input, next);
    if ((input[accessStart] === '(' || input.startsWith('?.(', accessStart)) && !segments.length) {
      methodCall = true;
      next = accessStart;
      break;
    }

    const access = readAccess(input, next);
    if (!access) {
      next = accessStart;
      break;
    }
    if (access.dynamic) {
      unsupportedDynamicPath = true;
      next = accessStart;
      break;
    }
    appendPathSegment(segments, access.kind, access.value);
    next = access.next;
  }

  const path = segments.join('.');
  return {
    next: Math.max(next, rootAccess.next),
    reference: {
      direct: !path && !methodCall,
      methodCall,
      path: path || undefined,
      unsupportedDynamicPath: unsupportedDynamicPath || hasGroupedContinuation(input, next),
      varName: rootAccess.value,
    },
  };
}

function collectCtxReferences(expr: string): CtxReference[] {
  const references: CtxReference[] = [];
  for (let index = 0; index < expr.length; index += 1) {
    if (expr.slice(index, index + 3) !== 'ctx') continue;
    const parsed = parseCtxReference(expr, index);
    if (!parsed) continue;
    references.push(parsed.reference);
    index = Math.max(index, parsed.next - 1);
  }
  return references;
}

function extractUsedVariablePathsForAllowList(template: JSONValue): {
  unsupportedDynamicPath: boolean;
  usage: Record<string, string[]>;
} {
  const usage: Record<string, string[]> = {};
  let unsupportedDynamicPath = false;

  const visitExpression = (expr: string) => {
    for (const reference of collectCtxReferences(expr)) {
      if (reference.unsupportedDynamicPath) {
        unsupportedDynamicPath = true;
        continue;
      }
      if (!reference.varName) continue;
      usage[reference.varName] = usage[reference.varName] || [];
      if (reference.path) {
        usage[reference.varName].push(reference.path);
      } else if ((reference.direct || reference.methodCall) && !usage[reference.varName].includes('')) {
        usage[reference.varName].push('');
      }
    }
  };

  const visit = (value: JSONValue) => {
    if (typeof value === 'string') {
      const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(value)) !== null) {
        visitExpression(match[1]);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (isObject(value)) {
      Object.values(value).forEach((child) => visit(child as JSONValue));
    }
  };

  visit(template);
  return { unsupportedDynamicPath, usage };
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
      const fields = sanitizeStringArray((input as Record<string, unknown>).fields);
      const appends = sanitizeStringArray((input as Record<string, unknown>).appends);
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
  const { unsupportedDynamicPath, usage } = extractUsedVariablePathsForAllowList(template);
  if (unsupportedDynamicPath) {
    keys.add(unsupportedVariableKey);
  }

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
    template: JSONValue;
  },
): Promise<AuthorizationResult> {
  const contextParams = options.contextParams || {};
  const sanitizedContextParams = sanitizeContextParams(contextParams);

  if (await currentRoleAllowsConfigure(ctx)) {
    return { allowed: true, contextParams };
  }

  const flowModelUid = resolveFlowModelUidFromRequestRd(ctx, options.rd);
  if (!flowModelUid) {
    return { allowed: false, contextParams: sanitizedContextParams };
  }

  const requestedKeys = extractVariableKeys(options.template);
  if (requestedKeys.has(unsupportedVariableKey)) {
    return { allowed: false, contextParams: sanitizedContextParams, flowModelUid };
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
        return { allowed: false, contextParams: sanitizedContextParams, flowModelUid };
      }
      if (!allowedSources.has(sourceKey)) {
        return { allowed: false, contextParams: sanitizedContextParams, flowModelUid };
      }
    }
  }

  return { allowed: true, contextParams: sanitizedContextParams, flowModelUid };
}
