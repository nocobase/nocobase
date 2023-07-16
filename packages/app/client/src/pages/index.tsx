import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';

export const app = new Application({
  apiClientOptions: {
    baseURL: process.env.API_BASE_URL,
  },
  dynamicImport: (name: string) => {
    return import(`../plugins/${name}`);
  },
  plugins: [NocoBaseClientPresetPlugin],
});

export default app.getRootComponent();
