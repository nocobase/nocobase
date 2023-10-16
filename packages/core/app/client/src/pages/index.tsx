import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import devDynamicImport from '../.plugins/index';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NocoBaseClientPresetPlugin],
  ws: true,
  loadRemotePlugins: true,
  devDynamicImport,
});

export default app.getRootComponent();
