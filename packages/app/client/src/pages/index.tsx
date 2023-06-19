import '@/theme';
import { Application, NoCoBaseProvidersPlugin } from '@nocobase/client';
import { NoCoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NoCoBaseProvidersPlugin, NoCoBaseClientPresetPlugin],
});

export default app.getRootComponent();
