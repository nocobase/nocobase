/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ActionParams, APIClient, IResource, RequestOptions } from '@nocobase/sdk';
import type { FlowContext } from '../flowContext';
import type { FlowEngine } from '../flowEngine';
import { DATA_SOURCE_DIRTY_EVENT } from '../views/viewEvents';

type ResourceActionFn = (params?: ActionParams, opts?: unknown) => Promise<unknown>;

type ResourceRequestOptions = RequestOptions & {
  resource?: unknown;
  action?: unknown;
  headers?: unknown;
};

type DirtyResourceAction = {
  resourceName: string;
  actionName: string;
};

type ApiUrlProvider = {
  getApiUrl?: (pathname?: string) => string;
};

type DirtyAwareAPIClient = APIClient & {
  resource: APIClient['resource'];
  request: APIClient['request'];
};

const dirtyAwareApiClientCache = new WeakMap<object, WeakMap<object, APIClient>>();
const dirtyAwareApiClientProxies = new WeakSet<object>();

const MUTATING_RESOURCE_ACTIONS = [
  'add',
  'bind',
  'create',
  'destroy',
  'disable',
  'enable',
  'firstorcreate',
  'insert',
  'load',
  'move',
  'pull',
  'push',
  'remove',
  'retry',
  'save',
  'set',
  'sync',
  'toggle',
  'unbind',
  'update',
  'updateorcreate',
];

function isApiClientLike(value: unknown): value is DirtyAwareAPIClient {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as { resource?: unknown; request?: unknown };
  return typeof candidate.resource === 'function' && typeof candidate.request === 'function';
}

function isMutatingResourceAction(actionName: string): boolean {
  const normalized = String(actionName || '').trim();
  if (!normalized) {
    return false;
  }
  const baseActionName = normalized.split('/')[0];
  const lowerBaseActionName = baseActionName.toLowerCase();
  if (MUTATING_RESOURCE_ACTIONS.includes(lowerBaseActionName)) {
    return true;
  }

  return MUTATING_RESOURCE_ACTIONS.some((prefix) => {
    if (!lowerBaseActionName.startsWith(prefix) || baseActionName.length <= prefix.length) {
      return false;
    }

    const nextChar = baseActionName[prefix.length];
    return nextChar === '-' || nextChar === '_' || (nextChar >= 'A' && nextChar <= 'Z');
  });
}

function getHeaderValue(headers: unknown, name: string): unknown {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const maybeHeaders = headers as { get?: (key: string) => unknown };
  if (typeof maybeHeaders.get === 'function') {
    const value = maybeHeaders.get(name);
    if (value != null && value !== '') {
      return value;
    }
  }

  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return undefined;
}

function getDataSourceKeyFromHeaders(headers: unknown): string {
  const value = getHeaderValue(headers, 'x-data-source');
  if (Array.isArray(value)) {
    return String(value[0] || 'main');
  }
  return value == null || value === '' ? 'main' : String(value);
}

function getAffectedResourceNames(resourceName: unknown): string[] {
  const name = String(resourceName || '').trim();
  if (!name) {
    return [];
  }

  const names = new Set<string>([name]);
  if (name.includes('.')) {
    names.add(name.split('.')[0]);
  }
  return Array.from(names);
}

function getCurrentOrigin(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location?.origin;
}

function parseUrl(value: string, base?: string): URL | undefined {
  try {
    return new URL(value, base);
  } catch {
    return undefined;
  }
}

