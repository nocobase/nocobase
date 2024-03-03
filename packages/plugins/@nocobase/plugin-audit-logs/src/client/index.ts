import { Plugin, SchemaInitializerItemType } from '@nocobase/client';
import { AuditLogsProvider } from './AuditLogsProvider';
import { auditLogsTableActionColumnInitializers } from './initializers/AuditLogsTableActionColumnInitializers';
import { auditLogsTableActionInitializers } from './initializers/AuditLogsTableActionInitializers';
import { auditLogsTableColumnInitializers } from './initializers/AuditLogsTableColumnInitializers';
export * from './AuditLogsBlockInitializer';
export * from './AuditLogsProvider';

export class AuditLogsPlugin extends Plugin {
  async load() {
    this.app.use(AuditLogsProvider);
    this.app.schemaInitializerManager.add(auditLogsTableActionInitializers);
    this.app.schemaInitializerManager.add(auditLogsTableActionColumnInitializers);
    this.app.schemaInitializerManager.add(auditLogsTableColumnInitializers);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    const recordBlockInitializers = this.app.schemaInitializerManager.get('RecordBlockInitializers');
    const auditLogs: Omit<SchemaInitializerItemType, 'name'> = {
      title: '{{t("Audit logs")}}',
      Component: 'AuditLogsBlockInitializer',
    };
    blockInitializers.add('otherBlocks.auditLogs', auditLogs);
    recordBlockInitializers.add('otherBlocks.auditLogs', auditLogs);
  }
}

export default AuditLogsPlugin;
