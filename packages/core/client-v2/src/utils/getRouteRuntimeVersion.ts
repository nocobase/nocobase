/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RouteRuntimeVersion = 'legacy' | 'modern';

declare global {
  interface Window {
    __nocobase_modern_client_prefix__?: string;
    __nocobase_public_path__?: string;
  }
}

function hasModernClientPrefix() {
  return (
    typeof window !== 'undefined' &&
    typeof window.__nocobase_modern_client_prefix__ === 'string' &&
    window.__nocobase_modern_client_prefix__.trim().length > 0
  );
}

function hasConfiguredPublicPath() {
  return typeof window !== 'undefined' && typeof window.__nocobase_public_path__ === 'string';
}

/** Normalize any app/public-path-like input into a root-relative pathname:
 *
 * - `nocobase//v/` -> `/nocobase/v`
 * - `/` -> `/`
 */
function normalizeRootRelativePath(value = '/') {
  const normalized = `/${String(value || '/').trim() || '/'}`.replace(/\/{2,}/g, '/');
  if (normalized !== '/' && normalized.endsWith('/')) {
    return normalized.replace(/\/+$/g, '');
  }
  return normalized;
}

/** Public-path form always ends with `/`, so it can be compared as a base path:
 *
 * - `/nocobase/v` -> `/nocobase/v/`
 * - `/` -> `/`
 */
function normalizePublicPath(value = '/') {
  const normalized = normalizeRootRelativePath(value);
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

/** Check whether a concrete pathname is rendered under a runtime base path:
 *
 * - pathname `/nocobase/v/admin/workflow/workflows/1`
 *   basePath `/nocobase/v/`
 *   => true
 *
 * - pathname `/nocobase/admin/settings/workflow/workflows/1`
 *   basePath `/nocobase/v/`
 *   => false
 */
function isPathnameInsideBasePath(pathname: string, basePath: string) {
  const normalizedPathname = normalizeRootRelativePath(pathname);
  const normalizedBasePath = normalizePublicPath(basePath);
  const trimmedBasePath = normalizedBasePath.replace(/\/+$/g, '') || '/';

  if (trimmedBasePath === '/') {
    return true;
  }

  return normalizedPathname === trimmedBasePath || normalizedPathname.startsWith(`${trimmedBasePath}/`);
}

function getNormalizedModernClientPrefix() {
  if (typeof window === 'undefined') {
    return '';
  }

  const prefix = window.__nocobase_modern_client_prefix__?.trim();
  return prefix ? prefix.replace(/^\/+|\/+$/g, '') : '';
}

/** Derive the actual modern-client base path from injected globals.
 *
 * Only returns a value when `__nocobase_public_path__` itself already points to
 * the modern client shell:
 *
 * - legacy shell:
 *   `__nocobase_public_path__ = "/nocobase/"`
 *   `__nocobase_modern_client_prefix__ = "v"`
 *   => `""`
 *
 * - modern shell:
 *   `__nocobase_public_path__ = "/nocobase/v/"`
 *   `__nocobase_modern_client_prefix__ = "v"`
 *   => `"/nocobase/v/"`
 */
function getModernClientBasePath() {
  const normalizedPrefix = getNormalizedModernClientPrefix();
  if (!normalizedPrefix) {
    return '';
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const publicPath = window.__nocobase_public_path__?.trim();
  if (publicPath && normalizePublicPath(publicPath).endsWith(`/${normalizedPrefix}/`)) {
    return normalizePublicPath(publicPath);
  }

  return '';
}

/** True only when the current page is actually running under the resolved
 * modern-client base path.
 *
 * Example:
 * - pathname `/v/admin/workflow/workflows/1`, modern base `/v/` => true
 * - pathname `/admin/settings/workflow/workflows/1`, modern base `/v/` => false
 */
function isPathnameInModernClientRuntime() {
  if (typeof window === 'undefined') {
    return false;
  }

  const pathname = window.location?.pathname ?? '';
  const modernClientBasePath = getModernClientBasePath();
  if (!pathname || !modernClientBasePath) {
    return false;
  }

  return isPathnameInsideBasePath(pathname, modernClientBasePath);
}

/** Fallback for incomplete/mocked environments where public path was not
 * injected but the modern prefix still exists.
 *
 * Example:
 * - pathname `/v/admin/workflow/workflows/1`
 *   `__nocobase_modern_client_prefix__ = "v"`
 *   `__nocobase_public_path__` missing
 *   => true
 */
function isPathnameInModernClientRuntimeByPrefix() {
  if (typeof window === 'undefined') {
    return false;
  }

  const normalizedPrefix = getNormalizedModernClientPrefix();
  const pathname = window.location?.pathname ?? '';
  if (!normalizedPrefix || !pathname) {
    return false;
  }

  return isPathnameInsideBasePath(pathname, normalizePublicPath(normalizedPrefix));
}

/** Resolve which client shell currently owns the route.
 *
 * - returns `modern` when the current page is actually mounted under the modern
 *   client base path (`/v/`, `/nocobase/v/`, ...)
 * - returns `legacy` when the route is still under the legacy shell, even if the
 *   modern prefix global has been injected into the page
 */
export function getRouteRuntimeVersion(): RouteRuntimeVersion {
  if (typeof window === 'undefined') {
    return hasModernClientPrefix() ? 'modern' : 'legacy';
  }

  if (hasConfiguredPublicPath()) {
    return isPathnameInModernClientRuntime() ? 'modern' : 'legacy';
  }

  // Defensive fallback for incomplete test/mocked environments where public
  // path was not injected but the modern prefix still exists.
  if (isPathnameInModernClientRuntimeByPrefix()) {
    return 'modern';
  }

  return 'legacy';
}
