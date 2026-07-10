/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '@nocobase/sdk';
import type { ActionParams, IResource, RequestOptions } from '@nocobase/sdk';
import type { FlowContext } from '../flowContext';
import { getDataSourceKeyFromHeaders, markDataSourceDirty } from './dataSourceDirty';

type ResourceActionFn = (params?: ActionParams, opts?: unknown) => Promise<unknown>;

export const SKIP_DATA_SOURCE_DIRTY = '__nocobaseSkipDataSourceDirty';
// Carries one logical mutation through APIClient's request/resource cross-dispatch.
const DIRTY_DISPATCH_TOKEN = Symbol('nocobaseDirtyDispatchToken');

type DirtyDispatchToken = {
  marked: boolean;
  requestKey?: string;
  resourceKey?: string;
  skip: boolean;
};

type DirtyDispatchFrame = {
  key?: string;
  token: DirtyDispatchToken;
};

type ResourceRequestOptions = RequestOptions & {
  resource?: unknown;
  resourceOf?: unknown;
  action?: unknown;
  headers?: unknown;
  [SKIP_DATA_SOURCE_DIRTY]?: boolean;
  [DIRTY_DISPATCH_TOKEN]?: DirtyDispatchToken;
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

type APIClientRequestConfig = Parameters<APIClient['request']>[0];

const dirtyAwareApiClientCache = new WeakMap<object, WeakMap<object, APIClient>>();
const dirtyAwareApiClientProxies = new WeakSet<object>();

const MUTATING_RESOURCE_ACTIONS = [
  'add',
  'bulkdestroy',
  'bulkupdate',
  'create',
  'delete',
  'destroy',
  'execute',
  'firstorcreate',
  'import',
  'move',
  'remove',
  'save',
  'saveastemplate',
  'set',
  'setfields',
  'submit',
  'update',
  'updateorcreate',
  'upsert',
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
  return MUTATING_RESOURCE_ACTIONS.some((action) => {
    if (lowerBaseActionName === action) {
      return true;
    }
    if (!lowerBaseActionName.startsWith(action) || baseActionName.length <= action.length) {
      return false;
    }

    const nextChar = baseActionName[action.length];
    return nextChar === '-' || nextChar === '_' || (nextChar >= 'A' && nextChar <= 'Z');
  });
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

function getDirtyResourceActionDispatchKey(
  dirtyResourceAction: DirtyResourceAction | undefined,
  headers: unknown,
): string | undefined {
  if (!dirtyResourceAction) {
    return undefined;
  }
  return JSON.stringify([
    dirtyResourceAction.dataSourceKey || getDataSourceKeyFromHeaders(headers),
    dirtyResourceAction.resourceName,
    dirtyResourceAction.actionName,
  ]);
}

function getRequestDispatchKey(options: ResourceRequestOptions, context: FlowContext): string | undefined {
  return getDirtyResourceActionDispatchKey(resolveDirtyResourceAction(options, context), options.headers);
}

function getResourceDispatchKey(name: unknown, of: unknown, headers: unknown): string | undefined {
  const resourceName = String(name ?? '').trim();
  if (!resourceName) {
    return undefined;
  }
  return JSON.stringify([resourceName, String(of ?? ''), getDataSourceKeyFromHeaders(headers)]);
}

function getMatchingRequestToken(
  token: DirtyDispatchToken | undefined,
  requestKey: string | undefined,
): DirtyDispatchToken | undefined {
  // A matching key prevents helper requests inside an override from sharing the outer mutation token.
  if (!token || !requestKey || (token.requestKey && token.requestKey !== requestKey)) {
    return undefined;
  }
  return token;
}

function getMatchingResourceToken(
  token: DirtyDispatchToken | undefined,
  resourceKey: string | undefined,
): DirtyDispatchToken | undefined {
  if (!token || !resourceKey || (token.resourceKey && token.resourceKey !== resourceKey)) {
    return undefined;
  }
  return token;
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

function markResourceActionDataSourceDirtyOnce(
  token: DirtyDispatchToken,
  context: FlowContext,
  dirtyResourceAction: DirtyResourceAction | undefined,
  headers: unknown,
) {
  if (token.skip || token.marked || !dirtyResourceAction || !isMutatingResourceAction(dirtyResourceAction.actionName)) {
    return;
  }
  token.marked = true;
  markResourceActionDataSourceDirty(context, dirtyResourceAction, headers);
}

function isObjectRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return !!value && typeof value === 'object';
}

function createDirtyAwareResource(
  context: FlowContext,
  resource: IResource,
  resourceName: string,
  resourceOf: unknown,
  headers: unknown,
  requestTokenStack: DirtyDispatchFrame[],
  parentToken?: DirtyDispatchToken,
): IResource {
  return new Proxy(resource, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (typeof prop !== 'string' || typeof original !== 'function' || !isMutatingResourceAction(prop)) {
        return original;
      }

      const action = original as ResourceActionFn;
      return async (...args: Parameters<ResourceActionFn>) => {
        const actionOptions = isObjectRecord(args[1]) ? args[1] : undefined;
        const dirtyResourceAction = resolveDirtyResourceActionFromResource(resourceName, resourceOf, prop, context);
        const requestKey = getDirtyResourceActionDispatchKey(dirtyResourceAction, headers);
        const resourceKey = getResourceDispatchKey(resourceName, resourceOf, headers);
        const inheritedToken =
          getMatchingRequestToken(
            actionOptions?.[DIRTY_DISPATCH_TOKEN] as DirtyDispatchToken | undefined,
            requestKey,
          ) || getMatchingRequestToken(parentToken, requestKey);
        const token = inheritedToken || { marked: false, skip: false };
        const ownsToken = !inheritedToken;
        token.requestKey ||= requestKey;
        token.resourceKey ||= resourceKey;
        if (actionOptions?.[SKIP_DATA_SOURCE_DIRTY]) {
          token.skip = true;
        }
        const forwardedArgs: Parameters<ResourceActionFn> =
          actionOptions || args[1] == null
            ? [
                args[0],
                {
                  ...actionOptions,
                  [DIRTY_DISPATCH_TOKEN]: token,
                },
              ]
            : args;
        let actionResult: Promise<unknown>;
        requestTokenStack.push({ key: requestKey, token });
        try {
          actionResult = Reflect.apply(action, receiver, forwardedArgs);
        } finally {
          requestTokenStack.pop();
        }
        const result = await actionResult;
        if (ownsToken) {
          markResourceActionDataSourceDirtyOnce(token, context, dirtyResourceAction, headers);
        }
        return result;
      };
    },
  });
}

