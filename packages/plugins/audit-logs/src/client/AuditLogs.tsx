import { ISchema } from '@formily/react';
import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { AuditLogsDesigner } from './AuditLogsDesigner';

const schema: ISchema = {
  type: 'void',
  'x-content': 'Audit logs',
};

export const AuditLogs: any = () => {
  return <div>Audit logs</div>
  return <SchemaComponent schema={schema} />;
};

AuditLogs.Designer = AuditLogsDesigner;
