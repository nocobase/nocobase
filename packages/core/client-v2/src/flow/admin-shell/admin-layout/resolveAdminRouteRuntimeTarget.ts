/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BaseApplication } from '../../../BaseApplication';
import { convertV2AdminPathToLegacy } from '../../../authRedirect';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../../flow-compat';

export type AdminRouteNavigationMode = 'spa' | 'document';

export type AdminRouteRuntimeTarget = {
  runtimePath: string | null;
  navigationMode: AdminRouteNavigationMode;
  isLegacy: boolean;
};

const V2_PUBLIC_PATH_SUFFIX = '/v2/';

type LocationLike = {
  pathname: string;
  search?: string;
  hash?: string;
};

type ResolveAdminRouteRuntimeTargetOptions = {
  app: Pick<BaseApplication<any>, 'getPublicPath'> & {
    router?: {
      getBasename?: () => string | undefined;
    };
  };
  route?: NocoBaseDesktopRoute;
  location?: LocationLike;
  preserveLocationState?: boolean;
  log?: (message?: any, ...optionalParams: any[]) => void;
};

const LOG_PREFIX = '[NocoBase] Admin route runtime target:';

const EMPTY_TARGET: AdminRouteRuntimeTarget = {
  runtimePath: null,
  navigationMode: 'spa',
  isLegacy: false,
};

function normalizeRootRelativePath(pathname: string) {
  const normalized = `/${String(pathname || '/').trim() || '/'}`.replace(/\/{2,}/g, '/');
  if (normalized !== '/' && normalized.endsWith('/')) {
    return normalized.replace(/\/+$/g, '');
  }
  return normalized;
}

function normalizePublicPath(value = '/') {
  const normalized = normalizeRootRelativePath(value || '/');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

/**
 * 判断当前应用是否运行在需要兼容跳回 v1 的 `/v2/` 路径下。
 *
 * @param {ResolveAdminRouteRuntimeTargetOptions['app']} app 当前应用实例
 * @returns {boolean} 是否启用 v2 到 v1 的经典页跳转
 */
function shouldUseLegacyDocumentNavigation(app: ResolveAdminRouteRuntimeTargetOptions['app']) {
  return normalizePublicPath(app.getPublicPath()).endsWith(V2_PUBLIC_PATH_SUFFIX);
}

export function toRouterNavigationPath(pathname: string, basename?: string) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  const normalizedBasename = basename && basename !== '/' ? normalizeRootRelativePath(basename) : '';

  if (!normalizedBasename) {
    return normalizedPathname;
  }

  if (normalizedPathname === normalizedBasename) {
    return '/';
  }

  if (normalizedPathname.startsWith(`${normalizedBasename}/`)) {
    return normalizeRootRelativePath(normalizedPathname.slice(normalizedBasename.length));
  }

  return normalizedPathname;
}

function joinRootRelativePath(basePath: string, pathname: string) {
  const normalizedBasePath = normalizePublicPath(basePath);
  const normalizedPathname = normalizeRootRelativePath(pathname);

  if (normalizedBasePath === '/') {
    return normalizedPathname;
  }

  if (normalizedPathname === '/') {
    return normalizedBasePath.replace(/\/+$/g, '') || '/';
  }

  return normalizeRootRelativePath(`${normalizedBasePath}${normalizedPathname.slice(1)}`);
}

function getV2AdminPath(app: ResolveAdminRouteRuntimeTargetOptions['app'], schemaUid: string) {
  return joinRootRelativePath(app.getPublicPath(), `/admin/${schemaUid}`);
}

function appendLocationState(pathname: string, location?: LocationLike) {
  const search = location?.search ? (location.search.startsWith('?') ? location.search : `?${location.search}`) : '';
  const hash = location?.hash ? (location.hash.startsWith('#') ? location.hash : `#${location.hash}`) : '';
  return `${pathname}${search}${hash}`;
}

function isSameOrDescendantPath(pathname: string, basePath: string) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  const normalizedBasePath = normalizeRootRelativePath(basePath);
  return normalizedPathname === normalizedBasePath || normalizedPathname.startsWith(`${normalizedBasePath}/`);
}

