

import { Application, NocoBaseBuildInPlugin } from '../../index';

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
  plugins: [NocoBaseBuildInPlugin],
});

export default app.getRootComponent();
