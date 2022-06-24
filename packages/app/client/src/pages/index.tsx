import { Application } from '@nocobase/client';
import { AuditLogsProvider } from '@nocobase/plugin-audit-logs/client';
import { ExportPluginProvider } from '@nocobase/plugin-export/client';

const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
  },
});

app.use(AuditLogsProvider);
app.use(ExportPluginProvider);

export default app.compose();
