import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuditLogsSchema } from './AuditLogs';

export const AuditLogsBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();

  const auditLogsSchema = useAuditLogsSchema();

  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'AuditLogs.Designer',
          'x-decorator': 'AuditLogs.Decorator',
          'x-decorator-props': {
            params: {},
          },
          'x-component': 'CardItem',
          properties: {
            auditLogs: auditLogsSchema,
          },
        });
      }}
      title={t('Audit Logs')}
    />
  );
};
