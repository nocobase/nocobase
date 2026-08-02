/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, getModernClientPrefix } from '@nocobase/client-v2';
import devDynamicImport from './.plugins';
import { NocoBaseClientPresetPluginV2 } from '@nocobase/preset-nocobase/client-v2';
import { resolveRuntimeAssetPublicPath } from './runtimePublicPath';

declare global {
  interface Window {
    __nocobase_public_path__?: string;
    __nocobase_modern_client_prefix__?: string;
    __webpack_public_path__?: string;
    __nocobase_api_base_url__?: string;
    __nocobase_api_client_storage_prefix__?: string;
    __nocobase_api_client_storage_type__?: string;
    __nocobase_api_client_share_token__?: boolean | string;
    __nocobase_ws_url__?: string;
    __nocobase_ws_path__?: string;
    __nocobase_v2_app__?: Application;
  }
}

function ensureSlash(pathname: string, fallback: string) {
  if (!pathname) {
    return fallback;
  }
  let normalized = pathname.trim();
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

function getModernPrefixSuffix() {
  return `/${getModernClientPrefix()}/`;
}

function stripPrefixSuffix(value: string) {
  const suffix = getModernPrefixSuffix();
  if (value.endsWith(suffix)) {
    return ensureSlash(value.slice(0, value.length - suffix.length), '/');
  }
  return ensureSlash(value, '/');
}

function inferRootPublicPathFromLocation() {
  const marker = getModernPrefixSuffix();
  const pathname = window.location.pathname;
  const index = pathname.indexOf(marker);
  if (index >= 0) {
    return ensureSlash(pathname.slice(0, index), '/');
  }
  return '/';
}

function getRootPublicPath() {
  const fromWindow = window.__nocobase_public_path__;
  if (fromWindow) {
    return stripPrefixSuffix(ensureSlash(fromWindow, '/'));
  }
  const fromBase = import.meta.env.BASE_URL;
  if (fromBase) {
    return stripPrefixSuffix(ensureSlash(fromBase, '/'));
  }
  return inferRootPublicPathFromLocation();
}

function getV2PublicPath() {
  const suffix = getModernPrefixSuffix();
  return ensureSlash(`${getRootPublicPath().replace(/\/$/, '')}${suffix}`, suffix);
}

function parseShareToken(value: boolean | string | undefined) {
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value || '').toLowerCase() === 'true';
}

type ClientStorageType = 'localStorage' | 'sessionStorage' | 'memory';

function parseStorageType(value: string | undefined): ClientStorageType {
  if (value === 'sessionStorage' || value === 'memory' || value === 'localStorage') {
    return value;
  }
  return 'localStorage';
}

const rootPublicPath = getRootPublicPath();
const v2PublicPath = getV2PublicPath();

// The fixed build-output directory segment baked into asset paths at build time
// (e.g. `v`), derived from the baked BASE_URL. Distinct from the runtime
// modern-client prefix, which may be overridden per-deployment.
function getBuildAssetDir() {
  const base = (import.meta.env.BASE_URL || '/v/').replace(/\/+$/, '');
  return base.split('/').pop() || 'v';
}

// Point dynamically-imported chunks of the main bundle at the runtime modern
// client asset path, so a runtime prefix override / sub-path deployment / CDN
// works without rebuilding (mirrors AutoInjectPublicPathPlugin used for plugins).
// `__webpack_public_path__` is a webpack magic global that must be assigned.
declare let __webpack_public_path__: string;
const cdnBase = window.__webpack_public_path__;
// eslint-disable-next-line prefer-const
__webpack_public_path__ = resolveRuntimeAssetPublicPath(cdnBase, v2PublicPath, getBuildAssetDir());

const app = new Application({
  publicPath: v2PublicPath,
  apiClient: {
    shareToken: parseShareToken(window.__nocobase_api_client_share_token__ || import.meta.env.API_CLIENT_SHARE_TOKEN),
    storageType: parseStorageType(
      window.__nocobase_api_client_storage_type__ || import.meta.env.API_CLIENT_STORAGE_TYPE,
    ),
    storagePrefix:
      window.__nocobase_api_client_storage_prefix__ || import.meta.env.API_CLIENT_STORAGE_PREFIX || 'NOCOBASE_',
    baseURL: window.__nocobase_api_base_url__ || import.meta.env.API_BASE_URL || `${rootPublicPath}api/`,
  },
  ws: {
    url: window.__nocobase_ws_url__ || import.meta.env.WS_URL || '',
    basename: window.__nocobase_ws_path__ || import.meta.env.WS_PATH || `${rootPublicPath}ws`,
  },
  loadRemotePlugins: true,
  devDynamicImport,
  plugins: [NocoBaseClientPresetPluginV2 as any],
});

window.__nocobase_v2_app__ = app;
app.mount('#root');
