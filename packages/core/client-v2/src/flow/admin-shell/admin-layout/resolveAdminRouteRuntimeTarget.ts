/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getModernClientPrefix, getV2EffectiveBasePath } from '../../../authRedirect';
import type { BaseApplication } from '../../../BaseApplication';
import { isFlowPageRoute, NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '../../../flow-compat';
import type { LayoutDefinition } from '../../../layout-manager/types';

export type AdminRouteNavigationMode = 'spa' | 'document';
export type AdminRouteRuntimeTargetReason =
  | 'ok'
  | 'missingSchemaUid'
  | 'unsupportedV2Runtime'
  | 'emptyGroup'
  | 'unsupportedRouteType';

export type AdminRouteRuntimeTarget = {
  runtimePath: string | null;
  navigationMode: AdminRouteNavigationMode;
  isLegacy: boolean;
  reason: AdminRouteRuntimeTargetReason;
};

type LocationLike = {
  pathname: string;
  search?: string;
  hash?: string;
};

export type AdminLayoutRoutePathLike = Pick<LayoutDefinition, 'routePath'>;

type ResolveAdminRouteRuntimeTargetOptions = {
  app: Pick<BaseApplication<any>, 'getPublicPath'> & {
    router?: {
      getBasename?: () => string | undefined;
    };
  };
  route?: NocoBaseDesktopRoute;
  layout?: AdminLayoutRoutePathLike;
  location?: LocationLike;
  preserveLocationState?: boolean;
  log?: (message?: any, ...optionalParams: any[]) => void;
};

const LOG_PREFIX = '[NocoBase] Admin route runtime target:';
export const DEFAULT_ADMIN_LAYOUT_ROUTE_PATH = '/admin';

const EMPTY_TARGET: AdminRouteRuntimeTarget = {
  runtimePath: null,
  navigationMode: 'spa',
  isLegacy: false,
  reason: 'unsupportedRouteType',
};

function normalizeRootRelativePath(pathname: string) {
  const normalized = `/${String(pathname || '/').trim() || '/'}`.replace(/\/{2,}/g, '/');
  if (normalized !== '/' && normalized.endsWith('/')) {
    return normalized.replace(/\/+$/g, '');
  }
  return normalized;
}

export function getAdminLayoutRoutePath(layout?: AdminLayoutRoutePathLike | null) {
  const routePath = typeof layout?.routePath === 'string' ? layout.routePath.trim() : '';
  return routePath.startsWith('/') ? normalizeRootRelativePath(routePath) : DEFAULT_ADMIN_LAYOUT_ROUTE_PATH;
}

export function joinAdminLayoutRoutePath(
  layout: AdminLayoutRoutePathLike | null | undefined,
  pathname?: string | number | null,
) {
  const layoutRoutePath = getAdminLayoutRoutePath(layout);
  const routePath = pathname == null ? '' : String(pathname).replace(/^\/+/, '');

  if (!routePath) {
    return layoutRoutePath;
  }

  return normalizeRootRelativePath(`${layoutRoutePath}/${routePath}`);
}

function normalizePublicPath(value = '/') {
  const normalized = normalizeRootRelativePath(value || '/');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

export function isV2AdminRuntime(app?: ResolveAdminRouteRuntimeTargetOptions['app']) {
  return !!app?.getPublicPath && normalizePublicPath(app.getPublicPath()).endsWith(`/${getModernClientPrefix()}/`);
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

function getV2AdminPath(
  app: ResolveAdminRouteRuntimeTargetOptions['app'],
  schemaUid: string,
  layout?: AdminLayoutRoutePathLike,
) {
  return joinRootRelativePath(getV2EffectiveBasePath(app), joinAdminLayoutRoutePath(layout, schemaUid));
}

function appendLocationState(pathname: string, location?: LocationLike) {
  const search = location?.search ? (location.search.startsWith('?') ? location.search : `?${location.search}`) : '';
  const hash = location?.hash ? (location.hash.startsWith('#') ? location.hash : `#${location.hash}`) : '';
  return `${pathname}${search}${hash}`;
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

export function isV2MenuRoute(route: NocoBaseDesktopRoute | undefined): boolean {
  if (!route || route.hidden === true || route.hideInMenu === true) {
    return false;
  }

  if (isFlowPageRoute(route) || route.type === NocoBaseDesktopRouteType.link) {
    return true;
  }

  if (route.type === NocoBaseDesktopRouteType.group) {
    return Array.isArray(route.children) && route.children.some((child) => isV2MenuRoute(child));
  }

  return false;
}

export function findFirstV2LandingRoute(routes: NocoBaseDesktopRoute[] | undefined): NocoBaseDesktopRoute | undefined {
  if (!Array.isArray(routes)) {
    return undefined;
  }

  for (const route of routes) {
    if (!route || route.hidden === true || route.hideInMenu === true || route.type === NocoBaseDesktopRouteType.tabs) {
      continue;
    }

    if (isFlowPageRoute(route)) {
      return route;
    }

    if (route.type === NocoBaseDesktopRouteType.group) {
      const nested = findFirstV2LandingRoute(route.children);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
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

    if (route.type === NocoBaseDesktopRouteType.page || isFlowPageRoute(route)) {
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

function resolvePageRuntimeTarget(
  options: ResolveAdminRouteRuntimeTargetOptions,
  route: NocoBaseDesktopRoute,
): AdminRouteRuntimeTarget {
  const { app, preserveLocationState, location, log = console.warn } = options;

  if (!route.schemaUid) {
    logInvalidTarget(log, 'Missing schemaUid.', route);
    return {
      ...EMPTY_TARGET,
      reason: 'missingSchemaUid',
    };
  }

  if (isFlowPageRoute(route)) {
    return {
      runtimePath: getV2AdminPath(app, route.schemaUid, options.layout),
      navigationMode: 'spa' as const,
      isLegacy: false,
      reason: 'ok' as const,
    };
  }

  if (isV2AdminRuntime(app)) {
    return {
      ...EMPTY_TARGET,
      reason: 'unsupportedV2Runtime',
    };
  }

  return {
    runtimePath:
      preserveLocationState && location
        ? appendLocationState(getV2AdminPath(app, route.schemaUid, options.layout), location)
        : getV2AdminPath(app, route.schemaUid, options.layout),
    navigationMode: 'spa' as const,
    isLegacy: false,
    reason: 'ok' as const,
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

  if (route.type === NocoBaseDesktopRouteType.page || isFlowPageRoute(route)) {
    return resolvePageRuntimeTarget(options, route);
  }

  if (route.type === NocoBaseDesktopRouteType.group) {
    const firstAccessibleRoute = isV2AdminRuntime(options.app)
      ? findFirstV2LandingRoute(route.children)
      : findFirstAccessiblePageRoute(route.children);
    if (!firstAccessibleRoute) {
      return {
        ...EMPTY_TARGET,
        reason: 'emptyGroup',
      };
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
