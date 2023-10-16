import { CollectionManagerProvider, SchemaInitializerProvider, TableBlockProvider } from '@nocobase/client';
import React from 'react';
import { useAuditChangesCollection, useAuditLogsCollection, useCollectionsCollection } from './collections';
import { AuditLogsTableActionColumnInitializers } from './initializers/AuditLogsTableActionColumnInitializers';
import { AuditLogsTableActionInitializers } from './initializers/AuditLogsTableActionInitializers';
import { AuditLogsTableColumnInitializers } from './initializers/AuditLogsTableColumnInitializers';

export const AuditLogsBlockProvider: React.FC = ({ children, ...restProps }) => {
  const auditChangesCollection = useAuditChangesCollection();
  const auditLogsCollection = useAuditLogsCollection();
  const collectionsCollection = useCollectionsCollection();

  return (
    <SchemaInitializerProvider
      initializers={{
        AuditLogsTableActionInitializers,
        AuditLogsTableActionColumnInitializers,
        AuditLogsTableColumnInitializers,
      }}
    >
      <CollectionManagerProvider collections={[auditLogsCollection, auditChangesCollection, collectionsCollection]}>
        <TableBlockProvider name="audit-logs" {...restProps}>
          {children}
        </TableBlockProvider>
      </CollectionManagerProvider>
    </SchemaInitializerProvider>
  );
};
