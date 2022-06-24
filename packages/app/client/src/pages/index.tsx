import { Application } from '@nocobase/client';

const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
});

app.use(require('@nocobase/plugin-export/client').default);
app.use(require('@nocobase/plugin-audit-logs/client').default);

export default app.render();
