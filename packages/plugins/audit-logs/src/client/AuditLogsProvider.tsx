import { SchemaComponentOptions, SchemaInitializerContext, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import { AuditLogsBlockInitializer } from './AuditLogsBlockInitializer';
import { AuditLogsValue } from './components/AuditLogsValue';
import { AuditLogsField } from './components/AuditLogsField';
import { AuditLogsBlockProvider } from './AuditLogsBlockProvider';
import { AuditLogsTableActionColumnInitializer } from './initializers/AuditLogsTableActionColumnInitializer';

export const AuditLogsProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{
        AuditLogsBlockProvider,
        AuditLogsBlockInitializer,
        AuditLogsValue,
        AuditLogsField,
        AuditLogsTableActionColumnInitializer,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
