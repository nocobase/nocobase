/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { extractUsedVariablePaths, hasUnsupportedDynamicVariablePath } from '@nocobase/utils';
import FlowModelRepository from '../repository';
import type { JSONValue } from '../template/resolver';

type RecordParams = {
  collection: string;
  filterByTk: unknown;
  dataSourceKey?: string;
};

type VariableAllowList = {
  variables: Set<string>;
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
      const { collection, filterByTk, dataSourceKey } = input;
      return { collection, filterByTk, dataSourceKey };
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

export async function authorizeVariablesResolve(
  ctx: ResourcerContext,
  options: {
    contextParams?: Record<string, unknown>;
    flowModelUid?: string | number;
    requireFlowModelUid?: boolean;
    template: JSONValue;
  },
): Promise<Record<string, unknown>> {
  const contextParams = options.contextParams || {};
  const sanitizedContextParams = sanitizeContextParams(contextParams);
  const hasRecordParams = hasRecordContextParams(contextParams);
  const flowModelUid =
    typeof options.flowModelUid === 'string' || typeof options.flowModelUid === 'number'
      ? String(options.flowModelUid).trim()
      : '';
  const requestedKeys = extractVariableKeys(options.template);

  if (requestedKeys.has(unsupportedVariableKey)) {
    ctx.throw(403, {
      code: 'VARIABLE_NOT_ALLOWED',
      message: 'Dynamic variable paths are not allowed in public variable resolution',
    });
  }

  if (await currentRoleAllowsConfigure(ctx)) {
    return sanitizedContextParams;
  }

  if (!flowModelUid) {
    if (hasRecordParams && options.requireFlowModelUid !== false) {
      ctx.throw(400, {
        code: 'FLOW_MODEL_UID_REQUIRED',
        message: 'flowModelUid is required when resolving record variables',
      });
    }
    return sanitizedContextParams;
  }

  const allowList = await getVariableAllowList(ctx, flowModelUid);
  if (!allowList) {
    ctx.throw(404, {
      code: 'FLOW_MODEL_NOT_FOUND',
      message: 'flowModelUid is not found',
    });
    return sanitizedContextParams;
  }

  for (const key of requestedKeys) {
    if (!allowList.variables.has(key)) {
      ctx.throw(403, {
        code: 'VARIABLE_NOT_ALLOWED',
        message: `Variable is not configured in current flow model: ${key}`,
      });
    }
  }

  return sanitizedContextParams;
}
