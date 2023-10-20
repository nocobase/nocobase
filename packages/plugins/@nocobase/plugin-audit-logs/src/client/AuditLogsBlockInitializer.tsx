import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { createTableBlockSchema, SchemaInitializerItem, useSchemaInitializerV2 } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const AuditLogsBlockInitializer = (props) => {
  const { insert } = useSchemaInitializerV2();
  const { t } = useTranslation();

  const schema = createTableBlockSchema({
    collection: 'auditLogs',
    rowKey: 'id',
    tableActionInitializers: 'AuditLogsTableActionInitializers',
    tableColumnInitializers: 'AuditLogsTableColumnInitializers',
    tableActionColumnInitializers: 'AuditLogsTableActionColumnInitializers',
    tableBlockProvider: 'AuditLogsBlockProvider',
    disableTemplate: true,
  });

  return (
    <SchemaInitializerItem
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert(schema as ISchema);
      }}
      title={t('Audit Logs')}
    />
  );
};