function createDirtyAwareApiClient(api: DirtyAwareAPIClient, context: FlowContext): APIClient {
  const baseResource = api.resource;
  const baseRequest = api.request;
  // SDK methods use the dispatch receiver; custom methods keep the original instance for private fields and state.
  const shouldUseResourceDispatchReceiver = baseResource === APIClient.prototype.resource;
  const shouldUseRequestDispatchReceiver = baseRequest === APIClient.prototype.request;
  // Stacks cover synchronous delegation; the symbol token survives async overrides that forward arguments.
  const resourceTokenStack: DirtyDispatchFrame[] = [];
  const requestTokenStack: DirtyDispatchFrame[] = [];
  let hasResourceOverride = false;
  let resourceOverride: unknown;
  let hasRequestOverride = false;
  let requestOverride: unknown;

  const getCurrentResource = () => (hasResourceOverride ? resourceOverride : resource) as APIClient['resource'];
  const getCurrentRequest = () => (hasRequestOverride ? requestOverride : request) as APIClient['request'];

  const dispatchResource = (
    token: DirtyDispatchToken | undefined,
    args: Parameters<APIClient['resource']>,
  ): IResource => {
    const resourceKey = getResourceDispatchKey(args[0], args[1], args[2]);
    const activeToken = getMatchingResourceToken(token, resourceKey);
    const shouldWrapActions = !!activeToken && hasResourceOverride;
    if (activeToken) {
      activeToken.resourceKey ||= resourceKey;
      resourceTokenStack.push({ key: resourceKey, token: activeToken });
    }
    try {
      const resourceInstance = Reflect.apply(getCurrentResource(), proxy, args);
      if (!shouldWrapActions || !activeToken) {
        return resourceInstance;
      }
      return new Proxy(resourceInstance, {
        get(target, prop, receiver) {
          const original = Reflect.get(target, prop, receiver);
          if (typeof prop !== 'string' || typeof original !== 'function' || !isMutatingResourceAction(prop)) {
            return original;
          }

          const action = original as ResourceActionFn;
          return (...actionArgs: Parameters<ResourceActionFn>) => {
            const actionOptions = isObjectRecord(actionArgs[1]) ? actionArgs[1] : undefined;
            const forwardedArgs: Parameters<ResourceActionFn> =
              actionOptions || actionArgs[1] == null
                ? [
                    actionArgs[0],
                    {
                      ...actionOptions,
                      [DIRTY_DISPATCH_TOKEN]: activeToken,
                    },
                  ]
                : actionArgs;
            resourceTokenStack.push({ key: resourceKey, token: activeToken });
            requestTokenStack.push({ key: activeToken.requestKey, token: activeToken });
            try {
              return Reflect.apply(action, receiver, forwardedArgs);
            } finally {
              requestTokenStack.pop();
              resourceTokenStack.pop();
            }
          };
        },
      });
    } finally {
      if (activeToken) {
        resourceTokenStack.pop();
      }
    }
  };

  const createDispatchReceiver = (token?: DirtyDispatchToken): DirtyAwareAPIClient => {
    const receiver = Object.create(api) as DirtyAwareAPIClient;
    Object.defineProperties(receiver, {
      request: {
        configurable: true,
        value: (<T, R, D>(config: APIClientRequestConfig): Promise<R> => {
          const options = config as ResourceRequestOptions;
          const requestKey = getRequestDispatchKey(options, context);
          const stackFrame = requestTokenStack.at(-1);
          const activeToken =
            getMatchingRequestToken(options?.[DIRTY_DISPATCH_TOKEN], requestKey) ||
            (requestKey && stackFrame?.key === requestKey ? stackFrame.token : undefined) ||
            getMatchingRequestToken(token, requestKey);
          const { [DIRTY_DISPATCH_TOKEN]: _dirtyDispatchToken, ...cleanOptions } = options;
          const configWithToken = activeToken ? { ...cleanOptions, [DIRTY_DISPATCH_TOKEN]: activeToken } : cleanOptions;
          if (activeToken) {
            activeToken.requestKey ||= requestKey;
            requestTokenStack.push({ key: requestKey, token: activeToken });
          }
          try {
            return Reflect.apply(getCurrentRequest(), proxy, [configWithToken]) as Promise<R>;
          } finally {
            if (activeToken) {
              requestTokenStack.pop();
            }
          }
        }) as APIClient['request'],
      },
      resource: {
        configurable: true,
        value: ((...args: Parameters<APIClient['resource']>) => {
          const resourceKey = getResourceDispatchKey(args[0], args[1], args[2]);
          const stackFrame = resourceTokenStack.at(-1);
          const activeToken =
            getMatchingResourceToken(token, resourceKey) ||
            (resourceKey && stackFrame?.key === resourceKey ? stackFrame.token : undefined);
          return dispatchResource(activeToken, args);
        }) as APIClient['resource'],
      },
    });
    return receiver;
  };

  const resource: APIClient['resource'] = (name, of, headers, cancel) => {
    const resourceKey = getResourceDispatchKey(name, of, headers);
    const stackFrame = resourceTokenStack.at(-1);
    const parentToken = resourceKey && stackFrame?.key === resourceKey ? stackFrame.token : undefined;
    const receiver = createDispatchReceiver(parentToken);
    const resourceInstance = Reflect.apply(baseResource, shouldUseResourceDispatchReceiver ? receiver : api, [
      name,
      of,
      headers,
      cancel,
    ]);
    return createDirtyAwareResource(context, resourceInstance, name, of, headers, requestTokenStack, parentToken);
  };

  const request = (<T, R, D>(config: APIClientRequestConfig): Promise<R> => {
    const options = config as ResourceRequestOptions;
    const requestKey = getRequestDispatchKey(options, context);
    const stackFrame = requestTokenStack.at(-1);
    const inheritedToken =
      getMatchingRequestToken(options?.[DIRTY_DISPATCH_TOKEN], requestKey) ||
      (requestKey && stackFrame?.key === requestKey ? stackFrame.token : undefined);
    const token = inheritedToken || { marked: false, skip: false };
    const ownsToken = !inheritedToken;
    token.requestKey ||= requestKey;
    if (typeof options.resource === 'string') {
      token.resourceKey ||= getResourceDispatchKey(options.resource, options.resourceOf, options.headers);
    }
    const skipDataSourceDirty = options?.[SKIP_DATA_SOURCE_DIRTY];
    if (skipDataSourceDirty) {
      token.skip = true;
    }
    const dirtyResourceAction = resolveDirtyResourceAction(options, context);
    const {
      [DIRTY_DISPATCH_TOKEN]: _dirtyDispatchToken,
      [SKIP_DATA_SOURCE_DIRTY]: _skipDataSourceDirty,
      ...cleanConfig
    } = options;
    const receiver = createDispatchReceiver(token);
    return (
      Reflect.apply(baseRequest, shouldUseRequestDispatchReceiver ? receiver : api, [cleanConfig]) as Promise<R>
    ).then((result) => {
      if (ownsToken) {
        markResourceActionDataSourceDirtyOnce(token, context, dirtyResourceAction, options.headers);
      }
      return result;
    });
  }) as APIClient['request'];

  const isLockedOwnProperty = (target: DirtyAwareAPIClient, prop: PropertyKey) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
    return !!descriptor && !descriptor.configurable;
  };

  const proxy = new Proxy(api, {
    get(target, prop, receiver) {
      if (prop === 'resource') {
        if (isLockedOwnProperty(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }
        return hasResourceOverride ? resourceOverride : resource;
      }
      if (prop === 'request') {
        if (isLockedOwnProperty(target, prop)) {
          return Reflect.get(target, prop, receiver);
        }
        return hasRequestOverride ? requestOverride : request;
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (prop === 'resource') {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
        if (descriptor && (!descriptor.configurable || !Reflect.isExtensible(target))) {
          return false;
        }
        hasResourceOverride = true;
        resourceOverride = value;
        return true;
      }
      if (prop === 'request') {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
        if (descriptor && (!descriptor.configurable || !Reflect.isExtensible(target))) {
          return false;
        }
        hasRequestOverride = true;
        requestOverride = value;
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
    deleteProperty(target, prop) {
      if (prop !== 'resource' && prop !== 'request') {
        return Reflect.deleteProperty(target, prop);
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
      if (descriptor && (!descriptor.configurable || !Reflect.isExtensible(target))) {
        return false;
      }
      if (prop === 'resource') {
        hasResourceOverride = false;
        resourceOverride = undefined;
      } else {
        hasRequestOverride = false;
        requestOverride = undefined;
      }
      return true;
    },
    defineProperty(target, prop, descriptor) {
      if (prop === 'resource' || prop === 'request') {
        return false;
      }
      return Reflect.defineProperty(target, prop, descriptor);
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
