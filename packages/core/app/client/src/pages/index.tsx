import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import devDynamicImport from '../.plugins/index';

export const app = new Application({
  apiClient: {
    // @ts-ignore
    baseURL: window['__nocobase_api_base_url__'] || '/api/',
  },
  // @ts-ignore
  publicPath: window['__nocobase_public_path__'] || '/',
  plugins: [NocoBaseClientPresetPlugin],
  ws: {
    // @ts-ignore
    url: window['__nocobase_ws_url__'] || '',
    // @ts-ignore
    basename: window['__nocobase_ws_path__'] || '/ws',
  },
  loadRemotePlugins: true,
  devDynamicImport,
});

export default app.getRootComponent();
