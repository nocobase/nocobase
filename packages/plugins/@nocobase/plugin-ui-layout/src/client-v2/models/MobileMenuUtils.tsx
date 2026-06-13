/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FileTextOutlined, LinkOutlined } from '@ant-design/icons';
import React from 'react';
import { Icon, NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from './mobileFlowCompat';

export type MobileRouteTitleTranslator = (key: string) => string;
export type MobileTabRouteCollectOptions = {
  includeHidden?: boolean;
};
export type MobileTabRoute = NocoBaseDesktopRoute & {
  type: NocoBaseDesktopRouteType.flowPage | NocoBaseDesktopRouteType.link;
};

function getRouteSort(route: NocoBaseDesktopRoute, index: number) {
  return typeof route.sort === 'number' && Number.isFinite(route.sort) ? route.sort : index;
}

export function getMobileRouteIdentity(route: NocoBaseDesktopRoute, fallbackIndex: number) {
  return (
    route.id ??
    route.schemaUid ??
    route.menuSchemaUid ??
    route.pageSchemaUid ??
    route.title ??
    `${route.type || 'unknown'}-${fallbackIndex}`
  );
}

export function getMobileRouteTabKey(route: NocoBaseDesktopRoute, fallbackIndex: number) {
  return String(
    route.schemaUid ||
      route.menuSchemaUid ||
      route.pageSchemaUid ||
      route.id ||
      getMobileRouteIdentity(route, fallbackIndex),
  );
}

export function mobileRouteTreeContainsTabKey(routes: NocoBaseDesktopRoute[] | undefined, tabKey: string | undefined) {
  if (!tabKey) {
    return false;
  }

  return (routes || []).some((route, index) => {
    if (getMobileRouteTabKey(route, index) === tabKey) {
      return true;
    }

    return mobileRouteTreeContainsTabKey(route.children, tabKey);
  });
}

export function isMobileTabRoute(route: NocoBaseDesktopRoute): route is MobileTabRoute {
  return route.type === NocoBaseDesktopRouteType.flowPage || route.type === NocoBaseDesktopRouteType.link;
}

export function isVisibleMobileTabRoute(route: NocoBaseDesktopRoute, options: MobileTabRouteCollectOptions = {}) {
  return isMobileTabRoute(route) && (options.includeHidden || (!route.hidden && !route.hideInMenu));
}

export function collectMobileTabRoutes(
  routes: NocoBaseDesktopRoute[] = [],
  options: MobileTabRouteCollectOptions = {},
) {
  return routes
    .map((route, index) => ({
      index,
      route,
      sort: getRouteSort(route, index),
    }))
    .filter(({ route }) => isVisibleMobileTabRoute(route, options))
    .sort((a, b) => a.sort - b.sort || a.index - b.index)
    .map(({ route }) => route);
}

function normalizeBasePathname(basePathname?: string) {
  const fallback = basePathname || '/mobile';
  return `/${fallback.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

export function getMobileRoutePageUid(route: NocoBaseDesktopRoute) {
  return route.schemaUid || route.pageSchemaUid || route.menuSchemaUid;
}

export function getMobilePagePath(basePathname: string | undefined, route: NocoBaseDesktopRoute) {
  const pageUid = getMobileRoutePageUid(route);
  if (!pageUid) {
    return undefined;
  }

  return `${normalizeBasePathname(basePathname)}/${encodeURIComponent(pageUid)}`;
}

export function toMobileRouterNavigationPath(pathname: string, basename?: string) {
  const normalizedPathname = normalizeBasePathname(pathname);
  const normalizedBasename = basename && basename !== '/' ? normalizeBasePathname(basename) : '';

  if (!normalizedBasename) {
    return normalizedPathname;
  }

  if (normalizedPathname === normalizedBasename) {
    return '/';
  }

  if (normalizedPathname.startsWith(`${normalizedBasename}/`)) {
    return normalizeBasePathname(normalizedPathname.slice(normalizedBasename.length));
  }

  return normalizedPathname;
}

export function getMobileRouteTitle(route: NocoBaseDesktopRoute, t: MobileRouteTitleTranslator) {
  if (route.title) {
    return t(route.title);
  }

  return getMobileRoutePageUid(route) || t('Untitled');
}

export function getMobileRouteIcon(route: NocoBaseDesktopRoute) {
  if (route.icon) {
    return <Icon type={route.icon} />;
  }

  if (route.type === NocoBaseDesktopRouteType.link) {
    return <LinkOutlined />;
  }

  return <FileTextOutlined />;
}

export function getMobileMenuItemUid(parentUid: string, route: NocoBaseDesktopRoute, index: number) {
  return `${parentUid}-mobile-menu-item-${route.type || 'unknown'}-${getMobileRouteIdentity(route, index)}`;
}
