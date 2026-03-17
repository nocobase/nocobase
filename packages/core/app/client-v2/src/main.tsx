/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client-v2';
import { AppInfoDemoPlugin } from './plugins/AppInfoDemoPlugin';

declare global {
  interface Window {
    __nocobase_public_path__?: string;
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

function inferRootPublicPathFromLocation() {
  const marker = '/v2/';
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
    return ensureSlash(fromWindow.replace(/\/v2\/$/, '/'), '/');
  }
  const fromBase = import.meta.env.BASE_URL;
  if (fromBase) {
    return ensureSlash(fromBase.replace(/\/v2\/$/, '/'), '/');
  }
  return inferRootPublicPathFromLocation();
}

function getV2PublicPath() {
  return ensureSlash(`${getRootPublicPath().replace(/\/$/, '')}/v2/`, '/v2/');
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
  plugins: [AppInfoDemoPlugin],
  loadRemotePlugins: false,
});

window.__nocobase_v2_app__ = app;
app.mount('#root');
