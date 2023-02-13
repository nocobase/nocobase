import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { ArrayTable } from '@formily/antd';
import { AuditLogs } from './AuditLogs';
import { AuditLogsBlockInitializer } from './AuditLogsBlockInitializer';
import { Username, Collection, Field, Value } from './components/values';

export const AuditLogsProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{
        AuditLogs,
        AuditLogsBlockInitializer,
        AuditLogsArrayTable: ArrayTable,
        AuditLogsUsername: Username,
        AuditLogsCollection: Collection,
        AuditLogsField: Field,
        AuditLogsValue: Value,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
