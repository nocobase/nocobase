import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { createAuditLogsBlockSchema } from './createAuditLogsBlockSchema';

export const AuditLogsBlockInitializer = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const itemConfig = useSchemaInitializerItem();

  const schema = createAuditLogsBlockSchema();

  return (
    <SchemaInitializerItem
      icon={<TableOutlined />}
      onClick={() => {
        insert(schema as ISchema);
      }}
      title={t('Audit Logs')}
      {...itemConfig}
    />
  );
};
