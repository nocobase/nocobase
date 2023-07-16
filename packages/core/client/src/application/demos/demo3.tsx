import { Application, NocoBaseBuildInPlugin } from '@nocobase/client';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NocoBaseBuildInPlugin],
});

export default app.getRootComponent();
