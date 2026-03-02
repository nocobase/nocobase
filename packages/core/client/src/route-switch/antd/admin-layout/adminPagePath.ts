/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NocoBaseDesktopRouteType } from './convertRoutesToSchema';

export const ADMIN_V1_PAGE_PREFIX = '/admin/v1';
export const ADMIN_V2_PAGE_PREFIX = '/admin/v2';

export type AdminPathLogger = Pick<Console, 'warn'>;

export type AdminPageRouteLike = {
  schemaUid?: string;
  type?: NocoBaseDesktopRouteType | string;
};

const normalizePathSuffix = (suffix: string | undefined) => {
  if (!suffix) {
    return '';
  }
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
};

const warnUnknownRouteType = (type: string, logger: AdminPathLogger = console) => {
  logger.warn?.(`[admin-route] Unknown route type "${type}", fallback to ${ADMIN_V1_PAGE_PREFIX}.`);
};

export const getAdminPagePathPrefixByType = (
  type?: NocoBaseDesktopRouteType | string,
  options?: { logger?: AdminPathLogger },
) => {
  if (type === NocoBaseDesktopRouteType.flowPage) {
    return ADMIN_V2_PAGE_PREFIX;
  }
  if (type === NocoBaseDesktopRouteType.page || type == null) {
    return ADMIN_V1_PAGE_PREFIX;
  }

  warnUnknownRouteType(String(type), options?.logger);
  return ADMIN_V1_PAGE_PREFIX;
};

export const getAdminPagePathBySchemaUid = (
  schemaUid: string | undefined,
  type?: NocoBaseDesktopRouteType | string,
  options?: { suffix?: string; logger?: AdminPathLogger },
) => {
  if (!schemaUid) {
    return '';
  }
  const prefix = getAdminPagePathPrefixByType(type, options);
  return `${prefix}/${schemaUid}${normalizePathSuffix(options?.suffix)}`;
};

export const getAdminPagePathByRoute = (
  route: AdminPageRouteLike | null | undefined,
  options?: { suffix?: string; logger?: AdminPathLogger },
) => {
  return getAdminPagePathBySchemaUid(route?.schemaUid, route?.type, options);
};

export const getAdminGroupPath = (groupId: number | string | undefined) => {
  if (groupId == null) {
    return '/admin';
  }
  return `/admin/${groupId}`;
};

export const getLegacyAdminPathSuffix = (pathname: string, currentPageUid: string) => {
  if (!currentPageUid) {
    return '';
  }
  const legacyPrefix = `/admin/${currentPageUid}`;
  if (!pathname.startsWith(legacyPrefix)) {
    return '';
  }
  return pathname.slice(legacyPrefix.length);
};

export const buildLegacyAdminRedirectPath = (options: {
  pathname: string;
  search?: string;
  currentPageUid: string;
  route: AdminPageRouteLike | null | undefined;
  logger?: AdminPathLogger;
}) => {
  const suffix = getLegacyAdminPathSuffix(options.pathname, options.currentPageUid);
  const targetPath = getAdminPagePathByRoute(options.route, { suffix, logger: options.logger });
  if (!targetPath) {
    return '';
  }
  return `${targetPath}${options.search || ''}`;
};
