import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import devDynamicImport from '../.plugins/index';

export const app = new Application({
  apiClient: {
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
