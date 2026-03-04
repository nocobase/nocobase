/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client-v2';

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

function inferV2PublicPathFromLocation() {
  const marker = '/v2/';
  const index = window.location.pathname.indexOf(marker);
  if (index >= 0) {
    return ensureSlash(window.location.pathname.slice(0, index + marker.length), '/v2/');
  }
  return '/v2/';
}

function getV2PublicPath() {
  const fromWindow = window.__nocobase_public_path__;
  if (fromWindow) {
    return ensureSlash(fromWindow, '/v2/');
  }
  const fromBase = import.meta.env.BASE_URL;
  if (fromBase) {
    return ensureSlash(fromBase, '/v2/');
  }
  return inferV2PublicPathFromLocation();
}

function getRootPublicPath(v2PublicPath: string) {
  return v2PublicPath.replace(/\/v2\/$/, '/');
}

function parseShareToken(value: boolean | string | undefined) {
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value || '').toLowerCase() === 'true';
}

const v2PublicPath = getV2PublicPath();
const rootPublicPath = getRootPublicPath(v2PublicPath);

const app = new Application({
  publicPath: v2PublicPath,
  apiClient: {
    shareToken: parseShareToken(window.__nocobase_api_client_share_token__ || import.meta.env.API_CLIENT_SHARE_TOKEN),
    storageType:
      window.__nocobase_api_client_storage_type__ || import.meta.env.API_CLIENT_STORAGE_TYPE || 'localStorage',
    storagePrefix:
      window.__nocobase_api_client_storage_prefix__ || import.meta.env.API_CLIENT_STORAGE_PREFIX || 'NOCOBASE_',
    baseURL: window.__nocobase_api_base_url__ || import.meta.env.API_BASE_URL || `${rootPublicPath}api/`,
  },
  ws: {
    url: window.__nocobase_ws_url__ || import.meta.env.WS_URL || '',
    basename: window.__nocobase_ws_path__ || import.meta.env.WS_PATH || `${rootPublicPath}ws`,
  },
  loadRemotePlugins: false,
});

window.__nocobase_v2_app__ = app;
app.mount('#root');
