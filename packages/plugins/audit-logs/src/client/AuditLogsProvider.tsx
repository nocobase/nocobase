import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { AuditLogs } from './AuditLogs';
import { AuditLogsBlockInitializer } from './AuditLogsBlockInitializer';

export const AuditLogsProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ AuditLogs, AuditLogsBlockInitializer }}>
      {props.children}
    </SchemaComponentOptions>
  );
};
