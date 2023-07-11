import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NocoBaseClientPresetPlugin],
});

export default app.getRootComponent();
