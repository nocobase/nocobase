import { SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import { AuditLogsBlockInitializer } from './AuditLogsBlockInitializer';
import { AuditLogsValue } from './components/AuditLogsValue';
import { AuditLogsField } from './components/AuditLogsField';
import { AuditLogsBlockProvider } from './AuditLogsBlockProvider';
import { AuditLogsTableActionColumnInitializer } from './initializers/AuditLogsTableActionColumnInitializer';
import { AuditLogs } from './deplicated/AuditLogs';
import { AuditLogsViewActionInitializer } from './components/AuditLogsViewActionInitializer';

export const AuditLogsProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{
        AuditLogs,
        AuditLogsBlockProvider,
        AuditLogsBlockInitializer,
        AuditLogsValue,
        AuditLogsField,
        AuditLogsViewActionInitializer,
        AuditLogsTableActionColumnInitializer,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
