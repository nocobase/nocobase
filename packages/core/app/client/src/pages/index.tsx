/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import devDynamicImport from '../.plugins/index';

export const app = new Application({
  apiClient: {
    storageType:
      // @ts-ignore
      window['__nocobase_api_client_storage_type__'] || process.env.API_CLIENT_STORAGE_TYPE || 'localStorage',
    // @ts-ignore
    storagePrefix:
      // @ts-ignore
      window['__nocobase_api_client_storage_prefix__'] || process.env.API_CLIENT_STORAGE_PREFIX || 'NOCOBASE_',
    // @ts-ignore
    baseURL: window['__nocobase_api_base_url__'] || process.env.API_BASE_URL || '/api/',
  },
  // @ts-ignore
  publicPath: window['__nocobase_public_path__'] || process.env.APP_PUBLIC_PATH || '/',
  plugins: [NocoBaseClientPresetPlugin],
  ws: {
    // @ts-ignore
    url: window['__nocobase_ws_url__'] || process.env.WEBSOCKET_URL || '',
    // @ts-ignore
    basename: window['__nocobase_ws_path__'] || process.env.WS_PATH || '/ws',
  },
  loadRemotePlugins: true,
  devDynamicImport,
});

export default app.getRootComponent();
