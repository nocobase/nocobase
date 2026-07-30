/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getCorsWhitelist, isSameOrigin, type OriginContext } from '@nocobase/utils';
import { namespace } from '../../preset';
import { buildRedirectPath, type BuildRedirectPathOptions } from './buildRedirectPath';

export interface AuthRedirectOriginContext extends OriginContext {
  t(key: string, options?: { ns?: string }): string;
  throw(status: number, message: string): never;
}

function isRootRelativePath(value: string) {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

function isPortalPath(value: string, appPublicPath?: string | null) {
  const normalizedAppPublicPath = (appPublicPath || '').replace(/\/+$/, '');
  const pathname = value.split(/[?#]/, 1)[0];
  if (normalizedAppPublicPath && !pathname.startsWith(`${normalizedAppPublicPath}/`)) {
    return false;
  }
  const pathnameWithinPublicPath = pathname.slice(normalizedAppPublicPath.length);
  return pathnameWithinPublicPath === '/x' || pathnameWithinPublicPath.startsWith('/x/');
}

function resolveAbsoluteUrl(ctx: AuthRedirectOriginContext, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    ctx.throw(400, ctx.t('Invalid sign-in origin', { ns: namespace }));
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    ctx.throw(400, ctx.t('Invalid sign-in origin', { ns: namespace }));
  }
  const whitelist = getCorsWhitelist();
  if (!isSameOrigin(ctx, url.origin) && !whitelist?.has(url.origin)) {
    ctx.throw(400, ctx.t('Invalid sign-in origin', { ns: namespace }));
  }
  return url;
}

function resolveSafeAuthRedirect(ctx: AuthRedirectOriginContext, target?: string | null) {
  const value = typeof target === 'string' ? target.trim() : '';
  if (isRootRelativePath(value)) return value;
  return value ? resolveAbsoluteUrl(ctx, value).toString() : null;
}

/**
 * Resolve an SSO callback target without creating an open redirect.
 *
 * Existing NocoBase clients use root-relative paths and still need the app
 * public path/sub-app prefix handling provided by `buildRedirectPath`.
 * Standalone Portal development runs on another origin, so an absolute target
 * is also accepted when that origin is trusted by the server's CORS policy.
 */
export function resolveAuthRedirect(
  ctx: AuthRedirectOriginContext,
  { appPublicPath, subAppSegment, target }: BuildRedirectPathOptions,
) {
  const safeRedirect = resolveSafeAuthRedirect(ctx, target) || '/admin';
  const resolvedTarget =
    isRootRelativePath(safeRedirect) && !isPortalPath(safeRedirect, appPublicPath)
      ? buildRedirectPath({ appPublicPath, subAppSegment, target: safeRedirect })
      : safeRedirect;
  return { safeRedirect, target: resolvedTarget };
}

/** Append or replace callback parameters while preserving query and hash. */
export function appendAuthRedirectQuery(
  target: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(target);
  const url = new URL(target, 'http://nocobase.local');
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    url.searchParams.set(key, value === null ? '' : String(value));
  }
  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}
