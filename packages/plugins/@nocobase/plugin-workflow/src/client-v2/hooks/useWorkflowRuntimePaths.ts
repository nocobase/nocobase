/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { getWorkflowCanvasPath, getWorkflowExecutionPath } from '../constants';

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

function normalizeRootRelativePath(value = '/') {
  const normalized = `/${String(value || '/').trim() || '/'}`.replace(/\/{2,}/g, '/');
  if (normalized !== '/' && normalized.endsWith('/')) {
    return normalized.replace(/\/+$/g, '');
  }
  return normalized;
}

function normalizePublicPath(value = '/') {
  const normalized = normalizeRootRelativePath(value);
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

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

/**
 * Workflow's v2 React pieces are intentionally reused by both runtimes during
 * the progressive migration:
 *
 * - pure v2 runtime: mounted under the modern client prefix (`/v/admin/...` by
 *   default), with workflow canvas / execution routes at `/admin/workflow/...`
 * - legacy v1 runtime: some actions still render through v1 pages and must jump
 *   back to the legacy settings routes at `/admin/settings/workflow/...`
 *
 * The runtime marker comes from the server-injected public path plus the modern
 * client prefix:
 *
 * - v1 shell: `__nocobase_public_path__` stays on the app root (for example
 *   `/nocobase/`), even though `__nocobase_modern_client_prefix__` may still be
 *   present
 * - v2 shell: `__nocobase_public_path__` points to the modern client base (for
 *   example `/nocobase/v/`)
 *
 * Callers should use these helpers instead of directly importing
 * `client-v2/constants.ts` when the code can execute in both shells.
 */
export function isWorkflowV2Runtime() {
  if (isPathnameInModernClientRuntime()) {
    return true;
  }

  // In normal runtime bootstrap `__nocobase_public_path__` is always injected:
  // v1 root shell uses `/` or `/app-root/`, while v2 uses `/v/` or
  // `/app-root/v/`. Once public path is present and did not resolve to the
  // modern base above, we are running under the legacy shell.
  if (hasConfiguredPublicPath()) {
    return false;
  }

  // Defensive fallback for incomplete test/mocked environments where public
  // path was not injected but the modern prefix still exists.
  if (isPathnameInModernClientRuntimeByPrefix()) {
    return true;
  }

  if (typeof window !== 'undefined' && window.location?.pathname) {
    return false;
  }

  return hasModernClientPrefix();
}

export function getWorkflowCanvasRuntimePath(id: string | number) {
  if (isWorkflowV2Runtime()) {
    return getWorkflowCanvasPath(id);
  }
  return `/admin/settings/workflow/workflows/${id}`;
}

export function getWorkflowExecutionRuntimePath(id: string | number) {
  if (isWorkflowV2Runtime()) {
    return getWorkflowExecutionPath(id);
  }
  return `/admin/settings/workflow/executions/${id}`;
}

export function useWorkflowRuntimePaths() {
  const getCanvasPath = useMemoizedFn((id: string | number) => getWorkflowCanvasRuntimePath(id));
  const getExecutionPath = useMemoizedFn((id: string | number) => getWorkflowExecutionRuntimePath(id));

  return {
    isV2Runtime: isWorkflowV2Runtime(),
    getWorkflowCanvasPath: getCanvasPath,
    getWorkflowExecutionPath: getExecutionPath,
  };
}
