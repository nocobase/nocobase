/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import type { AxiosRequestHeaders } from 'axios';
import type { MultiPortalRuntimeRecord } from './layoutRegistration';

function normalizePathname(pathname: string) {
  const normalized = pathname.trim().replace(/^\/+|\/+$/g, '');
  return normalized ? `/${normalized}` : '/';
}

function isPortalRoute(pathname: string, routePath: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRoutePath = normalizePathname(routePath);
  return normalizedPathname === normalizedRoutePath || normalizedPathname.startsWith(`${normalizedRoutePath}/`);
}

export function getPortalPathname(pathname: string, publicPath: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedPublicPath = normalizePathname(publicPath);
  const pathnameWithinPublicPath =
    normalizedPathname === normalizedPublicPath
      ? '/'
      : normalizedPathname.startsWith(`${normalizedPublicPath}/`)
        ? normalizedPathname.slice(normalizedPublicPath.length)
        : normalizedPathname;
  return normalizePathname(pathnameWithinPublicPath).replace(/^\/(?:apps|_app)\/[^/]+(?=\/|$)/, '') || '/';
}

function hasHeaderValue(headers: AxiosRequestHeaders, headerName: string) {
  const values = headers.toJSON();
  const matchedKey = Object.keys(values).find((key) => key.toLowerCase() === headerName.toLowerCase());
  const value = matchedKey ? values[matchedKey] : undefined;
  return value !== undefined && value !== null && value !== '';
}

export function getPortalNameForPathname(pathname: string, records: MultiPortalRuntimeRecord[]) {
  return [...records]
    .filter((record) => record.enabled && (record.portalType || 'no-code') === 'no-code')
    .sort((left, right) => normalizePathname(right.routePath).length - normalizePathname(left.routePath).length)
    .find((record) => isPortalRoute(pathname, record.routePath))?.portalName;
}

export function installMultiPortalRequestInterceptor(
  apiClient: Pick<Application['apiClient'], 'axios'>,
  records: MultiPortalRuntimeRecord[],
  getPathname: () => string = () => window.location.pathname,
) {
  apiClient.axios.interceptors.request.use((config) => {
    const portalName = getPortalNameForPathname(getPathname(), records);
    if (portalName && !hasHeaderValue(config.headers, 'x-portal')) {
      config.headers.set('x-portal', `/v/${portalName}`);
    }
    return config;
  });
}
