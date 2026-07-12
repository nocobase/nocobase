/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare global {
  interface Window {
    __nocobase_public_path__?: string;
    __webpack_public_path__?: string;
  }
}

function normalizePublicPath(value: string | undefined, fallback = '/') {
  let normalized = value?.trim() || fallback;
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

export function resolveRuntimeAssetPublicPath(
  cdnPublicPath: string | undefined,
  appPublicPath: string | undefined,
  runtimePublicPath: string | undefined,
) {
  return normalizePublicPath(
    cdnPublicPath,
    normalizePublicPath(appPublicPath, normalizePublicPath(runtimePublicPath, '/')),
  );
}

// `__webpack_public_path__` is a webpack magic global that must be assigned
// before any lazy-loaded chunk request happens.
declare let __webpack_public_path__: string;

const runtimePublicPath = typeof __webpack_public_path__ === 'string' ? __webpack_public_path__ : undefined;

if (typeof window !== 'undefined' && typeof __webpack_public_path__ !== 'undefined') {
  // eslint-disable-next-line prefer-const
  __webpack_public_path__ = resolveRuntimeAssetPublicPath(
    window.__webpack_public_path__,
    window.__nocobase_public_path__,
    runtimePublicPath,
  );
}
