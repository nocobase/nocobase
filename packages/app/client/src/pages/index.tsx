import '@/theme';
import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';
import { Spin } from 'antd';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  dynamicImport: (name: string) => {
    return import(`../plugins/${name}`);
  },
  components: {
    AppSpin: Spin,
  },
  plugins: [NocoBaseClientPresetPlugin],
});

export default app.getRootComponent();
