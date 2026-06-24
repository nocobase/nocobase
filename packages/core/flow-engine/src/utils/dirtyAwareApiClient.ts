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
import { getDataSourceKeyFromHeaders, markDataSourceDirty } from './dataSourceDirty';

type ResourceActionFn = (params?: ActionParams, opts?: unknown) => Promise<unknown>;

export const SKIP_DATA_SOURCE_DIRTY = '__nocobaseSkipDataSourceDirty';

type ResourceRequestOptions = RequestOptions & {
  resource?: unknown;
  resourceOf?: unknown;
  action?: unknown;
  headers?: unknown;
  [SKIP_DATA_SOURCE_DIRTY]?: boolean;
};

type DirtyResourceAction = {
  dataSourceKey?: string;
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

const READ_RESOURCE_ACTIONS = [
  'aggregate',
  'check',
  'children',
  'count',
  'exists',
  'find',
  'get',
  'getsystemsettings',
  'list',
  'listmine',
  'parents',
  'preview',
  'query',
  'refresh',
  'search',
  'send',
  'test',
  'testconnection',
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
  const isReadAction = READ_RESOURCE_ACTIONS.some((action) => {
    if (lowerBaseActionName === action) {
      return true;
    }
    if (!lowerBaseActionName.startsWith(action) || baseActionName.length <= action.length) {
      return false;
    }

    const nextChar = baseActionName[action.length];
    return nextChar === '-' || nextChar === '_' || (nextChar >= 'A' && nextChar <= 'Z');
  });
  return !isReadAction;
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

function getDataSourceKeyFromResourceOf(resourceOf: unknown): string | undefined {
  const dataSourceKey = String(resourceOf ?? '').trim();
  return dataSourceKey || undefined;
}

function parseResourceActionFromSegments(segments: string[]): DirtyResourceAction | undefined {
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

function parseDirtyResourceActionFromUrl(url: unknown, context: FlowContext): DirtyResourceAction | undefined {
  const resourcePath = getDirtyResourcePathFromUrl(url, context);
  if (!resourcePath) {
    return undefined;
  }

  const segments = stripSearchAndHash(resourcePath).split('/').filter(Boolean);
  const firstSegment = decodeResourcePathSegment(segments[0] || '');
  if (firstSegment === 'dataSources' && segments.length >= 3) {
    const dataSourceKey = getDataSourceKeyFromResourceOf(decodeResourcePathSegment(segments[1]));
    const parsed = parseResourceActionFromSegments(segments.slice(2));
    if (dataSourceKey && parsed) {
      return {
        ...parsed,
        dataSourceKey,
      };
    }
  }

  return parseResourceActionFromSegments(segments);
}

function resolveDirtyResourceActionFromResource(
  resourceName: string,
  resourceOf: unknown,
  actionName: string,
  context: FlowContext,
): DirtyResourceAction | undefined {
  const normalizedResourceName = resourceName.trim();
  const normalizedActionName = actionName.trim();
  if (!normalizedResourceName || !normalizedActionName) {
    return undefined;
  }

  if (normalizedResourceName.includes('/')) {
    const parsed = parseDirtyResourceActionFromUrl(`${normalizedResourceName}:${normalizedActionName}`, context);
    if (parsed) {
      return parsed;
    }
  }

  const dataSourcesPrefix = 'dataSources.';
  if (normalizedResourceName.startsWith(dataSourcesPrefix)) {
    const dataSourceKey = getDataSourceKeyFromResourceOf(resourceOf);
    const nestedResourceName = normalizedResourceName.slice(dataSourcesPrefix.length).trim();
    if (dataSourceKey && nestedResourceName) {
      return {
        dataSourceKey,
        resourceName: nestedResourceName,
        actionName: normalizedActionName,
      };
    }
  }

  return {
    resourceName: normalizedResourceName,
    actionName: normalizedActionName,
  };
}

function resolveDirtyResourceAction(
  options: ResourceRequestOptions,
  context: FlowContext,
): DirtyResourceAction | undefined {
  const resourceName = typeof options?.resource === 'string' ? options.resource : undefined;
  const actionName = typeof options?.action === 'string' ? options.action : undefined;
  if (resourceName && actionName) {
    return resolveDirtyResourceActionFromResource(resourceName, options.resourceOf, actionName, context);
  }

  return parseDirtyResourceActionFromUrl(options?.url, context);
}

function markResourceActionDataSourceDirty(
  context: FlowContext,
  dirtyResourceAction: DirtyResourceAction,
  headers: unknown,
) {
  markDataSourceDirty({
    engine: context.engine,
    dataSourceKey: dirtyResourceAction.dataSourceKey || getDataSourceKeyFromHeaders(headers),
    resourceName: dirtyResourceAction.resourceName,
    includePreviousEngines: true,
  });
}

function createDirtyAwareResource(
  context: FlowContext,
  resource: IResource,
  resourceName: string,
  resourceOf: unknown,
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
        const dirtyResourceAction = resolveDirtyResourceActionFromResource(resourceName, resourceOf, prop, context);
        if (dirtyResourceAction) {
          markResourceActionDataSourceDirty(context, dirtyResourceAction, headers);
        }
        return result;
      };
    },
  });
}

function createDirtyAwareApiClient(api: DirtyAwareAPIClient, context: FlowContext): APIClient {
  const resource: APIClient['resource'] = (name, of, headers, cancel) => {
    const targetResource = api.resource(name, of, headers, cancel);
    return createDirtyAwareResource(context, targetResource, name, of, headers);
  };

  const request: APIClient['request'] = async (config) => {
    const options = config as ResourceRequestOptions;
    const skipDataSourceDirty = options?.[SKIP_DATA_SOURCE_DIRTY];
    const dirtyResourceAction = skipDataSourceDirty ? undefined : resolveDirtyResourceAction(options, context);
    const { [SKIP_DATA_SOURCE_DIRTY]: _skipDataSourceDirty, ...cleanConfig } = options;
    const result = await api.request(cleanConfig as typeof config);
    if (dirtyResourceAction && isMutatingResourceAction(dirtyResourceAction.actionName)) {
      markResourceActionDataSourceDirty(context, dirtyResourceAction, options.headers);
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
