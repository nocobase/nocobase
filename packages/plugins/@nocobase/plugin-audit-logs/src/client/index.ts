import { Plugin } from '@nocobase/client';
import { AuditLogsProvider } from './AuditLogsProvider';
export * from './AuditLogsBlockInitializer';
export * from './AuditLogsProvider';

export class AuditLogsPlugin extends Plugin {
  async load() {
    this.app.use(AuditLogsProvider);
  }
}

export default AuditLogsPlugin;
