import {
  CollectionManagerProvider,
  SchemaInitializerContext,
  SchemaInitializerProvider,
  TableBlockProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { useAuditChangesCollection, useAuditLogsCollection, useCollectionsCollection } from './collections';
import { AuditLogsTableActionColumnInitializers } from './initializers/AuditLogsTableActionColumnInitializers';
import { AuditLogsTableActionInitializers } from './initializers/AuditLogsTableActionInitializers';
import { AuditLogsTableColumnInitializers } from './initializers/AuditLogsTableColumnInitializers';

export const AuditLogsBlockProvider: React.FC = ({ children, ...restProps }) => {
  const initializers = useContext(SchemaInitializerContext);
  const auditChangesCollection = useAuditChangesCollection();
  const auditLogsCollection = useAuditLogsCollection();
  const collectionsCollection = useCollectionsCollection();

  return (
    <SchemaInitializerProvider
      initializers={{
        ...initializers,
        AuditLogsTableActionInitializers,
        AuditLogsTableActionColumnInitializers,
        AuditLogsTableColumnInitializers,
      }}
    >
      <CollectionManagerProvider collections={[auditLogsCollection, auditChangesCollection, collectionsCollection]}>
        <TableBlockProvider {...restProps}>{children}</TableBlockProvider>
      </CollectionManagerProvider>
    </SchemaInitializerProvider>
  );
};
