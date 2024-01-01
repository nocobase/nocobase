import { TableBlockProvider } from '@nocobase/client';
import React from 'react';

export const AuditLogsBlockProvider: React.FC = ({ children, ...restProps }) => {
  return (
    <TableBlockProvider name="audit-logs" {...restProps}>
      {children}
    </TableBlockProvider>
  );
};
