import { ExtendCollectionsProvider, TableBlockProvider } from '@nocobase/client';
import React from 'react';
import { useAuditChangesCollection, useAuditLogsCollection, useCollectionsCollection } from './collections';

export const AuditLogsBlockProvider: React.FC = ({ children, ...restProps }) => {
  const auditChangesCollection = useAuditChangesCollection();
  const auditLogsCollection = useAuditLogsCollection();
  const collectionsCollection = useCollectionsCollection();

  return (
    <ExtendCollectionsProvider collections={[auditLogsCollection, auditChangesCollection, collectionsCollection]}>
      <TableBlockProvider name="audit-logs" {...restProps}>
        {children}
      </TableBlockProvider>
    </ExtendCollectionsProvider>
  );
};