function logInvalidTarget(
  logger: ResolveAdminRouteRuntimeTargetOptions['log'],
  reason: string,
  route: NocoBaseDesktopRoute | undefined,
) {
  logger?.(LOG_PREFIX, reason, route);
}

function isSkippableRoute(route: NocoBaseDesktopRoute | undefined) {
  return (
    !!route && (route.type === NocoBaseDesktopRouteType.tabs || route.hideInMenu === true || route.hidden === true)
  );
}

export function findFirstAccessiblePageRoute(
  routes: NocoBaseDesktopRoute[] | undefined,
): NocoBaseDesktopRoute | undefined {
  if (!Array.isArray(routes)) {
    return undefined;
  }

  for (const route of routes) {
    if (isSkippableRoute(route)) {
      continue;
    }

    if (route.type === NocoBaseDesktopRouteType.page || route.type === NocoBaseDesktopRouteType.flowPage) {
      return route;
    }

    if (route.type === NocoBaseDesktopRouteType.group) {
      const nested = findFirstAccessiblePageRoute(route.children);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function resolvePageRuntimeTarget(options: ResolveAdminRouteRuntimeTargetOptions, route: NocoBaseDesktopRoute) {
  const { app, preserveLocationState, location, log = console.warn } = options;

  if (!route.schemaUid) {
    logInvalidTarget(log, 'Missing schemaUid.', route);
    return EMPTY_TARGET;
  }

  if (route.type === NocoBaseDesktopRouteType.flowPage) {
    return {
      runtimePath: getV2AdminPath(app, route.schemaUid),
      navigationMode: 'spa' as const,
      isLegacy: false,
    };
  }

  if (!shouldUseLegacyDocumentNavigation(app)) {
    return {
      runtimePath:
        preserveLocationState && location
          ? appendLocationState(getV2AdminPath(app, route.schemaUid), location)
          : getV2AdminPath(app, route.schemaUid),
      navigationMode: 'spa' as const,
      isLegacy: false,
    };
  }

  const v2RuntimePath = getV2AdminPath(app, route.schemaUid);
  const legacyPath = convertV2AdminPathToLegacy(app, v2RuntimePath);

  if (!legacyPath) {
    logInvalidTarget(log, 'Failed to resolve legacy runtimePath.', route);
    return EMPTY_TARGET;
  }

  if (preserveLocationState && location) {
    if (isSameOrDescendantPath(location.pathname, v2RuntimePath)) {
      const correctedCurrentPath = convertV2AdminPathToLegacy(app, location);
      if (correctedCurrentPath) {
        return {
          runtimePath: correctedCurrentPath,
          navigationMode: 'document' as const,
          isLegacy: true,
        };
      }
    }

    return {
      runtimePath: appendLocationState(legacyPath, location),
      navigationMode: 'document' as const,
      isLegacy: true,
    };
  }

  return {
    runtimePath: legacyPath,
    navigationMode: 'document' as const,
    isLegacy: true,
  };
}

/**
 * 将 desktop route 解析为实际运行时跳转目标。
 *
 * @param {ResolveAdminRouteRuntimeTargetOptions} options 解析参数
 * @returns {AdminRouteRuntimeTarget} 运行时目标
 */
export function resolveAdminRouteRuntimeTarget(
  options: ResolveAdminRouteRuntimeTargetOptions,
): AdminRouteRuntimeTarget {
  const { route, log = console.warn } = options;

  if (!route) {
    return EMPTY_TARGET;
  }

  if (route.type === NocoBaseDesktopRouteType.page || route.type === NocoBaseDesktopRouteType.flowPage) {
    return resolvePageRuntimeTarget(options, route);
  }

  if (route.type === NocoBaseDesktopRouteType.group) {
    const firstAccessibleRoute = findFirstAccessiblePageRoute(route.children);
    if (!firstAccessibleRoute) {
      return EMPTY_TARGET;
    }
    return resolveAdminRouteRuntimeTarget({
      ...options,
      route: firstAccessibleRoute,
    });
  }

  if (route.type !== NocoBaseDesktopRouteType.link) {
    logInvalidTarget(log, 'Unsupported route type.', route);
  }

  return EMPTY_TARGET;
}