function stripSearchAndHash(path: string): string {
  const index = path.search(/[?#]/);
  return index === -1 ? path : path.slice(0, index);
}

function stripKnownApiPrefix(path: string): string | undefined {
  const cleanPath = stripSearchAndHash(path).trim();
  if (!cleanPath) {
    return undefined;
  }

  const normalizedPath = cleanPath.replace(/^\/+/, '');
  if (!normalizedPath || normalizedPath === 'api') {
    return undefined;
  }
  if (normalizedPath.startsWith('api/')) {
    return normalizedPath.slice('api/'.length);
  }

  return normalizedPath;
}

function normalizePathname(pathname: string) {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function getAppApiUrl(app?: ApiUrlProvider): URL | undefined {
  if (!app?.getApiUrl) {
    return undefined;
  }

  try {
    return parseUrl(app.getApiUrl(), getCurrentOrigin());
  } catch {
    return undefined;
  }
}

function stripConfiguredApiPrefix(path: string, apiPathname: string): string | undefined {
  const cleanPath = stripSearchAndHash(path).trim();
  if (!cleanPath.startsWith('/')) {
    return undefined;
  }

  const apiPath = normalizePathname(apiPathname);
  const requestPath = normalizePathname(cleanPath);
  if (!requestPath.startsWith(apiPath)) {
    return undefined;
  }

  const apiPathWithoutTrailingSlash = apiPath.replace(/\/$/, '');
  return cleanPath.slice(apiPathWithoutTrailingSlash.length).replace(/^\/+/, '') || undefined;
}

function getDirtyResourcePathFromAbsoluteUrl(url: URL, app?: ApiUrlProvider): string | undefined {
  if (!['http:', 'https:'].includes(url.protocol)) {
    return undefined;
  }

  if (app?.getApiUrl) {
    const apiUrl = getAppApiUrl(app);
    if (!apiUrl || url.origin !== apiUrl.origin) {
      return undefined;
    }

    return stripConfiguredApiPrefix(url.pathname, apiUrl.pathname);
  }

  const currentOrigin = getCurrentOrigin();
  if (!currentOrigin || url.origin !== currentOrigin) {
    return undefined;
  }

  return stripKnownApiPrefix(url.pathname);
}

function getDirtyResourcePathFromUrl(url: unknown, context: FlowContext): string | undefined {
  if (typeof url !== 'string') {
    return undefined;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl.startsWith('//')) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    const parsedUrl = parseUrl(trimmedUrl);
    if (!parsedUrl) {
      return undefined;
    }
    return getDirtyResourcePathFromAbsoluteUrl(parsedUrl, context.app as ApiUrlProvider | undefined);
  }

  const appApiUrl = getAppApiUrl(context.app as ApiUrlProvider | undefined);
  const configuredResourcePath = appApiUrl ? stripConfiguredApiPrefix(trimmedUrl, appApiUrl.pathname) : undefined;
  if (configuredResourcePath) {
    return configuredResourcePath;
  }

  return stripKnownApiPrefix(trimmedUrl);
}

function decodeResourcePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function parseDirtyResourceActionFromUrl(url: unknown, context: FlowContext): DirtyResourceAction | undefined {
  const resourcePath = getDirtyResourcePathFromUrl(url, context);
  if (!resourcePath) {
    return undefined;
  }

  const segments = stripSearchAndHash(resourcePath).split('/').filter(Boolean);
  const resourceSegments: string[] = [];
  let actionName: string | undefined;
  let actionSegmentIndex = -1;

  for (let index = 0; index < segments.length; index += 2) {
    const segment = segments[index];
    const actionDelimiterIndex = segment.lastIndexOf(':');
    const resourceSegment = actionDelimiterIndex === -1 ? segment : segment.slice(0, actionDelimiterIndex);
    if (!resourceSegment) {
      return undefined;
    }

    resourceSegments.push(decodeResourcePathSegment(resourceSegment));
    if (actionDelimiterIndex !== -1) {
      actionName = decodeResourcePathSegment(segment.slice(actionDelimiterIndex + 1)).trim();
      actionSegmentIndex = index;
      break;
    }
  }

  if (!actionName || !resourceSegments.length) {
    return undefined;
  }

  if (segments.length > actionSegmentIndex + 2) {
    return undefined;
  }

  return {
    resourceName: resourceSegments.join('.'),
    actionName,
  };
}

function resolveDirtyResourceAction(
  options: ResourceRequestOptions,
  context: FlowContext,
): DirtyResourceAction | undefined {
  const resourceName = typeof options?.resource === 'string' ? options.resource : undefined;
  const actionName = typeof options?.action === 'string' ? options.action : undefined;
  if (resourceName && actionName) {
    return { resourceName, actionName };
  }

  return parseDirtyResourceActionFromUrl(options?.url, context);
}

function getDirtyTargetEngines(engine: FlowEngine): FlowEngine[] {
  const engines: FlowEngine[] = [];
  const seen = new Set<FlowEngine>();
  let current: FlowEngine | undefined = engine;
  let guard = 0;

  while (current && guard++ < 50) {
    if (!seen.has(current)) {
      engines.push(current);
      seen.add(current);
    }
    current = current.previousEngine;
  }

  return engines;
}

function markResourceActionDataSourceDirty(context: FlowContext, resourceName: unknown, headers: unknown) {
  const engine = context.engine as FlowEngine | undefined;
  if (!engine?.markDataSourceDirty) {
    return;
  }

  const resourceNames = getAffectedResourceNames(resourceName);
  if (!resourceNames.length) {
    return;
  }

  const dataSourceKey = getDataSourceKeyFromHeaders(headers);
  for (const targetEngine of getDirtyTargetEngines(engine)) {
    for (const name of resourceNames) {
      targetEngine.markDataSourceDirty(dataSourceKey, name);
    }
  }

  engine.emitter?.emit?.(DATA_SOURCE_DIRTY_EVENT, {
    dataSourceKey,
    resourceNames,
  });
}

function createDirtyAwareResource(
  context: FlowContext,
  resource: IResource,
  resourceName: string,
  headers: unknown,
): IResource {
  return new Proxy(resource, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (typeof prop !== 'string' || typeof original !== 'function' || !isMutatingResourceAction(prop)) {
        return original;
      }

      const action = original as ResourceActionFn;
      return async (...args: Parameters<ResourceActionFn>) => {
        const result = await action(...args);
        markResourceActionDataSourceDirty(context, resourceName, headers);
        return result;
      };
    },
  });
}

