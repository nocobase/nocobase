import { Plugin, SchemaInitializerItemType } from '@nocobase/client';
import { AuditLogsProvider } from './AuditLogsProvider';
import {
  auditLogsTableActionColumnInitializers,
  auditLogsTableActionColumnInitializers_deprecated,
} from './initializers/AuditLogsTableActionColumnInitializers';
import {
  auditLogsTableActionInitializers,
  auditLogsTableActionInitializers_deprecated,
} from './initializers/AuditLogsTableActionInitializers';
import {
  auditLogsTableColumnInitializers,
  auditLogsTableColumnInitializers_deprecated,
} from './initializers/AuditLogsTableColumnInitializers';
export * from './AuditLogsBlockInitializer';
export * from './AuditLogsProvider';

export class AuditLogsPlugin extends Plugin {
  async load() {
    this.app.use(AuditLogsProvider);
    this.app.schemaInitializerManager.add(auditLogsTableActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(auditLogsTableActionInitializers);
    this.app.schemaInitializerManager.add(auditLogsTableActionColumnInitializers_deprecated);
    this.app.schemaInitializerManager.add(auditLogsTableActionColumnInitializers);
    this.app.schemaInitializerManager.add(auditLogsTableColumnInitializers_deprecated);
    this.app.schemaInitializerManager.add(auditLogsTableColumnInitializers);

    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    const recordBlockInitializers = this.app.schemaInitializerManager.get('popup:common:addBlock');
    const auditLogs: Omit<SchemaInitializerItemType, 'name'> = {
      title: '{{t("Audit logs")}}',
      Component: 'AuditLogsBlockInitializer',
    };
    blockInitializers.add('otherBlocks.auditLogs', auditLogs);
    recordBlockInitializers.add('otherBlocks.auditLogs', auditLogs);
  }
}

export default AuditLogsPlugin;
