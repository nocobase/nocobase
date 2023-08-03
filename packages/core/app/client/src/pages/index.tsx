import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import devPlugins from '../.plugins/index';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NocoBaseClientPresetPlugin],
  devPlugins,
  ws: true,
});

export default app.getRootComponent();
