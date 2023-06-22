import { Application, NoCoBaseBuildInPlugin } from '@nocobase/client';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NoCoBaseBuildInPlugin],
});

export default app.getRootComponent();
