import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const AuditLogsBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'AuditLogs.Designer',
          'x-component': 'AuditLogs',
          'x-component-props': {},
          'x-decorator': 'CardItem',
        });
      }}
      title={t('Audit Logs')}
    />
  );
};