function createDirtyAwareApiClient(api: DirtyAwareAPIClient, context: FlowContext): APIClient {
  const resource: APIClient['resource'] = (name, of, headers, cancel) => {
    const targetResource = api.resource(name, of, headers, cancel);
    return createDirtyAwareResource(context, targetResource, name, headers);
  };

  const request: APIClient['request'] = async (config) => {
    const options = config as ResourceRequestOptions;
    const dirtyResourceAction = resolveDirtyResourceAction(options, context);
    const result = await api.request(config);
    if (dirtyResourceAction && isMutatingResourceAction(dirtyResourceAction.actionName)) {
      markResourceActionDataSourceDirty(context, dirtyResourceAction.resourceName, options.headers);
    }
    return result;
  };

  const proxy = new Proxy(api, {
    get(target, prop, receiver) {
      if (prop === 'resource') {
        return resource;
      }
      if (prop === 'request') {
        return request;
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as APIClient;
  dirtyAwareApiClientProxies.add(proxy);
  return proxy;
}

export function getDirtyAwareApiClient(value: unknown, context: FlowContext): unknown {
  if (!isApiClientLike(value)) {
    return value;
  }

  if (dirtyAwareApiClientProxies.has(value)) {
    return value;
  }

  const api = value as unknown as APIClient;
  let contextCache = dirtyAwareApiClientCache.get(api);
  if (!contextCache) {
    contextCache = new WeakMap<object, APIClient>();
    dirtyAwareApiClientCache.set(api, contextCache);
  }

  const cached = contextCache.get(context);
  if (cached) {
    return cached;
  }

  const wrapped = createDirtyAwareApiClient(value, context);
  contextCache.set(context, wrapped);
  return wrapped;
}
