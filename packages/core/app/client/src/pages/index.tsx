import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import devDynamicImport from '../.plugins/index';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  publicPath: process.env.APP_PUBLIC_PATH,
  plugins: [NocoBaseClientPresetPlugin],
  ws: {
    url: process.env.WEBSOCKET_URL,
    basename: process.env.WS_PATH || '/ws',
  },
  loadRemotePlugins: true,
  devDynamicImport,
});

export default app.getRootComponent();
