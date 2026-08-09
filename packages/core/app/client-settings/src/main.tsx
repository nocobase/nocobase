/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import devDynamicImport from './.plugins';
import type { PluginClass } from '@nocobase/client-v2';
import { SettingsApplication } from '../../../client-v2/src/settings-app/SettingsApplication';
import { SettingsPresetPlugin } from './SettingsPresetPlugin';
import { resolveSettingsAssetPublicPath } from './runtimePublicPath';
import { resolveSettingsRuntimeScope } from './runtimeScope';

declare global {
  interface Window {
    __nocobase_public_path__?: string;
    __webpack_public_path__?: string;
    __nocobase_api_base_url__?: string;
    __nocobase_api_client_storage_prefix__?: string;
    __nocobase_api_client_storage_type__?: string;
    __nocobase_api_client_share_token__?: boolean | string;
    __nocobase_ws_url__?: string;
    __nocobase_ws_path__?: string;
  }
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

const configuredPublicPath = window.__nocobase_public_path__ || import.meta.env.APP_PUBLIC_PATH || '/';
const runtimeScope = resolveSettingsRuntimeScope(configuredPublicPath, window.location.pathname);
const SettingsPresetPluginClass = SettingsPresetPlugin as unknown as PluginClass;

declare let __webpack_public_path__: string;
// eslint-disable-next-line prefer-const
__webpack_public_path__ = resolveSettingsAssetPublicPath(window.__webpack_public_path__, runtimeScope.rootPublicPath);

const app = new SettingsApplication({
  name: runtimeScope.appName,
  publicPath: runtimeScope.rootPublicPath,
  router: {
    basename: runtimeScope.basename,
  },
  apiClient: {
    shareToken: parseShareToken(window.__nocobase_api_client_share_token__ || import.meta.env.API_CLIENT_SHARE_TOKEN),
    storageType: parseStorageType(
      window.__nocobase_api_client_storage_type__ || import.meta.env.API_CLIENT_STORAGE_TYPE,
    ),
    storagePrefix:
      window.__nocobase_api_client_storage_prefix__ || import.meta.env.API_CLIENT_STORAGE_PREFIX || 'NOCOBASE_',
    baseURL: window.__nocobase_api_base_url__ || import.meta.env.API_BASE_URL || `${runtimeScope.rootPublicPath}api/`,
  },
  ws: {
    url: window.__nocobase_ws_url__ || import.meta.env.WS_URL || '',
    basename: window.__nocobase_ws_path__ || import.meta.env.WS_PATH || `${runtimeScope.rootPublicPath}ws`,
  },
  loadRemotePlugins: true,
  devDynamicImport,
  plugins: [SettingsPresetPluginClass],
});

app.mount('#root');
