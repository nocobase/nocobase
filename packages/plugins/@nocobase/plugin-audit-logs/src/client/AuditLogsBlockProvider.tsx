import { CollectionManagerProvider, TableBlockProvider } from '@nocobase/client';
import React from 'react';
import { useAuditChangesCollection, useAuditLogsCollection, useCollectionsCollection } from './collections';

export const AuditLogsBlockProvider: React.FC = ({ children, ...restProps }) => {
  const auditChangesCollection = useAuditChangesCollection();
  const auditLogsCollection = useAuditLogsCollection();
  const collectionsCollection = useCollectionsCollection();

  return (
    <CollectionManagerProvider collections={[auditLogsCollection, auditChangesCollection, collectionsCollection]}>
      <TableBlockProvider {...restProps}>{children}</TableBlockProvider>
    </CollectionManagerProvider>
  );
};
